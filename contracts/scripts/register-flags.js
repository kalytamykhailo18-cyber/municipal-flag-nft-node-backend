const hre = require("hardhat");
require("dotenv").config({ path: "../.env" });

/**
 * Script to register flags on the deployed contract.
 *
 * DATA FLOW (following overview/rule.md):
 * =========================================
 * 1. Fetch flags from Backend API:
 *    - flag_id: number (no conversion needed)
 *    - category: string ("standard", "plus", "premium") -> must convert to uint8 (0, 1, 2)
 *    - price: string ("0.05000000") -> must convert to wei using parseEther
 *    - nfts_required: number (no conversion needed)
 *    - metadata_ipfs_hash: string (no conversion needed)
 *
 * 2. Convert data types for contract:
 *    - Category: string → uint8 (0=standard, 1=plus, 2=premium)
 *    - Price: string → BigInt (wei) using parseEther
 *    - Other fields: direct pass-through
 *
 * Run this after Phase 3 (IPFS upload) to register flags in the contract.
 */

// Category mapping: string -> uint8
// CRITICAL: Must match contract enum: Standard=0, Plus=1, Premium=2
const CATEGORY_MAP = {
  "standard": 0,
  "plus": 1,
  "premium": 2
};

async function fetchFlagsFromAPI(apiUrl) {
  /**
   * Fetch all flags from the backend API.
   *
   * API Response data types:
   * - id: number
   * - category: string ("standard", "plus", "premium")
   * - price: string ("0.05000000")
   * - nfts_required: number (CAUTION: may be wrong due to Pydantic bug, but we use it since contract doesn't have it yet)
   * - metadata_ipfs_hash: string
   */
  const response = await fetch(`${apiUrl}/flags/`, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flags: ${response.status} ${response.statusText}`);
  }

  const flags = await response.json();
  console.log(`📥 Fetched ${flags.length} flags from API`);
  return flags;
}

function convertFlagForContract(flag) {
  /**
   * Convert API flag data to contract-compatible types.
   *
   * DATA TYPE CONVERSIONS (following overview/rule.md):
   * - category: "premium" -> 2 (uint8)
   * - price: "0.05000000" -> 50000000000000000n (wei)
   * - nfts_required: 3 -> 3 (uint8, no conversion)
   */

  // Validate category string
  const categoryStr = flag.category?.toLowerCase() || "standard";
  if (!(categoryStr in CATEGORY_MAP)) {
    console.warn(`⚠️ Unknown category "${flag.category}" for flag ${flag.id}, defaulting to standard`);
  }

  // Convert category: string -> uint8
  const category = CATEGORY_MAP[categoryStr] ?? 0;

  // Convert price: string -> wei (BigInt)
  // API returns price as string with 8 decimals: "0.05000000"
  // Contract expects uint256 in wei
  let price;
  try {
    // parseEther handles decimal strings correctly
    price = hre.ethers.parseEther(flag.price?.toString() || "0.01");
  } catch (e) {
    console.warn(`⚠️ Invalid price "${flag.price}" for flag ${flag.id}, using default 0.01`);
    price = hre.ethers.parseEther("0.01");
  }

  // nfts_required: number -> uint8 (no conversion needed, but validate)
  const nftsRequired = Math.max(1, Math.min(255, flag.nfts_required || 1));

  return {
    flagId: flag.id,
    category: category,
    price: price,
    nftsRequired: nftsRequired,
    metadataHash: flag.metadata_ipfs_hash || ""
  };
}

async function main() {
  console.log("🚩 Registering flags on MunicipalFlagNFT contract...\n");
  console.log("📋 Data Flow: API -> Convert Types -> Contract");
  console.log("   Following rules from overview/rule.md\n");

  // Get configuration from environment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  console.log("📝 Contract address:", contractAddress);
  console.log("🌐 API URL:", apiUrl);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Using account:", deployer.address);

  // Connect to deployed contract
  const MunicipalFlagNFT = await hre.ethers.getContractFactory("MunicipalFlagNFT");
  const contract = MunicipalFlagNFT.attach(contractAddress);

  // Fetch flags from API
  console.log("\n📡 Fetching flags from backend API...");
  let apiFlags;
  try {
    apiFlags = await fetchFlagsFromAPI(apiUrl);
  } catch (error) {
    console.error("❌ Failed to fetch from API:", error.message);
    console.log("\n⚠️ Falling back to hardcoded demo data...");
    apiFlags = generateDemoFlags();
  }

  // Convert flags to contract format
  console.log("\n🔄 Converting data types for contract...");
  const contractFlags = apiFlags.map(flag => {
    const converted = convertFlagForContract(flag);
    // Log first few conversions for verification
    if (converted.flagId <= 3) {
      console.log(`   Flag ${converted.flagId}:`);
      console.log(`     category: "${flag.category}" -> ${converted.category}`);
      console.log(`     price: "${flag.price}" -> ${converted.price} wei`);
      console.log(`     nfts_required: ${flag.nfts_required} -> ${converted.nftsRequired}`);
    }
    return converted;
  });

  // Check current registration status
  const currentCount = await contract.getTotalRegisteredFlags();
  console.log(`\n📊 Currently registered flags: ${currentCount}`);

  if (currentCount >= BigInt(contractFlags.length)) {
    console.log("✅ All flags already registered!");
    return;
  }

  // Batch register flags (in groups of 10 to avoid gas limits)
  const batchSize = 10;
  const totalFlags = contractFlags.length;

  for (let i = 0; i < totalFlags; i += batchSize) {
    const batch = contractFlags.slice(i, Math.min(i + batchSize, totalFlags));

    const flagIds = batch.map((f) => f.flagId);
    const categories = batch.map((f) => f.category);
    const prices = batch.map((f) => f.price);
    const nftsRequiredArr = batch.map((f) => f.nftsRequired);

    console.log(`\n📦 Registering batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalFlags / batchSize)}`);
    console.log(`   Flag IDs: ${flagIds[0]} - ${flagIds[flagIds.length - 1]}`);

    try {
      const tx = await contract.batchRegisterFlags(flagIds, categories, prices, nftsRequiredArr);
      console.log(`   Transaction: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Batch registered successfully!`);
    } catch (error) {
      if (error.message.includes("Flag already registered")) {
        console.log(`   ⚠️ Some flags in this batch already registered, skipping...`);
      } else {
        throw error;
      }
    }
  }

  // Verify final count
  const finalCount = await contract.getTotalRegisteredFlags();
  console.log(`\n🎉 Registration complete!`);
  console.log(`   Total registered flags: ${finalCount}`);

  // Summary by category
  const summary = { premium: 0, plus: 0, standard: 0 };
  contractFlags.forEach(f => {
    if (f.category === 2) summary.premium++;
    else if (f.category === 1) summary.plus++;
    else summary.standard++;
  });

  console.log("\n📋 Summary:");
  console.log(`   Premium flags (category=2): ${summary.premium}`);
  console.log(`   Plus flags (category=1): ${summary.plus}`);
  console.log(`   Standard flags (category=0): ${summary.standard}`);
  console.log(`   Total: ${contractFlags.length}`);
}

/**
 * Generate demo flags if API is not available.
 * Falls back to hardcoded data matching seed_data.py
 */
function generateDemoFlags() {
  const flags = [];

  for (let i = 1; i <= 64; i++) {
    let category, price, nftsRequired;

    // Town Hall flags (every 8th starting from 1) are Premium with multi-NFT
    if (i % 8 === 1) {
      category = "premium";
      price = process.env.DEFAULT_PREMIUM_PRICE || "0.05";
      nftsRequired = 3;  // Premium flags require 3 NFTs
    }
    // Fire Station and Bridge flags are Plus
    else if (i % 8 === 2 || i % 8 === 7) {
      category = "plus";
      price = process.env.DEFAULT_PLUS_PRICE || "0.02";
      nftsRequired = 1;
    }
    // Rest are Standard
    else {
      category = "standard";
      price = process.env.DEFAULT_STANDARD_PRICE || "0.01";
      nftsRequired = 1;
    }

    flags.push({
      id: i,
      category: category,
      price: price,
      nfts_required: nftsRequired,
      metadata_ipfs_hash: ""
    });
  }

  console.log(`   Generated ${flags.length} demo flags`);
  return flags;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Registration failed:", error);
    process.exit(1);
  });
