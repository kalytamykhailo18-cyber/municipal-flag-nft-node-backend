/**
 * SerpAPI Location Discovery Service
 *
 * ADMIN ONLY - Used to discover real locations for flag generation.
 * Queries Google Maps via SerpAPI to find locations with coordinates.
 */
const axios = require('axios');
const config = require('../config');

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

class SerpAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SerpAPIError';
  }
}

/**
 * Discover locations using SerpAPI Google Maps search
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (e.g., "Town Hall")
 * @param {number} params.latitude - Center latitude for search
 * @param {number} params.longitude - Center longitude for search
 * @param {number} params.zoom - Map zoom level (1-20)
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} List of location objects
 */
const discoverLocations = async ({
  query,
  latitude,
  longitude,
  zoom = 14,
  limit = 10,
}) => {
  if (!config.serpApi.apiKey) {
    throw new SerpAPIError(
      'SerpAPI key not configured. Set SERPAPI_API_KEY environment variable.'
    );
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90.`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180.`);
  }

  const params = {
    engine: 'google_maps',
    q: query,
    ll: `@${latitude},${longitude},${zoom}z`,
    api_key: config.serpApi.apiKey,
    type: 'search',
  };

  try {
    const response = await axios.get(SERPAPI_BASE_URL, {
      params,
      timeout: 30000,
    });

    const data = response.data;

    if (data.error) {
      throw new SerpAPIError(`SerpAPI error: ${data.error}`);
    }

    let localResults = data.local_results || [];
    if (!localResults.length) {
      localResults = data.place_results || [];
    }

    if (!localResults.length) {
      return [];
    }

    const locations = [];
    for (const result of localResults.slice(0, limit)) {
      const gps = result.gps_coordinates || {};
      const lat = gps.latitude;
      const lon = gps.longitude;

      if (lat == null || lon == null) {
        continue;
      }

      locations.push({
        title: result.title || 'Unknown Location',
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        place_id: result.place_id || '',
        address: result.address || '',
        type: query,
        rating: result.rating,
        reviews: result.reviews,
        thumbnail: result.thumbnail,
      });
    }

    return locations;
  } catch (error) {
    if (error.response) {
      throw new SerpAPIError(`HTTP error from SerpAPI: ${error.response.status}`);
    }
    if (error.name === 'SerpAPIError') {
      throw error;
    }
    throw new SerpAPIError(`Network error connecting to SerpAPI: ${error.message}`);
  }
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address or place name to geocode
 * @returns {Promise<Object|null>} Object with latitude and longitude, or null
 */
