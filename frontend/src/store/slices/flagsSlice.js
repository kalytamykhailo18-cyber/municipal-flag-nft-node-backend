import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';
import { getPriceWithDiscount } from '../../services/web3';

// Async thunks
export const fetchFlag = createAsyncThunk(
  'flags/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.getFlag(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPopularFlags = createAsyncThunk(
  'flags/fetchPopular',
  async (limit = 4, { rejectWithValue }) => {
    try {
      const data = await api.getPopularFlags(limit);
      return data.map(r => r.flag);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDiscountedPrice = createAsyncThunk(
  'flags/fetchDiscountedPrice',
  async ({ flagId, address }, { rejectWithValue }) => {
    try {
      const price = await getPriceWithDiscount(flagId, address);
      return { flagId, price };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerInterest = createAsyncThunk(
  'flags/registerInterest',
  async ({ flagId, address }, { dispatch, rejectWithValue }) => {
    try {
      await api.registerInterest(flagId, address);
      // Refetch flag to update interests
      dispatch(fetchFlag(flagId));
      return { flagId, address };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const claimFirstNFT = createAsyncThunk(
  'flags/claimFirst',
  async ({ flagId, address, transactionHash }, { dispatch, rejectWithValue }) => {
    try {
      await api.claimFirstNFT(flagId, address, transactionHash);
      dispatch(fetchFlag(flagId));
      return { flagId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const purchaseSecondNFT = createAsyncThunk(
  'flags/purchaseSecond',
  async ({ flagId, address, transactionHash }, { dispatch, rejectWithValue }) => {
    try {
      await api.purchaseSecondNFT(flagId, address, transactionHash);
      dispatch(fetchFlag(flagId));
      return { flagId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentFlag: null,
  popularFlags: [],
  discountedPrices: {},
  loading: false,
  actionLoading: false,
  error: null,
};

const flagsSlice = createSlice({
  name: 'flags',
  initialState,
  reducers: {
    clearCurrentFlag: (state) => {
      state.currentFlag = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setActionLoading: (state, action) => {
      state.actionLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch single flag
      .addCase(fetchFlag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlag.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFlag = action.payload;
      })
      .addCase(fetchFlag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch popular flags
      .addCase(fetchPopularFlags.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPopularFlags.fulfilled, (state, action) => {
        state.loading = false;
        state.popularFlags = action.payload;
      })
      .addCase(fetchPopularFlags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch discounted price
      .addCase(fetchDiscountedPrice.fulfilled, (state, action) => {
        state.discountedPrices[action.payload.flagId] = action.payload.price;
      })
      // Register interest
      .addCase(registerInterest.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(registerInterest.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(registerInterest.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Claim first NFT
      .addCase(claimFirstNFT.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(claimFirstNFT.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(claimFirstNFT.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Purchase second NFT
      .addCase(purchaseSecondNFT.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(purchaseSecondNFT.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(purchaseSecondNFT.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentFlag, clearError, setActionLoading } = flagsSlice.actions;
export default flagsSlice.reducer;

// Selectors
export const selectCurrentFlag = (state) => state.flags.currentFlag;
export const selectPopularFlags = (state) => state.flags.popularFlags;
export const selectFlagsLoading = (state) => state.flags.loading;
export const selectActionLoading = (state) => state.flags.actionLoading;
export const selectFlagsError = (state) => state.flags.error;
export const selectDiscountedPrice = (flagId) => (state) => state.flags.discountedPrices[flagId];
