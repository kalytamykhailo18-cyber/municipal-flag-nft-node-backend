/**
 * Frontend Configuration
 * Reads settings from environment variables (Vite uses import.meta.env)
 */

const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',

  // Blockchain Configuration
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID) || 80002,
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Polygon Amoy Testnet',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc-amoy.polygon.technology',
  blockExplorer: import.meta.env.VITE_BLOCK_EXPLORER || 'https://amoy.polygonscan.com',

  // IPFS Configuration - Using Pinata gateway (faster than ipfs.io)
  ipfsGateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs',

  // Pricing Configuration (in MATIC)
  prices: {
    standard: import.meta.env.VITE_PRICE_STANDARD || '0.01',
    plus: import.meta.env.VITE_PRICE_PLUS || '0.02',
    premium: import.meta.env.VITE_PRICE_PREMIUM || '0.05',
  },

  // Network configuration for MetaMask
  networkConfig: {
    chainId: `0x${(parseInt(import.meta.env.VITE_CHAIN_ID) || 80002).toString(16)}`,
    chainName: import.meta.env.VITE_CHAIN_NAME || 'Polygon Amoy Testnet',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
    },
    rpcUrls: [import.meta.env.VITE_RPC_URL || 'https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: [import.meta.env.VITE_BLOCK_EXPLORER || 'https://amoy.polygonscan.com'],
  },

  // Helper functions
  getIpfsUrl: (hash) => {
    if (!hash) return '';
    if (hash.startsWith('ipfs://')) {
      hash = hash.replace('ipfs://', '');
    }
    const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    return `${gateway}/${hash}`;
  },

  truncateAddress: (address, chars = 4) => {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  },

  formatPrice: (price) => {
    if (!price) return '0';
    return parseFloat(price).toFixed(4);
  },
};

export default config;
