import { useEffect, useRef, useState } from "react";
import dbRef, {
  connectedRef,
  firestore,
  roomId,
  userName,
  server,
} from "./firebase/firebase";
import {
  child,
  onChildAdded,
  onChildRemoved,
  onDisconnect,
  onValue,
  set,
} from "firebase/database";
import { useSelector, useDispatch } from "react-redux";
import {
  removeParticipants,
  setCurrentUser,
  setParticipants,
} from "../redux/user/userSlice";
import { RootStateType } from "../redux";
import {
  DocumentData,
  DocumentReference,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

interface RefProps {
  srcObject: MediaStream;
  mute?: boolean;
}

function App() {
  const participantRef = child(dbRef, "participants");
  const user = useSelector((state: RootStateType) => state.user.currentUser);
  const dispatch = useDispatch();
  const [identity, setidenity] = useState("");
  const localRef = useRef<RefProps>();
  const remoteRef = useRef<RefProps>();

  async function getIceCandicate(
    roomRef: DocumentReference<DocumentData, DocumentData>,
    peerConnection: RTCPeerConnection,
    localName: string,
    remoteName: string
  ) {
    const candicatesCollection = collection(roomRef, localName);
    try {
      peerConnection.onicecandidate = async (event) => {
        event.candidate &&
          (await addDoc(candicatesCollection, event.candidate.toJSON()));
        peerConnection.onicecandidateerror = (error) => {
          console.log("error", error);
        };

        const remoteCandicatesCollection = collection(roomRef, remoteName);
        onSnapshot(remoteCandicatesCollection, (snap) => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              await peerConnection.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        });
      };
    } catch (err) {
      console.error(err);
    }
  }

  async function getConnection() {
    //取得使用者視訊流
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const remoteStream = new MediaStream();

    const peerConnection = new RTCPeerConnection(server);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    if (localRef.current && remoteRef.current && localStream) {
      localRef.current.srcObject = localStream;
      remoteRef.current.srcObject = remoteStream;
    }
    if (!roomId) {
      const roomRef = doc(collection(firestore, "rooms"), id || "");
      await setDoc(roomRef, {});

      const offerDescription = await peerConnection.createOffer();
      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };
      await peerConnection.setLocalDescription(offerDescription);
      await setDoc(roomRef, { offer });

      onSnapshot(roomRef, async (snap) => {
        const data = snap.data();
        if (data?.answer && !peerConnection.currentRemoteDescription) {
          const rtcSessionDescription = new RTCSessionDescription(data.answer);
          await peerConnection.setRemoteDescription(rtcSessionDescription);
        }
      });

      getIceCandicate(
        roomRef,
        peerConnection,
        "calleeCandicate",
        "callerCandicate"
      );
    } else {
      const roomRef = doc(firestore, "rooms", id || "");
      const roomSnapshot = await getDoc(roomRef);

      const offerDescription = roomSnapshot.data()?.offer;
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerDescription)
      );

      const answerDescription = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answerDescription);

      const answer = {
        sdp: answerDescription.sdp,
        type: answerDescription.type,
      };
      await updateDoc(roomRef, { answer });

      getIceCandicate(
        roomRef,
        peerConnection,
        "callerCandicate",
        "calleeCandicate"
      );
    }
  }

  useEffect(() => {
    onValue(connectedRef, (snap) => {
      if (snap.val()) {
        const defaultPreferences = {
          audio: true,
          video: false,
          screen: false,
        };
        dispatch(
          setCurrentUser({
            userName,
            ...defaultPreferences,
          })
        );
        if (roomId) {
          setidenity("guest");
          const userRef = child(participantRef, "guest");
          set(userRef, {
            userName,
            identity: "guest",
            preferences: defaultPreferences,
          });
          onDisconnect(userRef).remove();
        } else {
          setidenity("host");
          const userRef = child(participantRef, "host");
          set(userRef, {
            userName,
            identity: "host",
            preferences: defaultPreferences,
          });
          onDisconnect(userRef).remove();
        }
      }
    });
  }, []);
  useEffect(() => {
    if (user) {
      onChildAdded(participantRef, (snap) => {
        const { userName, preferences, identity } = snap.val();
        dispatch(
          setParticipants({
            [identity]: {
              userName,
              ...preferences,
            },
          })
        );
        onChildRemoved(participantRef, (snap) => {
          dispatch(removeParticipants(snap.key));
        });
      });
    }
  }, [user]);
  useEffect(() => {
    getConnection();
  }, [identity]);
  return (
    <>
      <video
        ref={localRef as React.LegacyRef<HTMLVideoElement>}
        autoPlay
        playsInline
      ></video>
      <video
        ref={remoteRef as React.LegacyRef<HTMLVideoElement>}
        autoPlay
        playsInline
      ></video>
    </>
  );
}

export default App;

// peerConnection.ontrack = (event) => {
//   event.streams[0].getTracks().forEach((track) => {
//     remoteStream.addTrack(track);
//   });
// };
