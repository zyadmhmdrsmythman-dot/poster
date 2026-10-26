import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const initialState = {
  value: null,
};

export const fetchUser = createAsyncThunk("user/fetchUser", async (token) => {
  const { data } = await api.get("/api/user/data", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.success ? data.user : null;
});

export const UpdateUser = createAsyncThunk(
  "uaer/update",
  async ({ userData, token }) => {
    const { data } = await api.post("/api/user/update", userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.success) {
      toast.success(data.message);
      return data.user;
    } else {
      toast.error(data.message);
      return null;
    }
  },
);

const userSlice = createSlice({
    name:"user",
    initialState,
    reducers:{
        setUser:(state ,action)=>{
            state.value = action.payload
        },
    },
    extraReducers:(builder)=>{
        builder.addCase(fetchUser.fulfilled , (state , action)=>{
            state.value = action.payload?.user || action.payload;
        })
        .addCase(UpdateUser.fulfilled,(state , action)=>{
            state.value = action.payload?.user || action.payload;
    })
    },
})

export const {setUser} = userSlice.actions

export default userSlice.reducer