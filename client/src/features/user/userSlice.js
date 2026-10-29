import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const initialState = {
  value: null,
  loading: false,
};


export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (token, { rejectWithValue }) => {
    try {
      if (!token) return null;

      const { data } = await api.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        return data.user;
      } else {
        return rejectWithValue(data.message || "Failed to fetch user");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Network Error"
      );
    }
  }
);

export const UpdateUser = createAsyncThunk(
  "user/update",
  async ({ userData, token }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/user/update", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message || "Profile updated successfully");
        return data.user;
      } else {
        toast.error(data.message || "Update failed");
        return rejectWithValue(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.value = action.payload;
    },
    clearUser: (state) => {
      state.value = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.value = action.payload;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.loading = false;
        state.value = null;
      })
      // Update User
      .addCase(UpdateUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.value = action.payload;
        }
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;