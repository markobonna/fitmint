import { ethers } from "hardhat";

async function main() {
  console.log("Deploying FitMintCore to World Chain...");

  // Mock addresses for development - replace with actual addresses
  const WLD_TOKEN_ADDRESS = process.env.WLD_TOKEN_ADDRESS || "0x163f8C2467924be0ae7B5347228CABF260318753"; // Placeholder
  const HEALTH_ORACLE_ADDRESS = process.env.HEALTH_ORACLE_ADDRESS || "0x0000000000000000000000000000000000000001"; // Placeholder
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy FitMintCore contract
  const FitMintCore = await ethers.getContractFactory("FitMintCore");
  const contract = await FitMintCore.deploy(WLD_TOKEN_ADDRESS, HEALTH_ORACLE_ADDRESS);
  
  await contract.deployed();
  console.log("FitMintCore deployed to:", contract.address);
  
  // Initial configuration
  console.log("Configuring contract...");
  
  // Set initial daily reward pool (100K WLD)
  const initialPool = ethers.utils.parseEther("100000");
  await contract.updateDailyPool(initialPool);
  console.log("Daily reward pool set to:", initialPool.toString());
  
  // Create sample challenge
  const challengeName = "Weekend Warrior Challenge";
  const targetSteps = 50000; // 50k steps
  const duration = 48 * 60 * 60; // 48 hours
  const prizePool = ethers.utils.parseEther("1000"); // 1000 WLD
  
  await contract.createChallenge(challengeName, targetSteps, duration, prizePool);
  console.log("Sample challenge created:", challengeName);
  
  // Unpause the contract for production use
  await contract.unpause();
  console.log("Contract unpaused and ready for use");
  
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contract.address);
  console.log("WLD Token:", WLD_TOKEN_ADDRESS);
  console.log("Health Oracle:", HEALTH_ORACLE_ADDRESS);
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  
  // Verification instructions
  console.log("\n=== Verification Command ===");
  console.log(`npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${contract.address} ${WLD_TOKEN_ADDRESS} ${HEALTH_ORACLE_ADDRESS}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});