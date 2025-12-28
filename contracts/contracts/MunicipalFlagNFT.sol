// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MunicipalFlagNFT
 * @author Municipal Flag NFT Game
 * @notice ERC721 contract for Municipal Flag NFT Game on Polygon Amoy
 * @dev Implements the dual-NFT flag system with multi-NFT support and discount tiers
 *
 * KEY FEATURES:
 * =============
 * 1. FLAG PAIR SYSTEM: Each flag has two NFTs - First (free claim) and Second (purchase)
 * 2. MULTI-NFT FLAGS: Some flags require multiple NFTs (1-10) to complete
 * 3. DISCOUNT TIERS: Plus (50%) and Premium (75%) discounts on Standard flags
 * 4. IPFS METADATA: Each token links to IPFS-hosted metadata via tokenURI
 *
 * GAME FLOW:
 * ==========
 * 1. Admin registers flags with category, price, and nftsRequired
 * 2. User claims first NFT(s) for free (shows interest)
 * 3. User purchases second NFT(s) to complete the pair
 * 4. Completing Plus/Premium flags grants permanent discounts
 *
 * MULTI-NFT IMPLEMENTATION:
 * =========================
 * - nftsRequired=1: Standard single NFT flag
 * - nftsRequired=3: Grouped flag requiring 3 NFTs to claim/purchase
 * - All NFTs are minted in a single transaction for gas efficiency
 * - Total price = basePrice × nftsRequired
 */
