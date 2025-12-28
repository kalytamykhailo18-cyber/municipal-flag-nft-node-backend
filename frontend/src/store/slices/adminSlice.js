/**
 * Admin Redux Slice
 *
 * VISUAL ADMIN CRUD INTERFACE:
 * - Complete CRUD operations for Countries, Regions, Municipalities, Flags
 * - Admin authentication with admin key
 * - Statistics and IPFS management
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// =============================================================================
// AUTHENTICATION THUNKS
// =============================================================================

export const authenticate = createAsyncThunk(
  'admin/authenticate',
  async (adminKey, { rejectWithValue }) => {
    try {
      const stats = await api.getAdminStats(adminKey);
      return { stats, adminKey };
    } catch (error) {
      return rejectWithValue('Invalid admin key');
    }
  }
);

export const fetchAdminStats = createAsyncThunk(
  'admin/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.getAdminStats(adminKey);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// COUNTRY CRUD THUNKS
// =============================================================================

export const fetchAdminCountries = createAsyncThunk(
  'admin/fetchCountries',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.getCountries(false); // Get all, including hidden
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCountry = createAsyncThunk(
  'admin/createCountry',
  async (countryData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.createCountry(countryData, adminKey);
      dispatch(fetchAdminCountries());
      dispatch(fetchAdminStats());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCountry = createAsyncThunk(
  'admin/updateCountry',
  async ({ countryId, countryData }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.updateCountry(countryId, countryData, adminKey);
      dispatch(fetchAdminCountries());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCountry = createAsyncThunk(
  'admin/deleteCountry',
  async (countryId, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.deleteCountry(countryId, adminKey);
      dispatch(fetchAdminCountries());
      dispatch(fetchAdminStats());
      return countryId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleCountryVisibility = createAsyncThunk(
  'admin/toggleCountryVisibility',
  async ({ countryId, isVisible }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.updateCountry(countryId, { is_visible: !isVisible }, adminKey);
      dispatch(fetchAdminCountries());
      return { countryId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// REGION CRUD THUNKS
// =============================================================================

export const fetchAdminRegions = createAsyncThunk(
  'admin/fetchRegions',
  async (countryId = null, { rejectWithValue }) => {
    try {
      const data = await api.getRegions(countryId, false); // Get all, including hidden
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createRegion = createAsyncThunk(
  'admin/createRegion',
  async (regionData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.createRegion(regionData, adminKey);
      dispatch(fetchAdminRegions());
      dispatch(fetchAdminStats());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRegion = createAsyncThunk(
  'admin/updateRegion',
  async ({ regionId, regionData }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.updateRegion(regionId, regionData, adminKey);
      dispatch(fetchAdminRegions());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRegion = createAsyncThunk(
  'admin/deleteRegion',
  async (regionId, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.deleteRegion(regionId, adminKey);
      dispatch(fetchAdminRegions());
      dispatch(fetchAdminStats());
      return regionId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleRegionVisibility = createAsyncThunk(
  'admin/toggleRegionVisibility',
  async ({ regionId, isVisible }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.updateRegion(regionId, { is_visible: !isVisible }, adminKey);
      dispatch(fetchAdminRegions());
      return { regionId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// MUNICIPALITY CRUD THUNKS
// =============================================================================

export const fetchAdminMunicipalities = createAsyncThunk(
  'admin/fetchMunicipalities',
  async (regionId = null, { rejectWithValue }) => {
    try {
      const data = await api.getMunicipalities(regionId, false); // Get all, including hidden
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createMunicipality = createAsyncThunk(
  'admin/createMunicipality',
  async (municipalityData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.createMunicipality(municipalityData, adminKey);
      dispatch(fetchAdminMunicipalities());
      dispatch(fetchAdminStats());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMunicipality = createAsyncThunk(
  'admin/updateMunicipality',
  async ({ municipalityId, municipalityData }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.updateMunicipality(municipalityId, municipalityData, adminKey);
      dispatch(fetchAdminMunicipalities());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMunicipality = createAsyncThunk(
  'admin/deleteMunicipality',
  async (municipalityId, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.deleteMunicipality(municipalityId, adminKey);
      dispatch(fetchAdminMunicipalities());
      dispatch(fetchAdminStats());
      return municipalityId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleMunicipalityVisibility = createAsyncThunk(
  'admin/toggleMunicipalityVisibility',
  async ({ municipalityId, isVisible }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.updateMunicipality(municipalityId, { is_visible: !isVisible }, adminKey);
      dispatch(fetchAdminMunicipalities());
      return { municipalityId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// FLAG CRUD THUNKS
// =============================================================================

export const fetchAdminFlags = createAsyncThunk(
  'admin/fetchFlags',
  async (municipalityId = null, { rejectWithValue }) => {
    try {
      const data = await api.getFlags(municipalityId, null, false);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createFlag = createAsyncThunk(
  'admin/createFlag',
  async (flagData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.createFlag(flagData, adminKey);
      dispatch(fetchAdminFlags());
      dispatch(fetchAdminStats());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateFlag = createAsyncThunk(
  'admin/updateFlag',
  async ({ flagId, flagData }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.updateFlag(flagId, flagData, adminKey);
      dispatch(fetchAdminFlags());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// UTILITY THUNKS
// =============================================================================

export const seedDemoData = createAsyncThunk(
  'admin/seedDemo',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      await api.seedDemoData(adminKey);
      dispatch(fetchAdminStats());
      dispatch(fetchAdminCountries());
      dispatch(fetchAdminRegions());
      dispatch(fetchAdminMunicipalities());
      dispatch(fetchAdminFlags());
      return 'Demo data seeded successfully!';
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const syncIpfsFromPinata = createAsyncThunk(
  'admin/syncIpfs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const result = await api.syncIpfsFromPinata(adminKey);
      return result.message || 'IPFS sync completed successfully!';
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIpfsStatus = createAsyncThunk(
  'admin/fetchIpfsStatus',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.getIpfsStatus(adminKey);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// DEMO USER THUNKS
// =============================================================================

export const createDemoUser = createAsyncThunk(
  'admin/createDemoUser',
  async (demoUserData = {}, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.createDemoUser(adminKey, demoUserData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDemoUser = createAsyncThunk(
  'admin/fetchDemoUser',
  async (walletAddress, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.getDemoUser(adminKey, walletAddress);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const seedDemoUserOwnership = createAsyncThunk(
  'admin/seedDemoUserOwnership',
  async (ownershipData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.seedDemoOwnership(adminKey, ownershipData);
      // Refresh demo user data to show updated ownerships
      dispatch(fetchDemoUser());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDemoUser = createAsyncThunk(
  'admin/deleteDemoUser',
  async (walletAddress, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.deleteDemoUser(adminKey, walletAddress);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// NFT GENERATION THUNKS
// =============================================================================

export const createNFTFromCoordinates = createAsyncThunk(
  'admin/createNFTFromCoordinates',
  async (nftData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.createNFTFromCoordinates(adminKey, nftData);
      // Refresh flags list after successful creation
      dispatch(fetchAdminFlags());
      dispatch(fetchAdminStats());
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkStreetView = createAsyncThunk(
  'admin/checkStreetView',
  async ({ latitude, longitude }, { getState, rejectWithValue }) => {
    try {
      const { adminKey } = getState().admin;
      const data = await api.checkStreetViewAvailability(adminKey, latitude, longitude);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Authentication
  authenticated: false,
  adminKey: null,

  // Statistics
  stats: null,

  // Entity lists (for CRUD management)
  countries: [],
  regions: [],
  municipalities: [],
  flags: [],

  // IPFS status
  ipfsStatus: null,

  // Demo user
  demoUser: null,
  demoOwnershipResult: null,

  // NFT Generation
  nftGenerationResult: null,
  nftGenerating: false,
  checkingStreetView: false,
  streetViewAvailable: null,
  previewImages: [], // Images from SerpAPI for preview

  // UI states
  loading: false,
  actionLoading: false,
  message: null,
  error: null,

  // Selected filters
  selectedCountryId: null,
  selectedRegionId: null,
  selectedMunicipalityId: null,
};

// =============================================================================
// SLICE DEFINITION
// =============================================================================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    logout: (state) => {
      state.authenticated = false;
      state.adminKey = null;
      state.stats = null;
      state.countries = [];
      state.regions = [];
      state.municipalities = [];
      state.flags = [];
      state.demoUser = null;
      state.demoOwnershipResult = null;
    },
    clearMessage: (state) => {
      state.message = null;
      state.error = null;
    },
    clearDemoUser: (state) => {
      state.demoUser = null;
      state.demoOwnershipResult = null;
    },
    clearNftGenerationResult: (state) => {
      state.nftGenerationResult = null;
      state.streetViewAvailable = null;
      state.previewImages = [];
    },
    setSelectedCountryId: (state, action) => {
      state.selectedCountryId = action.payload;
      state.selectedRegionId = null;
      state.selectedMunicipalityId = null;
    },
    setSelectedRegionId: (state, action) => {
      state.selectedRegionId = action.payload;
      state.selectedMunicipalityId = null;
    },
    setSelectedMunicipalityId: (state, action) => {
      state.selectedMunicipalityId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // =======================================================================
      // AUTHENTICATION
      // =======================================================================
      .addCase(authenticate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticate.fulfilled, (state, action) => {
        state.loading = false;
        state.authenticated = true;
        state.adminKey = action.payload.adminKey;
        state.stats = action.payload.stats;
      })
      .addCase(authenticate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =======================================================================
      // FETCH STATS
      // =======================================================================
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // =======================================================================
      // COUNTRIES CRUD
      // =======================================================================
      .addCase(fetchAdminCountries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminCountries.fulfilled, (state, action) => {
        state.loading = false;
        state.countries = action.payload;
      })
      .addCase(fetchAdminCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCountry.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCountry.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Country created successfully';
      })
      .addCase(createCountry.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateCountry.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCountry.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Country updated successfully';
      })
      .addCase(updateCountry.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteCountry.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteCountry.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Country deleted successfully';
      })
      .addCase(deleteCountry.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleCountryVisibility.rejected, (state, action) => {
        state.error = action.payload;
      })

      // =======================================================================
      // REGIONS CRUD
      // =======================================================================
      .addCase(fetchAdminRegions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminRegions.fulfilled, (state, action) => {
        state.loading = false;
        state.regions = action.payload;
      })
      .addCase(fetchAdminRegions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRegion.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createRegion.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Region created successfully';
      })
      .addCase(createRegion.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateRegion.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateRegion.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Region updated successfully';
      })
      .addCase(updateRegion.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteRegion.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteRegion.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Region deleted successfully';
      })
      .addCase(deleteRegion.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleRegionVisibility.rejected, (state, action) => {
        state.error = action.payload;
      })

      // =======================================================================
      // MUNICIPALITIES CRUD
      // =======================================================================
      .addCase(fetchAdminMunicipalities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminMunicipalities.fulfilled, (state, action) => {
        state.loading = false;
        state.municipalities = action.payload;
      })
      .addCase(fetchAdminMunicipalities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMunicipality.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createMunicipality.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Municipality created successfully';
      })
      .addCase(createMunicipality.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateMunicipality.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateMunicipality.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Municipality updated successfully';
      })
      .addCase(updateMunicipality.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteMunicipality.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteMunicipality.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Municipality deleted successfully';
      })
      .addCase(deleteMunicipality.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleMunicipalityVisibility.rejected, (state, action) => {
        state.error = action.payload;
      })

      // =======================================================================
      // FLAGS CRUD
      // =======================================================================
      .addCase(fetchAdminFlags.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminFlags.fulfilled, (state, action) => {
        state.loading = false;
        state.flags = action.payload;
      })
      .addCase(fetchAdminFlags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFlag.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createFlag.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Flag created successfully';
      })
      .addCase(createFlag.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateFlag.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateFlag.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = 'Flag updated successfully';
      })
      .addCase(updateFlag.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // =======================================================================
      // UTILITY OPERATIONS
      // =======================================================================
      .addCase(seedDemoData.pending, (state) => {
        state.loading = true;
        state.message = null;
      })
      .addCase(seedDemoData.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(seedDemoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(syncIpfsFromPinata.pending, (state) => {
        state.loading = true;
        state.message = null;
      })
      .addCase(syncIpfsFromPinata.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(syncIpfsFromPinata.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchIpfsStatus.fulfilled, (state, action) => {
        state.ipfsStatus = action.payload;
      })

      // =======================================================================
      // DEMO USER OPERATIONS
      // =======================================================================
      .addCase(createDemoUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createDemoUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.demoUser = action.payload;
        state.message = action.payload.message;
      })
      .addCase(createDemoUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchDemoUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDemoUser.fulfilled, (state, action) => {
        state.loading = false;
        state.demoUser = action.payload;
      })
      .addCase(fetchDemoUser.rejected, (state) => {
        state.loading = false;
        state.demoUser = null;
        // Not setting error here since this is expected when demo user doesn't exist
      })
      .addCase(seedDemoUserOwnership.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(seedDemoUserOwnership.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.demoOwnershipResult = action.payload;
        state.message = action.payload.message;
      })
      .addCase(seedDemoUserOwnership.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteDemoUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteDemoUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.demoUser = null;
        state.demoOwnershipResult = null;
        state.message = action.payload.message;
      })
      .addCase(deleteDemoUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // =======================================================================
      // NFT GENERATION
      // =======================================================================
      .addCase(createNFTFromCoordinates.pending, (state) => {
        state.nftGenerating = true;
        state.nftGenerationResult = null;
        state.error = null;
      })
      .addCase(createNFTFromCoordinates.fulfilled, (state, action) => {
        state.nftGenerating = false;
        state.nftGenerationResult = action.payload;
        state.message = action.payload.message;
      })
      .addCase(createNFTFromCoordinates.rejected, (state, action) => {
        state.nftGenerating = false;
        state.error = action.payload;
      })
      .addCase(checkStreetView.pending, (state) => {
        state.checkingStreetView = true;
        state.streetViewAvailable = null;
        state.previewImages = [];
      })
      .addCase(checkStreetView.fulfilled, (state, action) => {
        state.checkingStreetView = false;
        state.streetViewAvailable = true;
        state.previewImages = action.payload.images || [];
      })
      .addCase(checkStreetView.rejected, (state) => {
        state.checkingStreetView = false;
        state.streetViewAvailable = false;
        state.previewImages = [];
      });
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export const {
  logout,
  clearMessage,
  clearDemoUser,
  clearNftGenerationResult,
  setSelectedCountryId,
  setSelectedRegionId,
  setSelectedMunicipalityId,
} = adminSlice.actions;

export default adminSlice.reducer;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectAdminAuthenticated = (state) => state.admin.authenticated;
export const selectAdminKey = (state) => state.admin.adminKey;
export const selectAdminStats = (state) => state.admin.stats;
export const selectAdminCountries = (state) => state.admin.countries;
export const selectAdminRegions = (state) => state.admin.regions;
export const selectAdminMunicipalities = (state) => state.admin.municipalities;
export const selectAdminFlags = (state) => state.admin.flags;
export const selectAdminIpfsStatus = (state) => state.admin.ipfsStatus;
export const selectAdminLoading = (state) => state.admin.loading;
export const selectAdminActionLoading = (state) => state.admin.actionLoading;
export const selectAdminMessage = (state) => state.admin.message;
export const selectAdminError = (state) => state.admin.error;
export const selectSelectedCountryId = (state) => state.admin.selectedCountryId;
export const selectSelectedRegionId = (state) => state.admin.selectedRegionId;
export const selectSelectedMunicipalityId = (state) => state.admin.selectedMunicipalityId;

// Derived selectors
export const selectRegionsByCountry = (countryId) => (state) =>
  state.admin.regions.filter((r) => r.country_id === countryId);

export const selectMunicipalitiesByRegion = (regionId) => (state) =>
  state.admin.municipalities.filter((m) => m.region_id === regionId);

export const selectFlagsByMunicipality = (municipalityId) => (state) =>
  state.admin.flags.filter((f) => f.municipality_id === municipalityId);

// Demo user selectors
export const selectDemoUser = (state) => state.admin.demoUser;
export const selectDemoOwnershipResult = (state) => state.admin.demoOwnershipResult;

// NFT generation selectors
export const selectNftGenerationResult = (state) => state.admin.nftGenerationResult;
export const selectNftGenerating = (state) => state.admin.nftGenerating;
export const selectCheckingStreetView = (state) => state.admin.checkingStreetView;
export const selectStreetViewAvailable = (state) => state.admin.streetViewAvailable;
export const selectPreviewImages = (state) => state.admin.previewImages;
