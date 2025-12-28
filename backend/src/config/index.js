/**
 * Centralized configuration loader for the backend.
 * Reads all settings from environment variables via .env file.
 *
 * IMPORTANT: Never hardcode configuration values in source code.
 * All configuration must come from environment variables.
 */
require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Server
  port: parseInt(process.env.PORT, 10) || 8000,
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api',

  // Project
  projectName: process.env.PROJECT_NAME || 'Municipal Flag NFT Game',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'nft_flag_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },

  // Admin
  adminApiKey: process.env.ADMIN_API_KEY || 'change-this-key',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'],

  // Blockchain
  blockchain: {
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
  },

  // IPFS / Pinata
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    apiSecret: process.env.PINATA_API_SECRET || '',
    jwt: process.env.PINATA_JWT || '',
    gateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
  },

  // AI Generation
  ai: {
    useCloudApi: process.env.SD_USE_CLOUD_API !== 'false',
    replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
    stabilityApiKey: process.env.STABILITY_API_KEY || '',
    imageWidth: parseInt(process.env.SD_IMAGE_WIDTH, 10) || 512,
    imageHeight: parseInt(process.env.SD_IMAGE_HEIGHT, 10) || 512,
  },

  // Google Maps / Street View
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    streetViewImageSize: process.env.STREET_VIEW_IMAGE_SIZE || '640x640',
    streetViewFov: parseInt(process.env.STREET_VIEW_FOV, 10) || 90,
  },

  // SerpAPI
  serpApi: {
    apiKey: process.env.SERPAPI_API_KEY || '',
  },

  // Game Configuration
  game: {
    flagsPerMunicipality: parseInt(process.env.FLAGS_PER_MUNICIPALITY, 10) || 8,
    prices: {
      standard: parseFloat(process.env.DEFAULT_STANDARD_PRICE) || 0.01,
      plus: parseFloat(process.env.DEFAULT_PLUS_PRICE) || 0.02,
      premium: parseFloat(process.env.DEFAULT_PREMIUM_PRICE) || 0.05,
    },
    discounts: {
      plus: parseInt(process.env.PLUS_DISCOUNT_PERCENT, 10) || 50,
      premium: parseInt(process.env.PREMIUM_DISCOUNT_PERCENT, 10) || 75,
    },
  },

  // Demo Settings
  demo: {
    countriesCount: parseInt(process.env.DEMO_COUNTRIES_COUNT, 10) || 4,
    regionsPerCountry: parseInt(process.env.DEMO_REGIONS_PER_COUNTRY, 10) || 1,
    municipalitiesPerRegion: parseInt(process.env.DEMO_MUNICIPALITIES_PER_REGION, 10) || 2,
  },

  // Community Links
  community: {
    telegramUrl: process.env.TELEGRAM_GROUP_URL || 'https://t.me/MunicipalFlagNFT',
    websiteUrl: process.env.PROJECT_WEBSITE_URL || 'https://municipalflagnft.com',
  },
};

/**
 * Validate required configuration
 */
const validateConfig = () => {
  const required = [];

  // In production, these are required
  if (config.env === 'production') {
    if (!config.database.url && !config.database.host) {
      required.push('DATABASE_URL or DB_HOST');
    }
    if (config.adminApiKey === 'change-this-key') {
      required.push('ADMIN_API_KEY');
    }
  }

  if (required.length > 0) {
    console.warn(`[CONFIG] Missing required environment variables: ${required.join(', ')}`);
  }

  return required.length === 0;
};

// Validate on load
validateConfig();

module.exports = config;
