import { createSlice } from "@reduxjs/toolkit";

interface CurrentUser {
  userName: string;
  audio: boolean;
  video: boolean;
  screen: boolean;
}

interface Patricipants {
  [key: string]: {
    userName: string;
    audio: boolean;
    video: boolean;
    screen: boolean;
  };
}

interface StateProps {
  currentUser: CurrentUser | null;
  participants: Patricipants;
}

const initialState: StateProps = {
  currentUser: null,
  participants: {},
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setParticipants: (state, action) => {
      state.participants = { ...state.participants, ...action.payload };
    },
    removeParticipants: (state, action) => {
      const { payload } = action;
      delete state.participants[payload];
    },
  },
});

export const { setCurrentUser, setParticipants, removeParticipants } =
  userSlice.actions;

export default userSlice.reducer;
