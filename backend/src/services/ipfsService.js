/**
 * IPFS Service using Pinata
 * Handles uploading images and metadata to IPFS via Pinata.
 */
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const config = require('../config');

const PINATA_API_URL = 'https://api.pinata.cloud';

class IPFSError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IPFSError';
  }
}

/**
 * Get authentication headers for Pinata API
 */
const getPinataHeaders = () => {
  if (config.pinata.jwt) {
    return {
      Authorization: `Bearer ${config.pinata.jwt}`,
    };
  } else if (config.pinata.apiKey && config.pinata.apiSecret) {
    return {
      pinata_api_key: config.pinata.apiKey,
      pinata_secret_api_key: config.pinata.apiSecret,
    };
  } else {
    throw new IPFSError(
      'Pinata credentials not configured. ' +
        'Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET environment variables.'
    );
  }
};

/**
 * Upload an image to IPFS via Pinata
 * @param {Buffer} imageBytes - Image data as buffer
 * @param {string} name - Name for the file
 * @param {Object} metadata - Optional Pinata metadata
 * @returns {Promise<string>} IPFS hash (CID)
 */
const uploadImage = async (imageBytes, name, metadata = {}) => {
  const url = `${PINATA_API_URL}/pinning/pinFileToIPFS`;

  // Sanitize filename
  let safeName = name.replace(/[^a-zA-Z0-9._\- ]/g, '').substring(0, 100);
  if (!safeName.match(/\.(png|jpg|jpeg|gif)$/i)) {
    safeName = `${safeName}.png`;
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', imageBytes, {
    filename: safeName,
    contentType: 'image/png',
  });

  // Pinata metadata
  const pinataMetadata = {
    name: safeName,
    keyvalues: metadata,
  };

  formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  try {
    const headers = {
      ...getPinataHeaders(),
      ...formData.getHeaders(),
    };

    const response = await axios.post(url, formData, {
      headers,
      timeout: 60000,
    });

    const ipfsHash = response.data.IpfsHash;
    if (!ipfsHash) {
      throw new IPFSError('No IPFS hash returned from Pinata');
    }

    return ipfsHash;
  } catch (error) {
    if (error.response) {
      const errorDetail = error.response.data?.error?.message || '';
      throw new IPFSError(
        `Pinata HTTP error: ${error.response.status} - ${errorDetail}`
      );
    }
    throw new IPFSError(`Network error uploading to Pinata: ${error.message}`);
  }
};

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} metadata - Metadata dictionary
 * @param {string} name - Name for the metadata file
 * @returns {Promise<string>} IPFS hash (CID)
 */
const uploadMetadata = async (metadata, name) => {
  const url = `${PINATA_API_URL}/pinning/pinJSONToIPFS`;

  // Sanitize name
  const safeName = name.replace(/[^a-zA-Z0-9._\- ]/g, '').substring(0, 100);

  const payload = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `${safeName}_metadata.json`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  try {
    const headers = {
      ...getPinataHeaders(),
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: 30000,
    });

    const ipfsHash = response.data.IpfsHash;
    if (!ipfsHash) {
      throw new IPFSError('No IPFS hash returned from Pinata');
    }

    return ipfsHash;
  } catch (error) {
    if (error.response) {
      throw new IPFSError(`Pinata HTTP error: ${error.response.status}`);
    }
    throw new IPFSError(`Network error: ${error.message}`);
  }
};

/**
 * Generate NFT metadata following OpenSea/ERC-721 standards
 * @param {Object} params - Metadata parameters
 * @returns {Object} ERC-721 compatible metadata
 */
const generateMetadata = ({
  flagName,
  locationType,
  category,
  nftsRequired,
  coordinates,
  imageIpfsHash,
  countryName,
  regionName,
  municipalityName,
  flagId = null,
  externalUrlBase = null,
  telegramUrl = null,
}) => {
  const baseUrl = externalUrlBase || config.projectWebsiteUrl;
  const telegram = telegramUrl || config.telegramGroupUrl;

  return {
    name: flagName,
    description: `Official municipal flag representing the ${locationType} of ${municipalityName}. ` +
      `This NFT is part of the Municipal Flag NFT Game collection. ` +
      `Join our community: ${telegram}`,
    image: `ipfs://${imageIpfsHash}`,
    external_url: flagId ? `${baseUrl}/flags/${flagId}` : baseUrl,
    attributes: [
      {
        trait_type: 'Country',
        value: countryName,
      },
      {
        trait_type: 'Region',
        value: regionName,
      },
      {
        trait_type: 'Municipality',
        value: municipalityName,
      },
      {
        trait_type: 'Location Type',
        value: locationType,
      },
      {
        trait_type: 'Category',
        value: category,
      },
      {
        display_type: 'number',
        trait_type: 'NFTs Required',
        value: nftsRequired,
      },
      {
        trait_type: 'Coordinates',
        value: coordinates,
      },
    ],
    properties: {
      category: category,
      nfts_required: nftsRequired,
      created_at: new Date().toISOString(),
      community: {
        telegram: telegram,
      },
    },
  };
};

/**
 * Calculate SHA-256 hash of content
 * @param {Object|string|Buffer} data - Data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
const calculateContentHash = (data) => {
  let content;

  if (typeof data === 'object' && !Buffer.isBuffer(data)) {
    content = JSON.stringify(data, Object.keys(data).sort());
  } else if (typeof data === 'string') {
    content = data;
  } else if (Buffer.isBuffer(data)) {
    content = data;
  } else {
    content = String(data);
  }

  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Get the full IPFS gateway URL for a hash
 * @param {string} ipfsHash - IPFS CID
 * @returns {string} Full gateway URL
 */
const getIpfsUrl = (ipfsHash) => {
  const gateway = config.ipfsGateway || 'https://gateway.pinata.cloud/ipfs';
  return `${gateway}/${ipfsHash}`;
};

/**
 * Test the connection to Pinata API
 * @returns {Promise<Object>} Connection status and account info
 */
const testPinataConnection = async () => {
  const url = `${PINATA_API_URL}/data/testAuthentication`;

  try {
    const headers = getPinataHeaders();
    const response = await axios.get(url, { headers, timeout: 10000 });

    return {
      status: 'connected',
      message: response.data.message || 'OK',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Connection failed',
    };
  }
};

module.exports = {
  IPFSError,
  uploadImage,
  uploadMetadata,
  generateMetadata,
  calculateContentHash,
  getIpfsUrl,
  testPinataConnection,
};
