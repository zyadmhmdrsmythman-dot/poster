import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice.js";
import connectionsReducer from "../features/connections/connectionsSlice.js";
import messagesReducer from "../features/messages/messsagesSlice.js"; // تأكد من اسم الملف الصحيح

export const store = configureStore({
  reducer: {
    user: userReducer,
    connections: connectionsReducer,
    messages: messagesReducer, // موحدة بالجمع لتجنب الالتباس
  },
});