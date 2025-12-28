const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MunicipalFlagNFT", function () {
  let contract;
  let owner;
  let user1;
  let user2;
  let user3;

  const BASE_URI = "https://gateway.pinata.cloud/ipfs/test/";
  const FLAG_ID_1 = 1;
  const FLAG_ID_2 = 2;
  const FLAG_ID_3 = 3;
  const FLAG_ID_MULTI = 100;  // For multi-NFT tests

  const CATEGORY_STANDARD = 0;
  const CATEGORY_PLUS = 1;
  const CATEGORY_PREMIUM = 2;

  const PRICE_STANDARD = ethers.parseEther("0.01");
  const PRICE_PLUS = ethers.parseEther("0.02");
  const PRICE_PREMIUM = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MunicipalFlagNFT = await ethers.getContractFactory("MunicipalFlagNFT");
    contract = await MunicipalFlagNFT.deploy(BASE_URI);
    await contract.waitForDeployment();
  });

  // ===========================================================================
  // DEPLOYMENT TESTS
  // ===========================================================================

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should set the correct name and symbol", async function () {
      expect(await contract.name()).to.equal("Municipal Flag NFT");
      expect(await contract.symbol()).to.equal("MFLAG");
    });

    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should have zero registered flags initially", async function () {
      expect(await contract.getTotalRegisteredFlags()).to.equal(0);
    });

    it("Should have zero tokens minted initially", async function () {
      expect(await contract.getTotalTokensMinted()).to.equal(0);
    });
  });

  // ===========================================================================
  // FLAG REGISTRATION TESTS
  // ===========================================================================

  describe("Flag Registration", function () {
    it("Owner can register a Standard flag with nftsRequired", async function () {
      await expect(contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1))
        .to.emit(contract, "FlagRegistered")
        .withArgs(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);

      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.flagId).to.equal(FLAG_ID_1);
      expect(pair.category).to.equal(CATEGORY_STANDARD);
      expect(pair.price).to.equal(PRICE_STANDARD);
      expect(pair.nftsRequired).to.equal(1);
      expect(pair.firstMinted).to.be.false;
      expect(pair.secondMinted).to.be.false;
      expect(pair.pairComplete).to.be.false;
    });

    it("Owner can register a flag using registerFlagSimple (backward compatible)", async function () {
      await expect(contract.registerFlagSimple(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD))
        .to.emit(contract, "FlagRegistered")
        .withArgs(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);

      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.nftsRequired).to.equal(1);
    });

    it("Owner can register a multi-NFT flag (nftsRequired=3)", async function () {
      await contract.registerFlag(FLAG_ID_MULTI, CATEGORY_PLUS, PRICE_PLUS, 3);

      const pair = await contract.getFlagPair(FLAG_ID_MULTI);
      expect(pair.nftsRequired).to.equal(3);
    });

    it("Owner can register a Plus flag", async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_PLUS, PRICE_PLUS, 1);
      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.category).to.equal(CATEGORY_PLUS);
    });

    it("Owner can register a Premium flag", async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_PREMIUM, PRICE_PREMIUM, 1);
      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.category).to.equal(CATEGORY_PREMIUM);
    });

    it("Non-owner cannot register a flag", async function () {
      await expect(
        contract.connect(user1).registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Cannot register same flag ID twice", async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await expect(
        contract.registerFlag(FLAG_ID_1, CATEGORY_PLUS, PRICE_PLUS, 1)
      ).to.be.revertedWithCustomError(contract, "FlagAlreadyRegistered");
    });

    it("Cannot register with invalid category", async function () {
      await expect(
        contract.registerFlag(FLAG_ID_1, 3, PRICE_STANDARD, 1)
      ).to.be.revertedWithCustomError(contract, "InvalidCategory");
    });

    it("Cannot register with zero price", async function () {
      await expect(
        contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, 0, 1)
      ).to.be.revertedWithCustomError(contract, "InvalidPrice");
    });

    it("Cannot register with zero nftsRequired", async function () {
      await expect(
        contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 0)
      ).to.be.revertedWithCustomError(contract, "InvalidNftsRequired");
    });

    it("Cannot register with nftsRequired > 10", async function () {
      await expect(
        contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 11)
      ).to.be.revertedWithCustomError(contract, "InvalidNftsRequired");
    });

    it("Can batch register multiple flags with nftsRequired", async function () {
      const flagIds = [1, 2, 3];
      const categories = [CATEGORY_STANDARD, CATEGORY_PLUS, CATEGORY_PREMIUM];
      const prices = [PRICE_STANDARD, PRICE_PLUS, PRICE_PREMIUM];
      const nftsRequired = [1, 1, 3];

      await contract.batchRegisterFlags(flagIds, categories, prices, nftsRequired);

      expect(await contract.getTotalRegisteredFlags()).to.equal(3);

      const pair3 = await contract.getFlagPair(3);
      expect(pair3.nftsRequired).to.equal(3);
    });

    it("Can batch register multiple flags with batchRegisterFlagsSimple", async function () {
      const flagIds = [1, 2, 3];
      const categories = [CATEGORY_STANDARD, CATEGORY_PLUS, CATEGORY_PREMIUM];
      const prices = [PRICE_STANDARD, PRICE_PLUS, PRICE_PREMIUM];

      await contract.batchRegisterFlagsSimple(flagIds, categories, prices);

      expect(await contract.getTotalRegisteredFlags()).to.equal(3);

      for (let i = 0; i < flagIds.length; i++) {
        const pair = await contract.getFlagPair(flagIds[i]);
        expect(pair.nftsRequired).to.equal(1);
      }
    });
  });

  // ===========================================================================
  // FIRST NFT CLAIM TESTS
  // ===========================================================================

  describe("First NFT Claim", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
    });

    it("User can claim first NFT for free", async function () {
      await expect(contract.connect(user1).claimFirstNFT(FLAG_ID_1))
        .to.emit(contract, "FirstNFTClaimed")
        .withArgs(FLAG_ID_1, 1, user1.address, 1);

      expect(await contract.ownerOf(1)).to.equal(user1.address);
      expect(await contract.balanceOf(user1.address)).to.equal(1);

      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.firstMinted).to.be.true;
      expect(pair.firstTokenId).to.equal(1);
      expect(pair.firstOwner).to.equal(user1.address);
    });

    it("Cannot claim first NFT twice", async function () {
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      await expect(
        contract.connect(user2).claimFirstNFT(FLAG_ID_1)
      ).to.be.revertedWithCustomError(contract, "FirstNFTAlreadyClaimed");
    });

    it("Cannot claim unregistered flag", async function () {
      await expect(
        contract.connect(user1).claimFirstNFT(999)
      ).to.be.revertedWithCustomError(contract, "FlagNotRegistered");
    });

    it("Token is mapped to correct flag", async function () {
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      expect(await contract.getFlagIdForToken(1)).to.equal(FLAG_ID_1);
    });

    it("Token is marked as first NFT", async function () {
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      expect(await contract.isTokenFirstNFT(1)).to.be.true;
    });
  });

  // ===========================================================================
  // MULTI-NFT CLAIM TESTS
  // ===========================================================================

  describe("Multi-NFT Claim", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_MULTI, CATEGORY_STANDARD, PRICE_STANDARD, 3);
    });

    it("User claims all 3 first NFTs in one transaction", async function () {
      const tx = await contract.connect(user1).claimFirstNFT(FLAG_ID_MULTI);

      // Should mint 3 tokens
      expect(await contract.balanceOf(user1.address)).to.equal(3);
      expect(await contract.ownerOf(1)).to.equal(user1.address);
      expect(await contract.ownerOf(2)).to.equal(user1.address);
      expect(await contract.ownerOf(3)).to.equal(user1.address);

      // Check flag state
      const pair = await contract.getFlagPair(FLAG_ID_MULTI);
      expect(pair.firstMinted).to.be.true;
      expect(pair.firstMintedCount).to.equal(3);
      expect(pair.firstTokenId).to.equal(1);  // First of the group

      // Check token arrays
      const firstTokenIds = await contract.getFirstTokenIds(FLAG_ID_MULTI);
      expect(firstTokenIds.length).to.equal(3);
      expect(firstTokenIds[0]).to.equal(1);
      expect(firstTokenIds[1]).to.equal(2);
      expect(firstTokenIds[2]).to.equal(3);
    });

    it("All first NFTs are marked as first NFTs", async function () {
      await contract.connect(user1).claimFirstNFT(FLAG_ID_MULTI);

      expect(await contract.isTokenFirstNFT(1)).to.be.true;
      expect(await contract.isTokenFirstNFT(2)).to.be.true;
      expect(await contract.isTokenFirstNFT(3)).to.be.true;
    });
  });

  // ===========================================================================
  // SECOND NFT PURCHASE TESTS
  // ===========================================================================

  describe("Second NFT Purchase", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
    });

    it("User can purchase second NFT", async function () {
      await expect(
        contract.connect(user2).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_STANDARD })
      )
        .to.emit(contract, "SecondNFTPurchased")
        .withArgs(FLAG_ID_1, 2, user2.address, PRICE_STANDARD, 1)
        .and.to.emit(contract, "PairCompleted")
        .withArgs(FLAG_ID_1, user2.address);

      expect(await contract.ownerOf(2)).to.equal(user2.address);

      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.secondMinted).to.be.true;
      expect(pair.pairComplete).to.be.true;
      expect(pair.secondOwner).to.equal(user2.address);
    });

    it("Second NFT is marked as not first NFT", async function () {
      await contract.connect(user2).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_STANDARD });
      expect(await contract.isTokenFirstNFT(2)).to.be.false;
    });

    it("Cannot purchase before first is claimed", async function () {
      await contract.registerFlag(FLAG_ID_2, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await expect(
        contract.connect(user1).purchaseSecondNFT(FLAG_ID_2, { value: PRICE_STANDARD })
      ).to.be.revertedWithCustomError(contract, "FirstNFTNotClaimed");
    });

    it("Cannot purchase second NFT twice", async function () {
      await contract.connect(user2).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_STANDARD });
      await expect(
        contract.connect(user3).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_STANDARD })
      ).to.be.revertedWithCustomError(contract, "SecondNFTAlreadyPurchased");
    });

    it("Cannot purchase with insufficient payment", async function () {
      const lowPrice = ethers.parseEther("0.001");
      await expect(
        contract.connect(user2).purchaseSecondNFT(FLAG_ID_1, { value: lowPrice })
      ).to.be.revertedWithCustomError(contract, "InsufficientPayment");
    });

    it("Excess payment is refunded", async function () {
      const excessPayment = ethers.parseEther("0.1");
      const balanceBefore = await ethers.provider.getBalance(user2.address);

      const tx = await contract.connect(user2).purchaseSecondNFT(FLAG_ID_1, { value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user2.address);
      const spent = balanceBefore - balanceAfter;

      // Should have spent approximately PRICE_STANDARD + gas, not excessPayment + gas
      expect(spent).to.be.lessThan(excessPayment);
    });
  });

  // ===========================================================================
  // MULTI-NFT PURCHASE TESTS
  // ===========================================================================

  describe("Multi-NFT Purchase", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_MULTI, CATEGORY_STANDARD, PRICE_STANDARD, 3);
      await contract.connect(user1).claimFirstNFT(FLAG_ID_MULTI);
    });

    it("User must pay for all 3 NFTs", async function () {
      const totalPrice = PRICE_STANDARD * 3n;

      await expect(
        contract.connect(user2).purchaseSecondNFT(FLAG_ID_MULTI, { value: totalPrice })
      ).to.emit(contract, "PairCompleted");

      // Should mint 3 more tokens (4, 5, 6 - tokens 1, 2, 3 were first NFTs)
      expect(await contract.balanceOf(user2.address)).to.equal(3);

      const pair = await contract.getFlagPair(FLAG_ID_MULTI);
      expect(pair.secondMinted).to.be.true;
      expect(pair.secondMintedCount).to.equal(3);
      expect(pair.pairComplete).to.be.true;

      // Check token arrays
      const secondTokenIds = await contract.getSecondTokenIds(FLAG_ID_MULTI);
      expect(secondTokenIds.length).to.equal(3);
    });

    it("Insufficient payment for multi-NFT fails", async function () {
      const insufficientPrice = PRICE_STANDARD * 2n; // Only 2x price, need 3x

      await expect(
        contract.connect(user2).purchaseSecondNFT(FLAG_ID_MULTI, { value: insufficientPrice })
      ).to.be.revertedWithCustomError(contract, "InsufficientPayment");
    });

    it("getTotalPriceWithDiscount returns correct multi-NFT price", async function () {
      const totalPrice = await contract.getTotalPriceWithDiscount(FLAG_ID_MULTI, user2.address);
      expect(totalPrice).to.equal(PRICE_STANDARD * 3n);
    });
  });

  // ===========================================================================
  // DISCOUNT TESTS
  // ===========================================================================

  describe("Discount System", function () {
    beforeEach(async function () {
      // Register flags of different categories
      await contract.registerFlag(FLAG_ID_1, CATEGORY_PLUS, PRICE_PLUS, 1);
      await contract.registerFlag(FLAG_ID_2, CATEGORY_PREMIUM, PRICE_PREMIUM, 1);
      await contract.registerFlag(FLAG_ID_3, CATEGORY_STANDARD, PRICE_STANDARD, 1);
    });

    it("Plus purchase grants 50% discount on Standard", async function () {
      // Claim and purchase Plus flag
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      await expect(
        contract.connect(user1).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_PLUS })
      ).to.emit(contract, "DiscountGranted").withArgs(user1.address, CATEGORY_PLUS);

      // User should now have Plus discount
      expect(await contract.userHasPlus(user1.address)).to.be.true;
      expect(await contract.getUserDiscountTier(user1.address)).to.equal(CATEGORY_PLUS);

      // Check discounted price for Standard flag
      const discountedPrice = await contract.getPriceWithDiscount(FLAG_ID_3, user1.address);
      expect(discountedPrice).to.equal(PRICE_STANDARD / 2n); // 50% discount
    });

    it("Premium purchase grants 75% discount on Standard", async function () {
      // Claim and purchase Premium flag
      await contract.connect(user1).claimFirstNFT(FLAG_ID_2);
      await expect(
        contract.connect(user1).purchaseSecondNFT(FLAG_ID_2, { value: PRICE_PREMIUM })
      ).to.emit(contract, "DiscountGranted").withArgs(user1.address, CATEGORY_PREMIUM);

      // User should now have Premium discount
      expect(await contract.userHasPremium(user1.address)).to.be.true;
      expect(await contract.getUserDiscountTier(user1.address)).to.equal(CATEGORY_PREMIUM);

      // Check discounted price for Standard flag
      const discountedPrice = await contract.getPriceWithDiscount(FLAG_ID_3, user1.address);
      expect(discountedPrice).to.equal(PRICE_STANDARD / 4n); // 75% discount (25% of original)
    });

    it("Premium discount takes precedence over Plus", async function () {
      // Get both Plus and Premium
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      await contract.connect(user1).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_PLUS });

      await contract.connect(user2).claimFirstNFT(FLAG_ID_2);
      await contract.connect(user1).purchaseSecondNFT(FLAG_ID_2, { value: PRICE_PREMIUM });

      // Should have 75% discount, not 50%
      const discountedPrice = await contract.getPriceWithDiscount(FLAG_ID_3, user1.address);
      expect(discountedPrice).to.equal(PRICE_STANDARD / 4n);
      expect(await contract.getUserDiscountTier(user1.address)).to.equal(CATEGORY_PREMIUM);
    });

    it("No discount on Plus/Premium category flags", async function () {
      // Even with Premium discount, Plus flags are full price
      await contract.connect(user1).claimFirstNFT(FLAG_ID_2);
      await contract.connect(user1).purchaseSecondNFT(FLAG_ID_2, { value: PRICE_PREMIUM });

      const plusPrice = await contract.getPriceWithDiscount(FLAG_ID_1, user1.address);
      expect(plusPrice).to.equal(PRICE_PLUS); // No discount
    });

    it("User without discounts pays full price", async function () {
      const fullPrice = await contract.getPriceWithDiscount(FLAG_ID_3, user1.address);
      expect(fullPrice).to.equal(PRICE_STANDARD);
      expect(await contract.getUserDiscountTier(user1.address)).to.equal(0);
    });
  });

  // ===========================================================================
  // WITHDRAWAL TESTS
  // ===========================================================================

  describe("Withdrawal", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      await contract.connect(user2).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_STANDARD });
    });

    it("Contract has correct balance after purchase", async function () {
      expect(await contract.getContractBalance()).to.equal(PRICE_STANDARD);
    });

    it("Owner can withdraw funds", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      await expect(contract.withdraw())
        .to.emit(contract, "Withdrawal")
        .withArgs(owner.address, PRICE_STANDARD);

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
      expect(await contract.getContractBalance()).to.equal(0);
    });

    it("Non-owner cannot withdraw", async function () {
      await expect(
        contract.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Cannot withdraw when balance is zero", async function () {
      await contract.withdraw(); // First withdrawal
      await expect(contract.withdraw()).to.be.revertedWithCustomError(contract, "NoBalanceToWithdraw");
    });
  });

  // ===========================================================================
  // BASE URI TESTS
  // ===========================================================================

  describe("Base URI", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
    });

    it("Token URI is correctly formatted", async function () {
      const tokenURI = await contract.tokenURI(1);
      expect(tokenURI).to.equal(BASE_URI + "1.json");
    });

    it("Owner can update base URI", async function () {
      const newURI = "https://newgateway.com/ipfs/";
      await expect(contract.setBaseURI(newURI))
        .to.emit(contract, "BaseURIUpdated")
        .withArgs(newURI);

      const tokenURI = await contract.tokenURI(1);
      expect(tokenURI).to.equal(newURI + "1.json");
    });

    it("Non-owner cannot update base URI", async function () {
      await expect(
        contract.connect(user1).setBaseURI("https://hack.com/")
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  // ===========================================================================
  // METADATA HASH TESTS
  // ===========================================================================

  describe("Metadata Hash", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
    });

    it("Owner can set metadata hash", async function () {
      const hash = "abc123def456";
      await expect(contract.setMetadataHash(FLAG_ID_1, hash))
        .to.emit(contract, "MetadataHashSet")
        .withArgs(FLAG_ID_1, hash);

      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.metadataHash).to.equal(hash);
    });

    it("Non-owner cannot set metadata hash", async function () {
      await expect(
        contract.connect(user1).setMetadataHash(FLAG_ID_1, "hash")
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Cannot set hash for unregistered flag", async function () {
      await expect(
        contract.setMetadataHash(999, "hash")
      ).to.be.revertedWithCustomError(contract, "FlagNotRegistered");
    });
  });

  // ===========================================================================
  // VIEW FUNCTIONS TESTS
  // ===========================================================================

  describe("View Functions", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await contract.registerFlag(FLAG_ID_2, CATEGORY_PLUS, PRICE_PLUS, 1);
    });

    it("getTotalRegisteredFlags returns correct count", async function () {
      expect(await contract.getTotalRegisteredFlags()).to.equal(2);
    });

    it("getRegisteredFlagIds returns all IDs", async function () {
      const ids = await contract.getRegisteredFlagIds();
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(FLAG_ID_1);
      expect(ids[1]).to.equal(FLAG_ID_2);
    });

    it("isFlagRegistered returns correct status", async function () {
      expect(await contract.isFlagRegistered(FLAG_ID_1)).to.be.true;
      expect(await contract.isFlagRegistered(999)).to.be.false;
    });

    it("getFlagPair returns correct data", async function () {
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);

      const pair = await contract.getFlagPair(FLAG_ID_1);
      expect(pair.flagId).to.equal(FLAG_ID_1);
      expect(pair.firstMinted).to.be.true;
      expect(pair.firstTokenId).to.equal(1);
      expect(pair.secondMinted).to.be.false;
      expect(pair.pairComplete).to.be.false;
    });

    it("getNftsRequired returns correct value", async function () {
      await contract.registerFlag(FLAG_ID_MULTI, CATEGORY_STANDARD, PRICE_STANDARD, 5);
      expect(await contract.getNftsRequired(FLAG_ID_MULTI)).to.equal(5);
    });
  });

  // ===========================================================================
  // ERC721 ENUMERABLE TESTS
  // ===========================================================================

  describe("ERC721 Enumerable", function () {
    beforeEach(async function () {
      await contract.registerFlag(FLAG_ID_1, CATEGORY_STANDARD, PRICE_STANDARD, 1);
      await contract.registerFlag(FLAG_ID_2, CATEGORY_STANDARD, PRICE_STANDARD, 1);
    });

    it("totalSupply increases with mints", async function () {
      expect(await contract.totalSupply()).to.equal(0);

      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      expect(await contract.totalSupply()).to.equal(1);

      await contract.connect(user1).purchaseSecondNFT(FLAG_ID_1, { value: PRICE_STANDARD });
      expect(await contract.totalSupply()).to.equal(2);
    });

    it("tokenOfOwnerByIndex works correctly", async function () {
      await contract.connect(user1).claimFirstNFT(FLAG_ID_1);
      await contract.connect(user1).claimFirstNFT(FLAG_ID_2);

      expect(await contract.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
      expect(await contract.tokenOfOwnerByIndex(user1.address, 1)).to.equal(2);
    });

    it("getTotalTokensMinted tracks all mints", async function () {
      await contract.registerFlag(FLAG_ID_MULTI, CATEGORY_STANDARD, PRICE_STANDARD, 3);
      await contract.connect(user1).claimFirstNFT(FLAG_ID_MULTI);  // Mints 3

      expect(await contract.getTotalTokensMinted()).to.equal(3);
    });
  });

  // ===========================================================================
  // RECEIVE FUNCTION TESTS
  // ===========================================================================

  describe("Receive Function", function () {
    it("Contract can receive MATIC directly", async function () {
      const amount = ethers.parseEther("1");

      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: amount
      });

      expect(await contract.getContractBalance()).to.equal(amount);
    });
  });
});
