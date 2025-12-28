/**
 * Admin Page - Complete CRUD management interface
 *
 * VISUAL ADMIN CRUD INTERFACE:
 * - Tab-based navigation: Stats | Countries | Regions | Municipalities | Flags
 * - Create, Read, Update, Delete operations for all entities
 * - Hierarchical filtering (Country → Region → Municipality → Flag)
 */
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  authenticate,
  logout,
  fetchAdminStats,
  fetchAdminCountries,
  fetchAdminRegions,
  fetchAdminMunicipalities,
  fetchAdminFlags,
  fetchIpfsStatus,
  fetchDemoUser,
  selectAdminAuthenticated,
  selectAdminStats,
  selectAdminCountries,
  selectAdminRegions,
  selectAdminMunicipalities,
  selectAdminFlags,
  selectAdminIpfsStatus,
  selectDemoUser,
  selectNftGenerationResult,
  selectNftGenerating,
  selectCheckingStreetView,
  selectStreetViewAvailable,
  selectPreviewImages,
  selectAdminLoading,
  selectAdminActionLoading,
  selectAdminMessage,
  selectAdminError,
  clearMessage,
} from '../../store/slices/adminSlice';

import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const Admin = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const authenticated = useSelector(selectAdminAuthenticated);
  const stats = useSelector(selectAdminStats);
  const countries = useSelector(selectAdminCountries);
  const regions = useSelector(selectAdminRegions);
  const municipalities = useSelector(selectAdminMunicipalities);
  const flags = useSelector(selectAdminFlags);
  const ipfsStatus = useSelector(selectAdminIpfsStatus);
  const demoUser = useSelector(selectDemoUser);
  const nftGenerationResult = useSelector(selectNftGenerationResult);
  const nftGenerating = useSelector(selectNftGenerating);
  const checkingStreetView = useSelector(selectCheckingStreetView);
  const streetViewAvailable = useSelector(selectStreetViewAvailable);
  const previewImages = useSelector(selectPreviewImages);
  const loading = useSelector(selectAdminLoading);
  const actionLoading = useSelector(selectAdminActionLoading);
  const message = useSelector(selectAdminMessage);
  const error = useSelector(selectAdminError);

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      dispatch(fetchAdminStats());
      dispatch(fetchAdminCountries());
      dispatch(fetchAdminRegions());
      dispatch(fetchAdminMunicipalities());
      dispatch(fetchAdminFlags());
      dispatch(fetchIpfsStatus());
      dispatch(fetchDemoUser());
    }
  }, [dispatch, authenticated]);

  // Auto-clear messages
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => dispatch(clearMessage()), 5000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, message, error]);

  const handleAuth = (adminKey) => dispatch(authenticate(adminKey));
  const handleLogout = () => dispatch(logout());

  if (!authenticated) {
    return <AdminLogin onAuth={handleAuth} loading={loading} error={error} />;
  }

  return (
    <AdminDashboard
      stats={stats}
      countries={countries}
      regions={regions}
      municipalities={municipalities}
      flags={flags}
      ipfsStatus={ipfsStatus}
      demoUser={demoUser}
      nftGenerationResult={nftGenerationResult}
      nftGenerating={nftGenerating}
      checkingStreetView={checkingStreetView}
      streetViewAvailable={streetViewAvailable}
      previewImages={previewImages}
      loading={loading}
      actionLoading={actionLoading}
      message={message}
      error={error}
      dispatch={dispatch}
      onLogout={handleLogout}
    />
  );
};

export default Admin;
