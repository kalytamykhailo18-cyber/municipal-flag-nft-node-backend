import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import countriesReducer from './slices/countriesSlice';
import flagsReducer from './slices/flagsSlice';
import userReducer from './slices/userSlice';
import auctionsReducer from './slices/auctionsSlice';
import rankingsReducer from './slices/rankingsSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    countries: countriesReducer,
    flags: flagsReducer,
    user: userReducer,
    auctions: auctionsReducer,
    rankings: rankingsReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
