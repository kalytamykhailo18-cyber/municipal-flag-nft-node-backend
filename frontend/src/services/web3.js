/**
 * Web3 Service for blockchain interactions
 * Supports multiple wallets: MetaMask, Phantom, and other EIP-1193 compatible wallets
 */
import { ethers } from 'ethers';
import config from '../config';
import MunicipalFlagNFTABI from '../contracts/MunicipalFlagNFT.json';

// =============================================================================
// WALLET DETECTION
// =============================================================================

/**
 * Wallet types enum
 */
export const WalletType = {
  METAMASK: 'metamask',
  PHANTOM: 'phantom',
  COINBASE: 'coinbase',
  UNKNOWN: 'unknown',
};

/**
 * Get available wallet providers
 */
export const getAvailableWallets = () => {
  const wallets = [];

  if (typeof window === 'undefined') return wallets;

  // Check for MetaMask first
  // When both wallets are installed, window.ethereum is usually MetaMask
  // We need to check for the REAL MetaMask provider
  if (window.ethereum) {
    // Check if it's MetaMask (and not Phantom masquerading as MetaMask)
    const isRealMetaMask = window.ethereum.isMetaMask && !window.ethereum.isPhantom;

    // Handle multiple providers (EIP-6963 or legacy)
    if (window.ethereum.providers?.length > 0) {
      // Multiple providers detected
      const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
      if (metamaskProvider) {
        wallets.push({
          type: WalletType.METAMASK,
          name: 'MetaMask',
          icon: '🦊',
          provider: metamaskProvider,
        });
      }
    } else if (isRealMetaMask) {
      // Single MetaMask provider
      wallets.push({
        type: WalletType.METAMASK,
        name: 'MetaMask',
        icon: '🦊',
        provider: window.ethereum,
      });
    }
  }

  // Check for Phantom (has dedicated namespace)
  if (window.phantom?.ethereum) {
    wallets.push({
      type: WalletType.PHANTOM,
      name: 'Phantom',
      icon: '👻',
      provider: window.phantom.ethereum,
    });
  }

  // Check Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    wallets.push({
      type: WalletType.COINBASE,
      name: 'Coinbase Wallet',
      icon: '🔵',
      provider: window.ethereum,
    });
  }

  // If no specific wallets found but ethereum exists
  if (wallets.length === 0 && window.ethereum) {
    wallets.push({
      type: WalletType.UNKNOWN,
      name: 'Browser Wallet',
      icon: '🔗',
      provider: window.ethereum,
    });
  }

  return wallets;
};

/**
 * Check if any wallet is installed
 */
export const isWalletInstalled = () => {
  return getAvailableWallets().length > 0;
};

/**
 * Check if MetaMask is installed (legacy support)
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Store the currently selected provider
let currentProvider = null;
let currentWalletType = null;

/**
 * Set the active wallet provider
 */
export const setActiveWallet = (walletType) => {
  const wallets = getAvailableWallets();
  const wallet = wallets.find(w => w.type === walletType);

  if (wallet) {
    currentProvider = wallet.provider;
    currentWalletType = wallet.type;
    return wallet;
  }

  // Default to first available wallet
  if (wallets.length > 0) {
    currentProvider = wallets[0].provider;
    currentWalletType = wallets[0].type;
    return wallets[0];
  }

  return null;
};

/**
 * Get current wallet type
 */
export const getCurrentWalletType = () => currentWalletType;

/**
 * Get the active provider
 */
export const getActiveProvider = () => {
  if (currentProvider) return currentProvider;

  // Default to MetaMask or first available
  const wallets = getAvailableWallets();
  if (wallets.length > 0) {
    currentProvider = wallets[0].provider;
    currentWalletType = wallets[0].type;
    return currentProvider;
  }

  return window.ethereum;
};

// =============================================================================
// WALLET CONNECTION
// =============================================================================

/**
 * Get the current provider (ethers.js)
 */
export const getProvider = () => {
  const provider = getActiveProvider();
  if (!provider) {
    throw new Error('No wallet installed');
  }
  return new ethers.BrowserProvider(provider);
};

/**
 * Connect to selected wallet and get signer
 */
