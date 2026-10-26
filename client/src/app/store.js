import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice.js"
import connectionsReducer from "../features/connections/connectionsSlice.js"
import messsagesReducer from "../features/messages/messsagesSlice.js"
export const store = configureStore({
    reducer:{
        user:userReducer,
        // connections:connectionsReducer,
        message:messsagesReducer
    }
})