contract MunicipalFlagNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // =============================================================================
    // CONSTANTS
    // =============================================================================

    /// @notice Category identifiers
    uint8 public constant CATEGORY_STANDARD = 0;
    uint8 public constant CATEGORY_PLUS = 1;
    uint8 public constant CATEGORY_PREMIUM = 2;

    /// @notice Discount rates in basis points (10000 = 100%)
    uint256 public constant PLUS_DISCOUNT_BPS = 5000;     // 50% discount
    uint256 public constant PREMIUM_DISCOUNT_BPS = 7500;  // 75% discount
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Maximum NFTs that can be required per flag
    uint8 public constant MAX_NFTS_REQUIRED = 10;

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    /// @notice Counter for generating unique token IDs
    uint256 private _tokenIdCounter;

    /// @notice Base URI for token metadata (IPFS gateway)
    string private _baseTokenURI;

    /**
     * @notice Flag pair structure with multi-NFT support
     * @dev Stores all data related to a flag's NFT pair
     */
    struct FlagPair {
        uint256 flagId;           // Unique flag identifier (matches database)
        uint256 firstTokenId;     // First minted token ID (for single NFT compatibility)
        uint256 secondTokenId;    // First second token ID (for single NFT compatibility)
        address firstOwner;       // Address that claimed first NFT(s)
        address secondOwner;      // Address that purchased second NFT(s)
        bool firstMinted;         // True when all first NFTs are claimed
        bool secondMinted;        // True when all second NFTs are purchased
        bool pairComplete;        // True when pair is fully complete
        uint8 category;           // 0=Standard, 1=Plus, 2=Premium
        uint256 price;            // Price per NFT in wei
        uint8 nftsRequired;       // Number of NFTs required (1-10)
        uint8 firstMintedCount;   // Count of first NFTs claimed
        uint8 secondMintedCount;  // Count of second NFTs purchased
        string metadataHash;      // SHA-256 hash for integrity verification
    }

    /// @notice Mapping from flag ID to FlagPair data
    mapping(uint256 => FlagPair) public flagPairs;

    /// @notice Mapping from token ID to flag ID
    mapping(uint256 => uint256) public tokenToFlag;

    /// @notice Track if token is first or second NFT (true = first, false = second)
    mapping(uint256 => bool) public isFirstNFT;

    /// @notice Addresses that have Plus discount
    mapping(address => bool) public hasPlus;

    /// @notice Addresses that have Premium discount
    mapping(address => bool) public hasPremium;

    /// @notice All first token IDs for each flag (multi-NFT)
    mapping(uint256 => uint256[]) private _flagFirstTokenIds;

    /// @notice All second token IDs for each flag (multi-NFT)
    mapping(uint256 => uint256[]) private _flagSecondTokenIds;

    /// @notice Array of all registered flag IDs
    uint256[] private _registeredFlagIds;

    /// @notice Mapping to track if a flag ID exists
    mapping(uint256 => bool) private _flagExists;

    // =============================================================================
    // EVENTS
    // =============================================================================

    /// @notice Emitted when a new flag is registered
    event FlagRegistered(
        uint256 indexed flagId,
        uint8 category,
        uint256 price,
        uint8 nftsRequired
    );

    /// @notice Emitted when first NFT(s) are claimed
    event FirstNFTClaimed(
        uint256 indexed flagId,
        uint256 indexed tokenId,
        address indexed claimer,
        uint8 claimNumber
    );

    /// @notice Emitted when second NFT(s) are purchased
    event SecondNFTPurchased(
        uint256 indexed flagId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 pricePaid,
        uint8 purchaseNumber
    );

    /// @notice Emitted when a flag pair is completed
    event PairCompleted(
        uint256 indexed flagId,
        address indexed completedBy
    );

    /// @notice Emitted when discount status changes
    event DiscountGranted(
        address indexed user,
        uint8 discountType  // 1=Plus, 2=Premium
    );

    /// @notice Emitted when base URI is updated
    event BaseURIUpdated(string newBaseURI);

    /// @notice Emitted when funds are withdrawn
    event Withdrawal(address indexed to, uint256 amount);

    /// @notice Emitted when flag metadata hash is set
    event MetadataHashSet(uint256 indexed flagId, string metadataHash);

    // =============================================================================
    // ERRORS
    // =============================================================================

    error FlagNotRegistered(uint256 flagId);
    error FlagAlreadyRegistered(uint256 flagId);
    error InvalidCategory(uint8 category);
    error InvalidPrice();
    error InvalidNftsRequired(uint8 nftsRequired);
    error FirstNFTAlreadyClaimed(uint256 flagId);
    error SecondNFTAlreadyPurchased(uint256 flagId);
    error FirstNFTNotClaimed(uint256 flagId);
    error InsufficientPayment(uint256 required, uint256 sent);
    error NoBalanceToWithdraw();
    error WithdrawalFailed();
    error RefundFailed();
    error ArrayLengthMismatch();

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    /**
     * @notice Deploy the Municipal Flag NFT contract
     * @param baseURI Base URI for token metadata (e.g., IPFS gateway)
     */
    constructor(
        string memory baseURI
    ) ERC721("Municipal Flag NFT", "MFLAG") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================

    /**
     * @notice Register a new flag for the game
     * @param flagId Unique identifier for the flag (matches database)
     * @param category Flag category (0=Standard, 1=Plus, 2=Premium)
     * @param price Price in wei for each second NFT
     * @param nftsRequired Number of NFTs required to complete this flag (1-10)
     */
    function registerFlag(
        uint256 flagId,
        uint8 category,
        uint256 price,
        uint8 nftsRequired
    ) external onlyOwner {
        if (_flagExists[flagId]) revert FlagAlreadyRegistered(flagId);
        if (category > CATEGORY_PREMIUM) revert InvalidCategory(category);
        if (price == 0) revert InvalidPrice();
        if (nftsRequired == 0 || nftsRequired > MAX_NFTS_REQUIRED) {
            revert InvalidNftsRequired(nftsRequired);
        }

        flagPairs[flagId] = FlagPair({
            flagId: flagId,
            firstTokenId: 0,
            secondTokenId: 0,
            firstOwner: address(0),
            secondOwner: address(0),
            firstMinted: false,
            secondMinted: false,
            pairComplete: false,
            category: category,
            price: price,
            nftsRequired: nftsRequired,
            firstMintedCount: 0,
            secondMintedCount: 0,
            metadataHash: ""
        });

        _flagExists[flagId] = true;
        _registeredFlagIds.push(flagId);

        emit FlagRegistered(flagId, category, price, nftsRequired);
    }

    /**
     * @notice Register a flag with default nftsRequired=1 (backward compatible)
     * @param flagId Unique identifier for the flag
     * @param category Flag category (0=Standard, 1=Plus, 2=Premium)
     * @param price Price in wei for the second NFT
     */
    function registerFlagSimple(
        uint256 flagId,
        uint8 category,
        uint256 price
    ) external onlyOwner {
        if (_flagExists[flagId]) revert FlagAlreadyRegistered(flagId);
        if (category > CATEGORY_PREMIUM) revert InvalidCategory(category);
        if (price == 0) revert InvalidPrice();

        flagPairs[flagId] = FlagPair({
            flagId: flagId,
            firstTokenId: 0,
            secondTokenId: 0,
            firstOwner: address(0),
            secondOwner: address(0),
            firstMinted: false,
            secondMinted: false,
            pairComplete: false,
            category: category,
            price: price,
            nftsRequired: 1,
            firstMintedCount: 0,
            secondMintedCount: 0,
            metadataHash: ""
        });

        _flagExists[flagId] = true;
        _registeredFlagIds.push(flagId);

        emit FlagRegistered(flagId, category, price, 1);
    }

    /**
     * @notice Batch register multiple flags
     * @param flagIds Array of flag IDs
     * @param categories Array of categories
     * @param prices Array of prices
     * @param nftsRequiredArr Array of NFTs required for each flag
     */
    function batchRegisterFlags(
        uint256[] calldata flagIds,
        uint8[] calldata categories,
        uint256[] calldata prices,
        uint8[] calldata nftsRequiredArr
    ) external onlyOwner {
        if (
            flagIds.length != categories.length ||
            flagIds.length != prices.length ||
            flagIds.length != nftsRequiredArr.length
        ) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < flagIds.length; i++) {
            if (_flagExists[flagIds[i]]) revert FlagAlreadyRegistered(flagIds[i]);
            if (categories[i] > CATEGORY_PREMIUM) revert InvalidCategory(categories[i]);
            if (prices[i] == 0) revert InvalidPrice();
            if (nftsRequiredArr[i] == 0 || nftsRequiredArr[i] > MAX_NFTS_REQUIRED) {
                revert InvalidNftsRequired(nftsRequiredArr[i]);
            }

            flagPairs[flagIds[i]] = FlagPair({
                flagId: flagIds[i],
                firstTokenId: 0,
                secondTokenId: 0,
                firstOwner: address(0),
                secondOwner: address(0),
                firstMinted: false,
                secondMinted: false,
                pairComplete: false,
                category: categories[i],
                price: prices[i],
                nftsRequired: nftsRequiredArr[i],
                firstMintedCount: 0,
                secondMintedCount: 0,
                metadataHash: ""
            });

            _flagExists[flagIds[i]] = true;
            _registeredFlagIds.push(flagIds[i]);

            emit FlagRegistered(flagIds[i], categories[i], prices[i], nftsRequiredArr[i]);
        }
    }

    /**
     * @notice Batch register multiple flags with nftsRequired=1 (simpler)
     * @param flagIds Array of flag IDs
     * @param categories Array of categories
     * @param prices Array of prices
     */
    function batchRegisterFlagsSimple(
        uint256[] calldata flagIds,
        uint8[] calldata categories,
        uint256[] calldata prices
    ) external onlyOwner {
        if (flagIds.length != categories.length || flagIds.length != prices.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < flagIds.length; i++) {
            if (_flagExists[flagIds[i]]) revert FlagAlreadyRegistered(flagIds[i]);
            if (categories[i] > CATEGORY_PREMIUM) revert InvalidCategory(categories[i]);
            if (prices[i] == 0) revert InvalidPrice();

            flagPairs[flagIds[i]] = FlagPair({
                flagId: flagIds[i],
                firstTokenId: 0,
                secondTokenId: 0,
                firstOwner: address(0),
                secondOwner: address(0),
                firstMinted: false,
                secondMinted: false,
                pairComplete: false,
                category: categories[i],
                price: prices[i],
                nftsRequired: 1,
                firstMintedCount: 0,
                secondMintedCount: 0,
                metadataHash: ""
            });

            _flagExists[flagIds[i]] = true;
            _registeredFlagIds.push(flagIds[i]);

            emit FlagRegistered(flagIds[i], categories[i], prices[i], 1);
        }
    }

    /**
     * @notice Set metadata hash for a flag (for integrity verification)
     * @param flagId The flag ID
     * @param metadataHash SHA-256 hash of the metadata
     */
    function setMetadataHash(
        uint256 flagId,
        string calldata metadataHash
    ) external onlyOwner {
        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);
        flagPairs[flagId].metadataHash = metadataHash;
        emit MetadataHashSet(flagId, metadataHash);
    }

    /**
     * @notice Update the base URI for token metadata
     * @param newBaseURI New base URI (e.g., new IPFS gateway)
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Withdraw contract balance to owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalanceToWithdraw();

        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();

        emit Withdrawal(owner(), balance);
    }

    // =============================================================================
    // PUBLIC MINTING FUNCTIONS
    // =============================================================================

    /**
     * @notice Claim the first NFT(s) of a flag pair (free)
     * @param flagId The flag ID to claim
     * @dev Mints all required first NFTs in a single transaction
     */
    function claimFirstNFT(uint256 flagId) external nonReentrant {
        FlagPair storage pair = flagPairs[flagId];

        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);
        if (pair.firstMinted) revert FirstNFTAlreadyClaimed(flagId);

        pair.firstOwner = msg.sender;

        // Mint all required first NFTs
        for (uint8 i = 0; i < pair.nftsRequired; i++) {
            _tokenIdCounter++;
            uint256 newTokenId = _tokenIdCounter;

            _safeMint(msg.sender, newTokenId);
            tokenToFlag[newTokenId] = flagId;
            isFirstNFT[newTokenId] = true;
            _flagFirstTokenIds[flagId].push(newTokenId);

            // Store first token ID for backward compatibility
            if (i == 0) {
                pair.firstTokenId = newTokenId;
            }

            pair.firstMintedCount++;
            emit FirstNFTClaimed(flagId, newTokenId, msg.sender, i + 1);
        }

        pair.firstMinted = true;
    }

    /**
     * @notice Purchase the second NFT(s) of a flag pair
     * @param flagId The flag ID to purchase
     * @dev Mints all required second NFTs and applies discounts
     */
    function purchaseSecondNFT(uint256 flagId) external payable nonReentrant {
        FlagPair storage pair = flagPairs[flagId];

        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);
        if (!pair.firstMinted) revert FirstNFTNotClaimed(flagId);
        if (pair.secondMinted) revert SecondNFTAlreadyPurchased(flagId);

        // Calculate total price with discount
        uint256 pricePerNFT = getPriceWithDiscount(flagId, msg.sender);
        uint256 totalPrice = pricePerNFT * pair.nftsRequired;

        if (msg.value < totalPrice) {
            revert InsufficientPayment(totalPrice, msg.value);
        }

        pair.secondOwner = msg.sender;

        // Mint all required second NFTs
        for (uint8 i = 0; i < pair.nftsRequired; i++) {
            _tokenIdCounter++;
            uint256 newTokenId = _tokenIdCounter;

            _safeMint(msg.sender, newTokenId);
            tokenToFlag[newTokenId] = flagId;
            isFirstNFT[newTokenId] = false;
            _flagSecondTokenIds[flagId].push(newTokenId);

            // Store first second token ID for backward compatibility
            if (i == 0) {
                pair.secondTokenId = newTokenId;
            }

            pair.secondMintedCount++;
            emit SecondNFTPurchased(flagId, newTokenId, msg.sender, pricePerNFT, i + 1);
        }

        pair.secondMinted = true;
        pair.pairComplete = true;

        // Grant discount based on category
        _grantDiscount(msg.sender, pair.category);

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            if (!refundSuccess) revert RefundFailed();
        }

        emit PairCompleted(flagId, msg.sender);
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Grant discount to user based on flag category
     */
    function _grantDiscount(address user, uint8 category) internal {
        if (category == CATEGORY_PLUS && !hasPlus[user]) {
            hasPlus[user] = true;
            emit DiscountGranted(user, CATEGORY_PLUS);
        } else if (category == CATEGORY_PREMIUM && !hasPremium[user]) {
            hasPremium[user] = true;
            emit DiscountGranted(user, CATEGORY_PREMIUM);
        }
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @notice Get complete flag pair information
     * @param flagId The flag ID
     * @return FlagPair struct with all data
     */
    function getFlagPair(uint256 flagId) external view returns (FlagPair memory) {
        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);
        return flagPairs[flagId];
    }

    /**
     * @notice Check if a flag is registered
     * @param flagId The flag ID
     * @return True if registered
     */
    function isFlagRegistered(uint256 flagId) external view returns (bool) {
        return _flagExists[flagId];
    }

    /**
     * @notice Get all first token IDs for a flag
     * @param flagId The flag ID
     * @return Array of token IDs
     */
    function getFirstTokenIds(uint256 flagId) external view returns (uint256[] memory) {
        return _flagFirstTokenIds[flagId];
    }

    /**
     * @notice Get all second token IDs for a flag
     * @param flagId The flag ID
     * @return Array of token IDs
     */
    function getSecondTokenIds(uint256 flagId) external view returns (uint256[] memory) {
        return _flagSecondTokenIds[flagId];
    }

    /**
     * @notice Get number of NFTs required for a flag
     * @param flagId The flag ID
     * @return Number of NFTs required
     */
    function getNftsRequired(uint256 flagId) external view returns (uint8) {
        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);
        return flagPairs[flagId].nftsRequired;
    }

    /**
     * @notice Calculate price per NFT with discount for a buyer
     * @param flagId The flag ID
     * @param buyer The buyer address
     * @return Final price per NFT in wei after discount
     */
    function getPriceWithDiscount(
        uint256 flagId,
        address buyer
    ) public view returns (uint256) {
        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);

        FlagPair memory pair = flagPairs[flagId];
        uint256 basePrice = pair.price;

        // Only apply discounts to Standard category flags
        if (pair.category == CATEGORY_STANDARD) {
            if (hasPremium[buyer]) {
                // 75% discount = pay 25%
                return basePrice - (basePrice * PREMIUM_DISCOUNT_BPS / BASIS_POINTS);
            } else if (hasPlus[buyer]) {
                // 50% discount = pay 50%
                return basePrice - (basePrice * PLUS_DISCOUNT_BPS / BASIS_POINTS);
            }
        }

        return basePrice;
    }

    /**
     * @notice Calculate total price for all NFTs with discount
     * @param flagId The flag ID
     * @param buyer The buyer address
     * @return Total price for all required NFTs after discount
     */
    function getTotalPriceWithDiscount(
        uint256 flagId,
        address buyer
    ) external view returns (uint256) {
        if (!_flagExists[flagId]) revert FlagNotRegistered(flagId);
        return getPriceWithDiscount(flagId, buyer) * flagPairs[flagId].nftsRequired;
    }

    /**
     * @notice Get total number of registered flags
     * @return Count of registered flags
     */
    function getTotalRegisteredFlags() external view returns (uint256) {
        return _registeredFlagIds.length;
    }

    /**
     * @notice Get all registered flag IDs
     * @return Array of flag IDs
     */
    function getRegisteredFlagIds() external view returns (uint256[] memory) {
        return _registeredFlagIds;
    }

    /**
     * @notice Check if user has Plus discount
     * @param user Address to check
     * @return True if user has Plus
     */
    function userHasPlus(address user) external view returns (bool) {
        return hasPlus[user];
    }

    /**
     * @notice Check if user has Premium discount
     * @param user Address to check
     * @return True if user has Premium
     */
    function userHasPremium(address user) external view returns (bool) {
        return hasPremium[user];
    }

    /**
     * @notice Get the highest discount tier for a user
     * @param user Address to check
     * @return 0=None, 1=Plus, 2=Premium
     */
    function getUserDiscountTier(address user) external view returns (uint8) {
        if (hasPremium[user]) return CATEGORY_PREMIUM;
        if (hasPlus[user]) return CATEGORY_PLUS;
        return 0;
    }

    /**
     * @notice Get the flag ID for a token
     * @param tokenId The token ID
     * @return Flag ID that this token belongs to
     */
    function getFlagIdForToken(uint256 tokenId) external view returns (uint256) {
        return tokenToFlag[tokenId];
    }

    /**
     * @notice Check if a token is a first NFT or second NFT
     * @param tokenId The token ID
     * @return True if first NFT, false if second NFT
     */
    function isTokenFirstNFT(uint256 tokenId) external view returns (bool) {
        return isFirstNFT[tokenId];
    }

    /**
     * @notice Get total tokens minted
     * @return Current token counter value
     */
    function getTotalTokensMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get contract balance
     * @return Balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // =============================================================================
    // ERC721 OVERRIDES
    // =============================================================================

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        // Check token exists
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        if (bytes(baseURI).length == 0) {
            return "";
        }

        // Format: baseURI/tokenId.json
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // =============================================================================
    // RECEIVE FUNCTION
    // =============================================================================

    /// @notice Allow contract to receive ETH/MATIC directly
    receive() external payable {}
}