export const connectWallet = async (walletType = null) => {
  // Set active wallet if specified
  if (walletType) {
    const selectedWallet = setActiveWallet(walletType);
    if (!selectedWallet) {
      throw new Error(`Wallet type ${walletType} not found`);
    }
  }

  const provider = getActiveProvider();

  if (!provider) {
    throw new Error('Please install a Web3 wallet to use this application');
  }

  // CRITICAL: Request fresh account access from the selected provider
  // This ensures we get the account from the correct wallet
  const accounts = await provider.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  // Create ethers provider from the selected wallet provider
  const ethersProvider = new ethers.BrowserProvider(provider);

  // Get signer
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();

  // Check and switch network if needed
  await ensureCorrectNetwork();

  // Get balance
  const balance = await ethersProvider.getBalance(address);

  // Get current network for logging
  const network = await ethersProvider.getNetwork();

  console.log(`Connected to ${currentWalletType}: ${address}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);

  return {
    signer,
    address,
    balance: ethers.formatEther(balance),
    walletType: currentWalletType,
  };
};

/**
 * Ensure connected to correct network
 */
export const ensureCorrectNetwork = async () => {
  const provider = getActiveProvider();
  if (!provider) return;

  const chainId = await provider.request({ method: 'eth_chainId' });
  const targetChainId = config.networkConfig.chainId;

  if (chainId !== targetChainId) {
    try {
      // Try to switch to the correct network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [config.networkConfig],
        });
      } else {
        throw switchError;
      }
    }
  }
};

/**
 * Get current connected address
 */
export const getCurrentAddress = async () => {
  const provider = getActiveProvider();
  if (!provider) return null;

  const accounts = await provider.request({ method: 'eth_accounts' });
  return accounts[0] || null;
};

/**
 * Listen for account changes
 */
export const onAccountsChanged = (callback) => {
  const provider = getActiveProvider();
  if (provider) {
    provider.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 */
export const onChainChanged = (callback) => {
  const provider = getActiveProvider();
  if (provider) {
    provider.on('chainChanged', callback);
  }
};

/**
 * Remove event listeners
 */
export const removeListeners = () => {
  const provider = getActiveProvider();
  if (provider) {
    provider.removeAllListeners?.('accountsChanged');
    provider.removeAllListeners?.('chainChanged');
  }
};

/**
 * Disconnect wallet (clear state)
 */
export const disconnectWallet = () => {
  currentProvider = null;
  currentWalletType = null;
};

// =============================================================================
// CONTRACT INTERACTION
// =============================================================================

/**
 * Get contract instance
 */
export const getContract = async (signerOrProvider = null) => {
  if (!config.contractAddress) {
    throw new Error('Contract address not configured');
  }

  if (!signerOrProvider) {
    const provider = getProvider();
    signerOrProvider = provider;
  }

  return new ethers.Contract(
    config.contractAddress,
    MunicipalFlagNFTABI.abi,
    signerOrProvider
  );
};

/**
 * Get contract with signer for write operations
 */
export const getContractWithSigner = async () => {
  const provider = getActiveProvider();

  if (!provider) {
    throw new Error('No wallet connected. Please connect your wallet first.');
  }

  // Ensure we're on the correct network before making contract calls
  await ensureCorrectNetwork();

  // Get the current signer without reconnecting
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  // Verify network is correct
  const network = await ethersProvider.getNetwork();
  const expectedChainId = BigInt(config.networkConfig.chainId);

  if (network.chainId !== expectedChainId) {
    throw new Error(`Wrong network. Please switch to ${config.networkConfig.chainName}`);
  }

  return getContract(signer);
};

/**
 * Claim first NFT (free)
 */
export const claimFirstNFT = async (flagId) => {
  try {
    const contract = await getContractWithSigner();

    console.log(`Attempting to claim flagId ${flagId} with contract at ${config.contractAddress}`);

    const tx = await contract.claimFirstNFT(flagId);
    const receipt = await tx.wait();

    // Get token ID from event
    const event = receipt.logs.find(
      (log) => log.topics[0] === ethers.id('FirstNFTClaimed(uint256,uint256,address)')
    );

    return {
      transactionHash: receipt.hash,
      tokenId: event ? parseInt(event.topics[2], 16) : null,
    };
  } catch (error) {
    console.error('Error claiming NFT:', error);

    // Get error data for custom error detection
    const errorData = error.data || error.error?.data?.data;

    // Provide user-friendly error messages
    if (error.message?.includes('Wrong network')) {
      throw new Error('Please switch to Polygon Amoy Testnet in your wallet');
    }
    if (error.message?.includes('user rejected')) {
      throw new Error('Transaction was rejected');
    }
    // FlagNotRegistered error selector: 0xbb419930
    if (errorData?.startsWith('0xbb419930')) {
      throw new Error('This flag is not registered on the blockchain. Please ask the admin to register it first.');
    }
    // FirstNFTAlreadyClaimed error selector: 0x (check contract for actual selector)
    if (error.message?.includes('FirstNFTAlreadyClaimed') || errorData?.startsWith('0x')) {
      // Check for specific error selectors
      if (errorData?.startsWith('0x3d693ada')) {
        throw new Error('The first NFT for this flag has already been claimed');
      }
    }
    if (error.code === 'CALL_EXCEPTION') {
      throw new Error('This flag has already been claimed or is not registered on the blockchain');
    }

    throw error;
  }
};

/**
 * Purchase second NFT
 *
 * DATA TYPE RULES (from overview/rule.md):
 * - price: API returns string "0.05000000"
 * - Contract expects uint256 in wei
 * - CONVERSION: ethers.parseEther() converts decimal string to wei BigInt
 */
export const purchaseSecondNFT = async (flagId, price) => {
  try {
    const contract = await getContractWithSigner();

    // Convert price to wei (DATA TYPE RULE: string -> wei using parseEther)
    const priceWei = ethers.parseEther(price.toString());

    console.log(`Attempting to purchase second NFT for flagId ${flagId} with ${price} MATIC`);

    const tx = await contract.purchaseSecondNFT(flagId, { value: priceWei });
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error purchasing NFT:', error);

    // Decode custom contract errors
    const errorData = error.data || error.error?.data?.data;

    // Provide user-friendly error messages
    if (error.message?.includes('Wrong network')) {
      throw new Error('Please switch to Polygon Amoy Testnet in your wallet');
    }
    if (error.message?.includes('user rejected')) {
      throw new Error('Transaction was rejected');
    }
    if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient MATIC balance to complete purchase');
    }

    // Check for specific contract errors by selector
    // FlagNotRegistered: 0xbb419930
    if (errorData?.startsWith('0xbb419930')) {
      throw new Error('This flag is not registered on the blockchain. Please ask the admin to register it first.');
    }
    // FirstNFTNotClaimed: 0x9e9538b3 (custom, verify in contract)
    if (errorData?.startsWith('0x9e9538b3')) {
      throw new Error('You must claim the FREE first NFT before purchasing the second NFT');
    }
    // SecondNFTAlreadyPurchased: check for this error
    if (error.message?.includes('SecondNFTAlreadyPurchased')) {
      throw new Error('The second NFT for this flag has already been purchased');
    }
    // InsufficientPayment
    if (error.message?.includes('InsufficientPayment')) {
      throw new Error('Insufficient payment amount');
    }

    if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Transaction would fail. The flag may not be registered, or you need to claim the first NFT first.');
    }

    throw error;
  }
};

/**
 * Get flag pair info from contract
 */
export const getFlagPair = async (flagId) => {
  const contract = await getContract();
  const pair = await contract.flagPairs(flagId);

  return {
    flagId: pair.flagId.toString(),
    firstTokenId: pair.firstTokenId.toString(),
    secondTokenId: pair.secondTokenId.toString(),
    firstMinted: pair.firstMinted,
    secondMinted: pair.secondMinted,
    pairComplete: pair.pairComplete,
    category: pair.category,
    price: ethers.formatEther(pair.price),
    nftsRequired: Number(pair.nftsRequired),
  };
};

/**
 * Get nfts_required for a flag from the smart contract (source of truth)
 */
export const getFlagNftsRequired = async (flagId) => {
  try {
    const contract = await getContract();
    const pair = await contract.flagPairs(flagId);

    // Return the nftsRequired from the contract
    // This is the authoritative value, not the API
    return Number(pair.nftsRequired);
  } catch (error) {
    console.error(`Error fetching nftsRequired for flag ${flagId}:`, error);
    // Default to 1 if contract read fails
    return 1;
  }
};

/**
 * Get price with discount for a user
 */
export const getPriceWithDiscount = async (flagId, userAddress) => {
  const contract = await getContract();
  const price = await contract.getPriceWithDiscount(flagId, userAddress);
  return ethers.formatEther(price);
};

/**
 * Check if user has Plus discount
 */
export const userHasPlus = async (userAddress) => {
  const contract = await getContract();
  return await contract.userHasPlus(userAddress);
};

/**
 * Check if user has Premium discount
 */
export const userHasPremium = async (userAddress) => {
  const contract = await getContract();
  return await contract.userHasPremium(userAddress);
};

/**
 * Get total supply of NFTs
 */
export const getTotalSupply = async () => {
  const contract = await getContract();
  const supply = await contract.totalSupply();
  return supply.toString();
};

/**
 * Get tokens owned by address
 */
export const getTokensOfOwner = async (address) => {
  const contract = await getContract();
  const balance = await contract.balanceOf(address);
  const tokens = [];

  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(address, i);
    tokens.push(tokenId.toString());
  }

  return tokens;
};

/**
 * Get token URI
 */
export const getTokenURI = async (tokenId) => {
  const contract = await getContract();
  return await contract.tokenURI(tokenId);
};

/**
 * Get the contract owner address
 */
export const getContractOwner = async () => {
  try {
    const contract = await getContract();
    return await contract.owner();
  } catch (error) {
    console.error('Error getting contract owner:', error);
    return null;
  }
};

/**
 * Check if a flag is registered on the blockchain
 */
export const isFlagRegistered = async (flagId) => {
  try {
    const contract = await getContract();
    return await contract.isFlagRegistered(flagId);
  } catch (error) {
    console.error(`Error checking if flag ${flagId} is registered:`, error);
    return false;
  }
};

/**
 * Register a flag on the blockchain (admin only)
 * @param {number} flagId - Database flag ID
 * @param {number} category - 0=Standard, 1=Plus, 2=Premium
 * @param {string} price - Price in MATIC (e.g., "0.05")
 */
export const registerFlagSimple = async (flagId, category, price) => {
  try {
    const contract = await getContractWithSigner();

    // Convert price to wei
    const priceWei = ethers.parseEther(price.toString());

    console.log(`Registering flag ${flagId} with category ${category} and price ${price} MATIC`);

    const tx = await contract.registerFlagSimple(flagId, category, priceWei);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      success: true,
    };
  } catch (error) {
    console.error('Error registering flag:', error);

    // Get error data for custom error detection
    const errorData = error.data || error.error?.data?.data;

    if (error.message?.includes('Wrong network')) {
      throw new Error('Please switch to Polygon Amoy Testnet in your wallet');
    }
    if (error.message?.includes('user rejected')) {
      throw new Error('Transaction was rejected');
    }
    if (error.message?.includes('FlagAlreadyRegistered') || errorData?.startsWith('0x8f4a893c')) {
      throw new Error('This flag is already registered on the blockchain');
    }
    // OwnableUnauthorizedAccount error selector: 0x118cdaa7
    if (error.message?.includes('Ownable') || errorData?.startsWith('0x118cdaa7')) {
      throw new Error('Only the contract owner can register flags. Your connected wallet is not the contract owner.');
    }

    throw error;
  }
};

export default {
  WalletType,
  getAvailableWallets,
  isWalletInstalled,
  isMetaMaskInstalled,
  setActiveWallet,
  getCurrentWalletType,
  connectWallet,
  disconnectWallet,
  getCurrentAddress,
  ensureCorrectNetwork,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
  getContract,
  claimFirstNFT,
  purchaseSecondNFT,
  getFlagPair,
  getFlagNftsRequired,
  getPriceWithDiscount,
  userHasPlus,
  userHasPremium,
  getTotalSupply,
  getTokensOfOwner,
  getTokenURI,
  isFlagRegistered,
  registerFlagSimple,
  getContractOwner,
};
