/**
 * API Service for backend communication
 */
import axios from 'axios';
import config from '../config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    console.error('API Error:', message);
    throw new Error(message);
  }
);

// =============================================================================
// COUNTRIES
// =============================================================================

export const getCountries = (visibleOnly = true) =>
  api.get('/countries', { params: { visible_only: visibleOnly } });

export const getCountry = (id) =>
  api.get(`/countries/${id}`);

export const createCountry = (data, adminKey) =>
  api.post('/countries', data, { headers: { 'X-Admin-Key': adminKey } });

export const updateCountry = (id, data, adminKey) =>
  api.put(`/countries/${id}`, data, { headers: { 'X-Admin-Key': adminKey } });

export const deleteCountry = (id, adminKey) =>
  api.delete(`/countries/${id}`, { headers: { 'X-Admin-Key': adminKey } });

// =============================================================================
// REGIONS
// =============================================================================

export const getRegions = (countryId = null, visibleOnly = true) =>
  api.get('/regions', { params: { country_id: countryId, visible_only: visibleOnly } });

export const getRegion = (id) =>
  api.get(`/regions/${id}`);

export const createRegion = (data, adminKey) =>
  api.post('/regions', data, { headers: { 'X-Admin-Key': adminKey } });

export const updateRegion = (id, data, adminKey) =>
  api.put(`/regions/${id}`, data, { headers: { 'X-Admin-Key': adminKey } });

export const deleteRegion = (id, adminKey) =>
  api.delete(`/regions/${id}`, { headers: { 'X-Admin-Key': adminKey } });

// =============================================================================
// MUNICIPALITIES
// =============================================================================

export const getMunicipalities = (regionId = null, visibleOnly = true) =>
  api.get('/municipalities', { params: { region_id: regionId, visible_only: visibleOnly } });

export const getMunicipality = (id) =>
  api.get(`/municipalities/${id}`);

export const createMunicipality = (data, adminKey) =>
  api.post('/municipalities', data, { headers: { 'X-Admin-Key': adminKey } });

export const updateMunicipality = (id, data, adminKey) =>
  api.put(`/municipalities/${id}`, data, { headers: { 'X-Admin-Key': adminKey } });

export const deleteMunicipality = (id, adminKey) =>
  api.delete(`/municipalities/${id}`, { headers: { 'X-Admin-Key': adminKey } });

// =============================================================================
// FLAGS
// =============================================================================

export const getFlags = (municipalityId = null, category = null, availableOnly = false) =>
  api.get('/flags', {
    params: {
      municipality_id: municipalityId,
      category,
      available_only: availableOnly,
    },
  });

export const getFlag = (id) =>
  api.get(`/flags/${id}`);

export const createFlag = (data, adminKey) =>
  api.post('/flags', data, { headers: { 'X-Admin-Key': adminKey } });

export const updateFlag = (id, data, adminKey) =>
  api.put(`/flags/${id}`, data, { headers: { 'X-Admin-Key': adminKey } });

// Flag interactions
export const registerInterest = (flagId, walletAddress) =>
  api.post(`/flags/${flagId}/interest`, { wallet_address: walletAddress });

export const getFlagInterests = (flagId) =>
  api.get(`/flags/${flagId}/interests`);

export const claimFirstNFT = (flagId, walletAddress, transactionHash) =>
  api.post(`/flags/${flagId}/claim`, {
    wallet_address: walletAddress,
    ownership_type: 'first',
    transaction_hash: transactionHash,
  });

export const purchaseSecondNFT = (flagId, walletAddress, transactionHash) =>
  api.post(`/flags/${flagId}/purchase`, {
    wallet_address: walletAddress,
    ownership_type: 'second',
    transaction_hash: transactionHash,
  });

export const getFlagOwnerships = (flagId) =>
  api.get(`/flags/${flagId}/ownerships`);

// =============================================================================
// USERS
// =============================================================================

export const getUser = (walletAddress) =>
  api.get(`/users/${walletAddress}`);

