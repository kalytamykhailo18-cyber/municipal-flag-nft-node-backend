const hre = require("hardhat");
require("dotenv").config({ path: "../.env" });

async function main() {
  console.log("🚀 Deploying MunicipalFlagNFT contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "POL");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());

  // Get gas price info
  const feeData = await hre.ethers.provider.getFeeData();
  console.log("⛽ Gas Price:", hre.ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");
  console.log("⛽ Max Fee:", hre.ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei"), "gwei");
  console.log("⛽ Max Priority:", hre.ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, "gwei"), "gwei\n");

  // Get base URI from environment or use default
  const baseURI = process.env.NFT_BASE_URI || "https://gateway.pinata.cloud/ipfs/";
  console.log("🔗 Base URI:", baseURI);

  // Estimate gas for deployment
  const MunicipalFlagNFT = await hre.ethers.getContractFactory("MunicipalFlagNFT");
  const deployTx = await MunicipalFlagNFT.getDeployTransaction(baseURI);
  const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
  const gasPrice = feeData.gasPrice || hre.ethers.parseUnits("25", "gwei");
  const estimatedCost = estimatedGas * gasPrice;
  console.log("📊 Estimated gas:", estimatedGas.toString());
  console.log("📊 Estimated cost:", hre.ethers.formatEther(estimatedCost), "POL\n");

  // Check if we have enough balance
  if (balance < estimatedCost) {
    console.log("❌ Insufficient balance!");
    console.log("   Need:", hre.ethers.formatEther(estimatedCost), "POL");
    console.log("   Have:", hre.ethers.formatEther(balance), "POL");
    console.log("   Short by:", hre.ethers.formatEther(estimatedCost - balance), "POL");
    throw new Error("Insufficient funds for deployment");
  }

  console.log("🚀 Deploying contract...");
  const contract = await MunicipalFlagNFT.deploy(baseURI);

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("\n✅ MunicipalFlagNFT deployed to:", contractAddress);

  // Verify contract info
  console.log("\n📋 Contract Information:");
  console.log("   Name:", await contract.name());
  console.log("   Symbol:", await contract.symbol());
  console.log("   Owner:", await contract.owner());

  // Network info (reuse from above)
  console.log("\n🌐 Network:", network.name);
  console.log("   Chain ID:", network.chainId.toString());

  // Save deployment info
  console.log("\n📁 Deployment Summary:");
  console.log("   ----------------------------------------");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   ----------------------------------------");
  console.log("\n⚠️  Please update your .env file with the CONTRACT_ADDRESS above!");

  // If on testnet, provide verification command
  if (network.chainId === 80002n) {
    console.log("\n📝 To verify on PolygonScan, run:");
    console.log(`   npx hardhat verify --network amoy ${contractAddress} "${baseURI}"`);
  }

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
