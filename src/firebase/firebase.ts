import { initializeApp } from "firebase/app";
import { getDatabase, ref, child, push } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLFqkaz54H-hfomuIWQexMKZronQD8nA0",
  authDomain: "webrtcsimple-a91f9.firebaseapp.com",
  databaseURL:
    "https://webrtcsimple-a91f9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "webrtcsimple-a91f9",
  storageBucket: "webrtcsimple-a91f9.appspot.com",
  messagingSenderId: "1049705353237",
  appId: "1:1049705353237:web:f1dad4ab1305d9c9ac3e1c",
  measurementId: "G-XD6NCJ0WH3",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export let dbRef = ref(db);
export const connectedRef = ref(db, ".info/connected");

const urlParams = new URLSearchParams(window.location.search);
export const roomId = urlParams.get("id");

export const userName = prompt("What's your name?"); //指示頁面彈出輸入框取得使用者名稱

if (roomId) {
  dbRef = child(dbRef, roomId);
} else {
  dbRef = push(ref(db));
  window.history.replaceState(null, "Meet", `?id=${dbRef.key}`);
}

export default dbRef;

const server = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
export const peerConnection = new RTCPeerConnection(server);