export const createOrGetUser = (walletAddress, username = null) =>
  api.post('/users', { wallet_address: walletAddress, username });

export const updateUser = (walletAddress, data) =>
  api.put(`/users/${walletAddress}`, data);

export const getUserFlags = (walletAddress) =>
  api.get(`/users/${walletAddress}/flags`);

export const getUserInterests = (walletAddress) =>
  api.get(`/users/${walletAddress}/interests`);

// Social
export const followUser = (walletAddress, targetWallet) =>
  api.post(`/users/${walletAddress}/follow`, { target_wallet: targetWallet });

export const unfollowUser = (walletAddress, targetWallet) =>
  api.delete(`/users/${walletAddress}/follow/${targetWallet}`);

export const getFollowers = (walletAddress) =>
  api.get(`/users/${walletAddress}/followers`);

export const getFollowing = (walletAddress) =>
  api.get(`/users/${walletAddress}/following`);

// =============================================================================
// AUCTIONS (Enhanced with min_price, buyout_price, bidder_category)
// =============================================================================

export const getAuctions = (activeOnly = true, flagId = null) =>
  api.get('/auctions', { params: { active_only: activeOnly, flag_id: flagId } });

export const getAuction = (id) =>
  api.get(`/auctions/${id}`);

/**
 * Create a new auction with enhanced features.
 * @param {Object} data - Auction data
 * @param {number} data.flag_id - ID of the flag to auction
 * @param {string} data.wallet_address - Seller's wallet address
 * @param {string|number} data.starting_price - Starting price in MATIC
 * @param {string|number} data.min_price - Minimum bid price (floor)
 * @param {string|number|null} data.buyout_price - Optional instant purchase price
 * @param {number} data.duration_hours - Auction duration (1-168 hours)
 */
export const createAuction = (data) =>
  api.post('/auctions', {
    flag_id: data.flag_id,
    wallet_address: data.wallet_address,
    starting_price: data.starting_price.toString(),
    min_price: data.min_price.toString(),
    buyout_price: data.buyout_price ? data.buyout_price.toString() : null,
    duration_hours: data.duration_hours,
  });

/**
 * Place a bid on an auction with category for tie-breaking.
 * @param {number} auctionId - Auction ID
 * @param {string} walletAddress - Bidder's wallet address
 * @param {string|number} amount - Bid amount in MATIC
 * @param {string} bidderCategory - Bidder's category ('standard', 'plus', 'premium')
 */
export const placeBid = (auctionId, walletAddress, amount, bidderCategory = 'standard') =>
  api.post(`/auctions/${auctionId}/bid`, {
    wallet_address: walletAddress,
    amount: amount.toString(),
    bidder_category: bidderCategory,
  });

/**
 * Instant buyout of an auction at the buyout price.
 * @param {number} auctionId - Auction ID
 * @param {string} walletAddress - Buyer's wallet address
 */
export const buyoutAuction = (auctionId, walletAddress) =>
  api.post(`/auctions/${auctionId}/buyout`, {
    wallet_address: walletAddress,
  });

export const closeAuction = (auctionId) =>
  api.post(`/auctions/${auctionId}/close`);

export const cancelAuction = (auctionId, walletAddress) =>
  api.post(`/auctions/${auctionId}/cancel`, null, {
    params: { wallet_address: walletAddress },
  });

// =============================================================================
// RANKINGS
// =============================================================================

export const getUserRankings = (limit = 10) =>
  api.get('/rankings/users', { params: { limit } });

export const getCollectorRankings = (limit = 10) =>
  api.get('/rankings/collectors', { params: { limit } });

export const getPopularFlags = (limit = 10) =>
  api.get('/rankings/flags', { params: { limit } });

export const getActiveCollectors = (limit = 10) =>
  api.get('/rankings/active-collectors', { params: { limit } });

// =============================================================================
// ADMIN
// =============================================================================

export const getAdminStats = (adminKey) =>
  api.get('/admin/stats', { headers: { 'X-Admin-Key': adminKey } });