const geocodeLocation = async (address) => {
  if (!config.serpApi.apiKey) {
    throw new SerpAPIError('SerpAPI key not configured');
  }

  const params = {
    engine: 'google_maps',
    q: address,
    api_key: config.serpApi.apiKey,
    type: 'search',
  };

  try {
    const response = await axios.get(SERPAPI_BASE_URL, {
      params,
      timeout: 30000,
    });

    const data = response.data;

    // Try place_results
    const place = data.place_results || {};
    let gps = place.gps_coordinates || {};
    if (gps.latitude && gps.longitude) {
      return {
        latitude: parseFloat(gps.latitude),
        longitude: parseFloat(gps.longitude),
      };
    }

    // Try first local_result
    const local = data.local_results || [];
    if (local.length) {
      gps = local[0].gps_coordinates || {};
      if (gps.latitude && gps.longitude) {
        return {
          latitude: parseFloat(gps.latitude),
          longitude: parseFloat(gps.longitude),
        };
      }
    }

    // Try search_information for map center
    const searchInfo = data.search_information || {};
    if (searchInfo.local_map) {
      gps = searchInfo.local_map.gps_coordinates || {};
      if (gps.latitude && gps.longitude) {
        return {
          latitude: parseFloat(gps.latitude),
          longitude: parseFloat(gps.longitude),
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error: ${error.message}`);
    return null;
  }
};

/**
 * Discover multiple location types for a municipality
 * @param {Object} params - Search parameters
 * @param {string} params.municipalityName - Name of the municipality
 * @param {string} params.countryName - Name of the country
 * @param {Array<string>} params.locationTypes - Location types to search for
 * @returns {Promise<Object>} Dictionary mapping location_type to locations
 */
const discoverLocationsForMunicipality = async ({
  municipalityName,
  countryName,
  locationTypes = null,
}) => {
  const types = locationTypes || [
    'Town Hall',
    'Fire Station',
    'Bakery',
    'Church',
    'Market Square',
    'Fountain',
    'Bridge',
    'Park',
  ];

  // First, geocode the municipality
  const center = await geocodeLocation(`${municipalityName}, ${countryName}`);

  if (!center) {
    throw new SerpAPIError(
      `Could not geocode municipality: ${municipalityName}, ${countryName}`
    );
  }

  const results = {};

  for (const locationType of types) {
    const query = `${locationType} ${municipalityName}`;
    try {
      const locations = await discoverLocations({
        query,
        latitude: center.latitude,
        longitude: center.longitude,
        zoom: 14,
        limit: 3,
      });
      results[locationType] = locations;
    } catch (error) {
      results[locationType] = [];
      console.warn(`Warning: Failed to discover ${locationType}: ${error.message}`);
    }
  }

  return results;
};

/**
 * Get photos for a place using its Google place_id
 * @param {string} placeId - Google place ID
 * @param {number} limit - Maximum number of photos
 * @returns {Promise<Array<string>>} List of photo URLs
 */
const getPlacePhotos = async (placeId, limit = 5) => {
  if (!config.serpApi.apiKey) {
    throw new SerpAPIError('SerpAPI key not configured');
  }

  if (!placeId) {
    return [];
  }

  const params = {
    engine: 'google_maps_photos',
    data_id: placeId,
    api_key: config.serpApi.apiKey,
  };

  try {
    const response = await axios.get(SERPAPI_BASE_URL, {
      params,
      timeout: 30000,
    });

    const photos = response.data.photos || [];
    const urls = [];

    for (const photo of photos.slice(0, limit)) {
      if (photo.image) {
        urls.push(photo.image);
      } else if (photo.thumbnail) {
        urls.push(photo.thumbnail);
      }
    }

    return urls;
  } catch (error) {
    console.error(`Error fetching photos: ${error.message}`);
    return [];
  }
};

/**
 * Search for images using SerpAPI Google Images
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.limit - Maximum number of images
 * @returns {Promise<Array>} List of image objects
 */
const searchImages = async ({ query, limit = 5 }) => {
  if (!config.serpApi.apiKey) {
    throw new SerpAPIError('SerpAPI key not configured');
  }

  const params = {
    engine: 'google_images',
    q: query,
    api_key: config.serpApi.apiKey,
    safe: 'active',
    ijn: '0',
  };

  try {
    const response = await axios.get(SERPAPI_BASE_URL, {
      params,
      timeout: 30000,
    });

    const imagesResults = response.data.images_results || [];
    const images = [];

    for (const img of imagesResults.slice(0, limit)) {
      images.push({
        url: img.original || '',
        thumbnail: img.thumbnail || '',
        title: img.title || '',
        source: img.source || '',
        width: img.original_width,
        height: img.original_height,
      });
    }

    return images;
  } catch (error) {
    if (error.response) {
      throw new SerpAPIError(`HTTP error from SerpAPI: ${error.response.status}`);
    }
    throw new SerpAPIError(`Network error: ${error.message}`);
  }
};

/**
 * Download an image from URL and return as buffer
 * @param {string} url - Image URL to download
 * @returns {Promise<Buffer>} Image content as buffer
 */
const getImageBytes = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
    });

    return Buffer.from(response.data);
  } catch (error) {
    throw new SerpAPIError(`Failed to download image: ${error.message}`);
  }
};

/**
 * Test the connection to SerpAPI
 * @returns {Promise<Object>} Connection status
 */
const testSerpApiConnection = async () => {
  if (!config.serpApi.apiKey) {
    return {
      status: 'error',
      message: 'SerpAPI key not configured',
    };
  }

  try {
    const result = await geocodeLocation('New York, USA');

    if (result) {
      return {
        status: 'connected',
        message: 'SerpAPI connection successful',
        test_result: result,
      };
    } else {
      return {
        status: 'error',
        message: 'SerpAPI returned no results for test query',
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
};

module.exports = {
  SerpAPIError,
  discoverLocations,
  geocodeLocation,
  discoverLocationsForMunicipality,
  getPlacePhotos,
  searchImages,
  getImageBytes,
  testSerpApiConnection,
};
