import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// Async thunks
export const fetchAllRankings = createAsyncThunk(
  'rankings/fetchAll',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const [users, collectors, flags] = await Promise.all([
        api.getUserRankings(limit),
        api.getCollectorRankings(limit),
        api.getPopularFlags(limit),
      ]);
      return { users, collectors, flags };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserRankings = createAsyncThunk(
  'rankings/fetchUsers',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const data = await api.getUserRankings(limit);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCollectorRankings = createAsyncThunk(
  'rankings/fetchCollectors',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const data = await api.getCollectorRankings(limit);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFlagRankings = createAsyncThunk(
  'rankings/fetchFlags',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const data = await api.getPopularFlags(limit);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  userRankings: [],
  collectorRankings: [],
  flagRankings: [],
  loading: false,
  error: null,
};

const rankingsSlice = createSlice({
  name: 'rankings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all rankings
      .addCase(fetchAllRankings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRankings.fulfilled, (state, action) => {
        state.loading = false;
        state.userRankings = action.payload.users;
        state.collectorRankings = action.payload.collectors;
        state.flagRankings = action.payload.flags;
      })
      .addCase(fetchAllRankings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch user rankings
      .addCase(fetchUserRankings.fulfilled, (state, action) => {
        state.userRankings = action.payload;
      })
      // Fetch collector rankings
      .addCase(fetchCollectorRankings.fulfilled, (state, action) => {
        state.collectorRankings = action.payload;
      })
      // Fetch flag rankings
      .addCase(fetchFlagRankings.fulfilled, (state, action) => {
        state.flagRankings = action.payload;
      });
  },
});

export const { clearError } = rankingsSlice.actions;
export default rankingsSlice.reducer;

// Selectors
export const selectUserRankings = (state) => state.rankings.userRankings;
export const selectCollectorRankings = (state) => state.rankings.collectorRankings;
export const selectFlagRankings = (state) => state.rankings.flagRankings;
export const selectRankingsLoading = (state) => state.rankings.loading;
export const selectRankingsError = (state) => state.rankings.error;