export const seedDemoData = (adminKey) =>
  api.post('/admin/seed', null, { headers: { 'X-Admin-Key': adminKey } });

export const resetDatabase = (adminKey) =>
  api.post('/admin/reset', null, { headers: { 'X-Admin-Key': adminKey } });

export const syncIpfsFromPinata = (adminKey) =>
  api.post('/admin/sync-ipfs-from-pinata', null, { headers: { 'X-Admin-Key': adminKey } });

export const getIpfsStatus = (adminKey) =>
  api.get('/admin/ipfs-status', { headers: { 'X-Admin-Key': adminKey } });

export const healthCheck = () =>
  api.get('/admin/health');

// =============================================================================
// DEMO USER
// =============================================================================

/**
 * Create a demo user for testing and presentation.
 * @param {string} adminKey - Admin API key
 * @param {Object} data - Optional demo user data
 * @param {string} data.wallet_address - Demo wallet address (default provided)
 * @param {string} data.username - Demo username
 * @param {number} data.reputation_score - Initial reputation score
 */
export const createDemoUser = (adminKey, data = {}) =>
  api.post('/admin/create-demo-user', data, { headers: { 'X-Admin-Key': adminKey } });

/**
 * Get the demo user details.
 * @param {string} adminKey - Admin API key
 * @param {string} walletAddress - Demo wallet address
 */
export const getDemoUser = (adminKey, walletAddress = '0xdemo000000000000000000000000000000000001') =>
  api.get('/admin/demo-user', {
    params: { wallet_address: walletAddress },
    headers: { 'X-Admin-Key': adminKey }
  });

/**
 * Seed demo user with flag ownerships.
 * @param {string} adminKey - Admin API key
 * @param {Object} data - Ownership seeding data
 * @param {number} data.user_id - Demo user ID
 * @param {number} data.flag_count - Number of flags to assign (default 5)
 * @param {string[]} data.include_categories - Flag categories to include
 */
export const seedDemoOwnership = (adminKey, data) =>
  api.post('/admin/seed-demo-ownership', data, { headers: { 'X-Admin-Key': adminKey } });

/**
 * Delete the demo user and all associated data.
 * @param {string} adminKey - Admin API key
 * @param {string} walletAddress - Demo wallet address
 */
export const deleteDemoUser = (adminKey, walletAddress = '0xdemo000000000000000000000000000000000001') =>
  api.delete('/admin/demo-user', {
    params: { wallet_address: walletAddress },
    headers: { 'X-Admin-Key': adminKey }
  });

// =============================================================================
// COORDINATE TO NFT GENERATION
// =============================================================================

/**
 * Generate an NFT from geographic coordinates.
 * This triggers the full pipeline: Street View → AI Transform → IPFS → Database
 *
 * @param {string} adminKey - Admin API key
 * @param {Object} data - NFT generation data
 * @param {number} data.latitude - Latitude (-90 to 90)
 * @param {number} data.longitude - Longitude (-180 to 180)
 * @param {number} data.municipality_id - Municipality ID
 * @param {string} data.location_type - Location type (e.g., "Town Hall")
 * @param {string} data.category - Flag category (standard, plus, premium)
 * @param {number} data.nfts_required - Number of NFTs required (1-10)
 * @param {string} data.custom_name - Optional custom flag name
 * @param {string} data.custom_prompt - Optional custom AI prompt
 * @param {number} data.heading - Optional Street View camera heading (0-360)
 */
export const createNFTFromCoordinates = (adminKey, data) =>
  api.post('/admin/nft-from-coordinates', data, {
    headers: { 'X-Admin-Key': adminKey },
    timeout: 180000 // 3 minute timeout for AI generation
  });

/**
 * Check if Street View imagery is available at coordinates.
 * @param {string} adminKey - Admin API key
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 */
export const checkStreetViewAvailability = (adminKey, latitude, longitude) =>
  api.post('/admin/check-street-view', {}, {
    params: { latitude, longitude },
    headers: { 'X-Admin-Key': adminKey }
  });

export default api;
