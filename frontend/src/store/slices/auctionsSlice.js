/**
 * Redux slice for auction management.
 *
 * ENHANCED AUCTION FEATURES:
 * - min_price: Floor price for bids
 * - buyout_price: Instant purchase option
 * - bidder_category: Category-based tie-breaking (Premium > Plus > Standard)
 * - winner_category: Records winner's category
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// =============================================================================
// ASYNC THUNKS
// =============================================================================

export const fetchAuctions = createAsyncThunk(
  'auctions/fetchAll',
  async (activeOnly = true, { rejectWithValue }) => {
    try {
      const data = await api.getAuctions(activeOnly);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAuction = createAsyncThunk(
  'auctions/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.getAuction(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Create a new auction with enhanced features.
 * @param {Object} params - Auction parameters
 * @param {number} params.flagId - ID of the flag to auction
 * @param {string} params.walletAddress - Seller's wallet address
 * @param {number} params.startingPrice - Starting price in MATIC
 * @param {number} params.minPrice - Minimum bid price (floor)
 * @param {number|null} params.buyoutPrice - Optional instant purchase price
 * @param {number} params.durationHours - Auction duration (1-168 hours)
 */
export const createAuction = createAsyncThunk(
  'auctions/create',
  async ({ flagId, walletAddress, startingPrice, minPrice, buyoutPrice, durationHours }, { dispatch, rejectWithValue }) => {
    try {
      const data = await api.createAuction({
        flag_id: flagId,
        wallet_address: walletAddress,
        starting_price: startingPrice,
        min_price: minPrice,
        buyout_price: buyoutPrice,
        duration_hours: durationHours,
      });
      dispatch(fetchAuctions(true));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Place a bid on an auction with category for tie-breaking.
 * @param {Object} params - Bid parameters
 * @param {number} params.auctionId - Auction ID
 * @param {string} params.walletAddress - Bidder's wallet address
 * @param {number} params.amount - Bid amount in MATIC
 * @param {string} params.bidderCategory - Bidder's category ('standard', 'plus', 'premium')
 */
export const placeBid = createAsyncThunk(
  'auctions/placeBid',
  async ({ auctionId, walletAddress, amount, bidderCategory = 'standard' }, { dispatch, rejectWithValue }) => {
    try {
      await api.placeBid(auctionId, walletAddress, amount, bidderCategory);
      dispatch(fetchAuction(auctionId));
      return { auctionId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Instant buyout of an auction at the buyout price.
 * @param {Object} params - Buyout parameters
 * @param {number} params.auctionId - Auction ID
 * @param {string} params.walletAddress - Buyer's wallet address
 */
export const buyoutAuction = createAsyncThunk(
  'auctions/buyout',
  async ({ auctionId, walletAddress }, { dispatch, rejectWithValue }) => {
    try {
      const data = await api.buyoutAuction(auctionId, walletAddress);
      dispatch(fetchAuctions(true));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const closeAuction = createAsyncThunk(
  'auctions/close',
  async (auctionId, { dispatch, rejectWithValue }) => {
    try {
      const data = await api.closeAuction(auctionId);
      dispatch(fetchAuctions(false)); // Refresh all auctions
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelAuction = createAsyncThunk(
  'auctions/cancel',
  async ({ auctionId, walletAddress }, { dispatch, rejectWithValue }) => {
    try {
      await api.cancelAuction(auctionId, walletAddress);
      dispatch(fetchAuctions(true));
      return { auctionId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  auctions: [],
  currentAuction: null,
  loading: false,
  actionLoading: false,
  error: null,
};

// =============================================================================
// SLICE DEFINITION
// =============================================================================

const auctionsSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    clearCurrentAuction: (state) => {
      state.currentAuction = null;
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
      // Fetch all auctions
      .addCase(fetchAuctions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctions.fulfilled, (state, action) => {
        state.loading = false;
        state.auctions = action.payload;
      })
      .addCase(fetchAuctions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single auction
      .addCase(fetchAuction.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAuction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAuction = action.payload;
      })
      .addCase(fetchAuction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create auction
      .addCase(createAuction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAuction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentAuction = action.payload;
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Place bid
      .addCase(placeBid.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(placeBid.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Buyout auction
      .addCase(buyoutAuction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(buyoutAuction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentAuction = action.payload;
      })
      .addCase(buyoutAuction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Close auction
      .addCase(closeAuction.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(closeAuction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentAuction = action.payload;
      })
      .addCase(closeAuction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Cancel auction
      .addCase(cancelAuction.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(cancelAuction.fulfilled, (state) => {
        state.actionLoading = false;
        state.currentAuction = null;
      })
      .addCase(cancelAuction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export const { clearCurrentAuction, clearError, setActionLoading } = auctionsSlice.actions;
export default auctionsSlice.reducer;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectAuctions = (state) => state.auctions.auctions;
export const selectCurrentAuction = (state) => state.auctions.currentAuction;
export const selectAuctionsLoading = (state) => state.auctions.loading;
export const selectActionLoading = (state) => state.auctions.actionLoading;
export const selectAuctionsError = (state) => state.auctions.error;

// Derived selectors
export const selectActiveAuctions = (state) =>
  state.auctions.auctions.filter((a) => a.status === 'active');

export const selectAuctionsWithBuyout = (state) =>
  state.auctions.auctions.filter((a) => a.buyout_price !== null);
