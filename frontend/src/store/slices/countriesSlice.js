import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// Async thunks
export const fetchCountries = createAsyncThunk(
  'countries/fetchAll',
  async (visibleOnly = true, { rejectWithValue }) => {
    try {
      const data = await api.getCountries(visibleOnly);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCountry = createAsyncThunk(
  'countries/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.getCountry(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRegion = createAsyncThunk(
  'countries/fetchRegion',
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.getRegion(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMunicipality = createAsyncThunk(
  'countries/fetchMunicipality',
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.getMunicipality(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  countries: [],
  currentCountry: null,
  currentRegion: null,
  currentMunicipality: null,
  loading: false,
  error: null,
};

const countriesSlice = createSlice({
  name: 'countries',
  initialState,
  reducers: {
    clearCurrentCountry: (state) => {
      state.currentCountry = null;
    },
    clearCurrentRegion: (state) => {
      state.currentRegion = null;
    },
    clearCurrentMunicipality: (state) => {
      state.currentMunicipality = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all countries
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loading = false;
        state.countries = action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single country
      .addCase(fetchCountry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCountry = action.payload;
      })
      .addCase(fetchCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch region
      .addCase(fetchRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegion.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRegion = action.payload;
      })
      .addCase(fetchRegion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch municipality
      .addCase(fetchMunicipality.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMunicipality.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMunicipality = action.payload;
      })
      .addCase(fetchMunicipality.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCountry, clearCurrentRegion, clearCurrentMunicipality, clearError } = countriesSlice.actions;
export default countriesSlice.reducer;

// Selectors
export const selectCountries = (state) => state.countries.countries;
export const selectCurrentCountry = (state) => state.countries.currentCountry;
export const selectCurrentRegion = (state) => state.countries.currentRegion;
export const selectCurrentMunicipality = (state) => state.countries.currentMunicipality;
export const selectCountriesLoading = (state) => state.countries.loading;
export const selectCountriesError = (state) => state.countries.error;
