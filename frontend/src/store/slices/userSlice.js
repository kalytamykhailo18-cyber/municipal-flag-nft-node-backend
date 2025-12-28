import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (address, { rejectWithValue }) => {
    try {
      const data = await api.getUser(address);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserFlags = createAsyncThunk(
  'user/fetchFlags',
  async (address, { rejectWithValue }) => {
    try {
      const data = await api.getUserFlags(address);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserInterests = createAsyncThunk(
  'user/fetchInterests',
  async (address, { rejectWithValue }) => {
    try {
      const data = await api.getUserInterests(address);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserData = createAsyncThunk(
  'user/fetchAll',
  async (address, { dispatch, rejectWithValue }) => {
    try {
      const [profile, flags, interests] = await Promise.all([
        api.getUser(address),
        api.getUserFlags(address),
        api.getUserInterests(address),
      ]);
      return { profile, flags, interests };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  profile: null,
  flags: [],
  interests: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.profile = null;
      state.flags = [];
      state.interests = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all user data
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.flags = action.payload.flags;
        state.interests = action.payload.interests;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch flags
      .addCase(fetchUserFlags.fulfilled, (state, action) => {
        state.flags = action.payload;
      })
      // Fetch interests
      .addCase(fetchUserInterests.fulfilled, (state, action) => {
        state.interests = action.payload;
      });
  },
});

export const { clearUserData, clearError } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectUserProfile = (state) => state.user.profile;
export const selectUserFlags = (state) => state.user.flags;
export const selectUserInterests = (state) => state.user.interests;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
