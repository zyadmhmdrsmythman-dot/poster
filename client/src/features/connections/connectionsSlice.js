import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  connections: [],
  pendingConnections: [],
  sentConnections: [],
  followers: [],
  following: [],
};

export const fetchConnections = createAsyncThunk(
  "connections/fetchConnections",
  async (token, { rejectWithValue }) => {
    try {
      // ✅ تمرير body فارغ أولاً {} ثم كائن الـ config والـ headers ثانياً
      const { data } = await api.post(
        "/api/user/connections",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) {
        return {
          connections: [],
          pendingConnections: [],
          sentConnections: [],
          followers: [],
          following: [],
        };
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch connections"
      );
    }
  }
);

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchConnections.fulfilled, (state, action) => {
      state.connections = action.payload.connections || [];
      state.pendingConnections = action.payload.pendingConnections || [];
      state.sentConnections = action.payload.sentConnections || [];
      state.followers = action.payload.followers || [];
      state.following = action.payload.following || [];
    });
  },
});

export default connectionsSlice.reducer;