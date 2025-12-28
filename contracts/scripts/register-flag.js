/**
 * Script to register a flag on the blockchain
 * Usage: npx hardhat run scripts/register-flag.js --network amoy
 *
 * Environment variables (from ../.env):
 *   CONTRACT_ADDRESS - The deployed contract address
 *   DEFAULT_STANDARD_PRICE - Price for standard flags (default: 0.01)
 *   DEFAULT_PLUS_PRICE - Price for plus flags (default: 0.02)
 *   DEFAULT_PREMIUM_PRICE - Price for premium flags (default: 0.05)
 *
 * Script variables (can be overridden via command line args or modified directly):
 *   FLAG_ID - The flag ID to register
 *   CATEGORY - 0=Standard, 1=Plus, 2=Premium
 */
const { ethers } = require("hardhat");
require("dotenv").config({ path: "../.env" });

async function main() {
  // Configuration - these can be modified by the backend before running
  const FLAG_ID = 69;
  const CATEGORY = 0;  // 0=Standard, 1=Plus, 2=Premium

  // Get price from .env based on category
  const CATEGORY_PRICES = {
    0: process.env.DEFAULT_STANDARD_PRICE || "0.01",
    1: process.env.DEFAULT_PLUS_PRICE || "0.02",
    2: process.env.DEFAULT_PREMIUM_PRICE || "0.05"
  };
  const PRICE = ethers.parseEther(CATEGORY_PRICES[CATEGORY]);

  // Contract address from .env
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  if (!CONTRACT_ADDRESS) {
    console.error("ERROR: CONTRACT_ADDRESS not found in .env file");
    process.exit(1);
  }

  console.log("Registering flag on blockchain...");
  console.log(`Flag ID: ${FLAG_ID}`);
  console.log(`Category: ${CATEGORY}`);
  console.log(`Price: ${ethers.formatEther(PRICE)} MATIC`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);

  // Get the contract
  const MunicipalFlagNFT = await ethers.getContractFactory("MunicipalFlagNFT");
  const contract = MunicipalFlagNFT.attach(CONTRACT_ADDRESS);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`\nUsing account: ${signer.address}`);

  // Check owner
  const owner = await contract.owner();
  console.log(`Contract owner: ${owner}`);

  if (signer.address.toLowerCase() !== owner.toLowerCase()) {
    console.error("\nERROR: Your wallet is not the contract owner!");
    console.error("Only the contract owner can register flags.");
    process.exit(1);
  }

  // Check if flag already registered
  try {
    const exists = await contract.isFlagRegistered(FLAG_ID);
    if (exists) {
      console.log(`\nFlag ${FLAG_ID} is already registered on the blockchain!`);
      process.exit(0);
    }
  } catch (e) {
    console.log("Could not check if flag exists, proceeding with registration...");
  }

  // Register the flag
  console.log("\nSending transaction...");
  const tx = await contract.registerFlagSimple(FLAG_ID, CATEGORY, PRICE);
  console.log(`Transaction hash: ${tx.hash}`);

  // Wait for confirmation
  console.log("Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  // Verify registration
  try {
    const existsNow = await contract.isFlagRegistered(FLAG_ID);
    console.log(`\nFlag ${FLAG_ID} registered: ${existsNow}`);
  } catch (e) {
    console.log("\nRegistration completed (could not verify)");
  }

  console.log("\nDone! Flag is now available for purchase.");
  console.log(`View on PolygonScan: https://amoy.polygonscan.com/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
