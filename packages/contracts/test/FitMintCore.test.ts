import { expect } from "chai";
import { ethers } from "hardhat";
import { FitMintCore } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("FitMintCore", function () {
  let fitMintCore: FitMintCore;
  let mockWLDToken: any;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let healthOracle: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, healthOracle] = await ethers.getSigners();

    // Deploy mock WLD token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockWLDToken = await MockERC20.deploy("World Token", "WLD");
    await mockWLDToken.deployed();

    // Mint tokens for testing
    await mockWLDToken.mint(owner.address, ethers.utils.parseEther("1000000"));

    // Deploy FitMintCore
    const FitMintCore = await ethers.getContractFactory("FitMintCore");
    fitMintCore = await FitMintCore.deploy(mockWLDToken.address, healthOracle.address);
    await fitMintCore.deployed();

    // Fund the contract with WLD tokens
    await mockWLDToken.transfer(fitMintCore.address, ethers.utils.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set the correct WLD token address", async function () {
      expect(await fitMintCore.wldToken()).to.equal(mockWLDToken.address);
    });

    it("Should set the correct health oracle", async function () {
      expect(await fitMintCore.healthOracle()).to.equal(healthOracle.address);
    });

    it("Should set the correct owner", async function () {
      expect(await fitMintCore.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await fitMintCore.totalUsers()).to.equal(0);
      expect(await fitMintCore.totalRewardsDistributed()).to.equal(0);
      expect(await fitMintCore.nextChallengeId()).to.equal(0);
    });
  });

  describe("User Verification", function () {
    it("Should verify a new user", async function () {
      const worldIdHash = ethers.utils.formatBytes32String("test-hash");
      
      await expect(fitMintCore.connect(user1).verifyUser(worldIdHash))
        .to.emit(fitMintCore, "UserVerified")
        .withArgs(user1.address, worldIdHash);

      const userProfile = await fitMintCore.users(user1.address);
      expect(userProfile.isVerified).to.be.true;
      expect(userProfile.worldIdHash).to.equal(worldIdHash);
      expect(await fitMintCore.totalUsers()).to.equal(1);
    });

    it("Should not allow double verification", async function () {
      const worldIdHash = ethers.utils.formatBytes32String("test-hash");
      
      await fitMintCore.connect(user1).verifyUser(worldIdHash);
      
      await expect(
        fitMintCore.connect(user1).verifyUser(worldIdHash)
      ).to.be.revertedWith("Already verified");
    });
  });

  describe("Daily Reward Claims", function () {
    beforeEach(async function () {
      // Verify user first
      await fitMintCore.connect(user1).verifyUser(ethers.utils.formatBytes32String("test-hash"));
    });

    it("Should allow claim when step goal is met", async function () {
      const steps = 11000;
      const exerciseMinutes = 0;
      const calories = 400;
      const signature = "0x";

      await expect(
        fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature)
      ).to.emit(fitMintCore, "RewardClaimed");

      const userProfile = await fitMintCore.users(user1.address);
      expect(userProfile.totalClaimed).to.be.gt(0);
      expect(userProfile.streakDays).to.equal(1);
    });

    it("Should allow claim when exercise goal is met", async function () {
      const steps = 5000; // Below step threshold
      const exerciseMinutes = 35; // Above exercise threshold
      const calories = 300;
      const signature = "0x";

      await expect(
        fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature)
      ).to.emit(fitMintCore, "RewardClaimed");
    });

    it("Should reject claim if neither goal is met", async function () {
      const steps = 5000; // Below threshold
      const exerciseMinutes = 20; // Below threshold
      const calories = 200;
      const signature = "0x";

      await expect(
        fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature)
      ).to.be.revertedWith("Fitness goals not met");
    });

    it("Should enforce cooldown period", async function () {
      const steps = 11000;
      const exerciseMinutes = 0;
      const calories = 400;
      const signature = "0x";

      // First claim should succeed
      await fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature);

      // Second immediate claim should fail
      await expect(
        fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature)
      ).to.be.revertedWith("Claim cooldown not met");
    });

    it("Should reject unverified users", async function () {
      const steps = 11000;
      const exerciseMinutes = 0;
      const calories = 400;
      const signature = "0x";

      await expect(
        fitMintCore.connect(user2).claimDailyReward(steps, exerciseMinutes, calories, signature)
      ).to.be.revertedWith("User not verified");
    });

    it("Should calculate streak bonuses correctly", async function () {
      const steps = 11000;
      const exerciseMinutes = 0;
      const calories = 400;
      const signature = "0x";

      // First claim - streak = 1
      await fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature);
      let userProfile = await fitMintCore.users(user1.address);
      expect(userProfile.streakDays).to.equal(1);

      // Advance time by 24 hours
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Second claim - streak = 2
      await fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature);
      userProfile = await fitMintCore.users(user1.address);
      expect(userProfile.streakDays).to.equal(2);
    });

    it("Should reset streak if gap is too long", async function () {
      const steps = 11000;
      const exerciseMinutes = 0;
      const calories = 400;
      const signature = "0x";

      // First claim
      await fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature);
      
      // Advance time by 3 days (breaks streak)
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Second claim should reset streak to 1
      await fitMintCore.connect(user1).claimDailyReward(steps, exerciseMinutes, calories, signature);
      const userProfile = await fitMintCore.users(user1.address);
      expect(userProfile.streakDays).to.equal(1);
    });
  });

  describe("Challenges", function () {
    beforeEach(async function () {
      // Verify users
      await fitMintCore.connect(user1).verifyUser(ethers.utils.formatBytes32String("test-hash-1"));
      await fitMintCore.connect(user2).verifyUser(ethers.utils.formatBytes32String("test-hash-2"));
    });

    it("Should create a new challenge", async function () {
      const challengeName = "Weekend Warrior";
      const targetSteps = 50000;
      const duration = 48 * 60 * 60; // 48 hours
      const prizePool = ethers.utils.parseEther("100");

      await expect(
        fitMintCore.createChallenge(challengeName, targetSteps, duration, prizePool)
      ).to.emit(fitMintCore, "ChallengeCreated")
        .withArgs(0, challengeName, prizePool);

      const challenge = await fitMintCore.getChallengeDetails(0);
      expect(challenge.name).to.equal(challengeName);
      expect(challenge.targetSteps).to.equal(targetSteps);
      expect(challenge.prizePool).to.equal(prizePool);
      expect(challenge.isActive).to.be.true;
    });

    it("Should allow users to join challenges", async function () {
      // Create challenge
      await fitMintCore.createChallenge("Test Challenge", 30000, 24 * 60 * 60, ethers.utils.parseEther("50"));

      await expect(
        fitMintCore.connect(user1).joinChallenge(0)
      ).to.emit(fitMintCore, "ChallengeJoined")
        .withArgs(0, user1.address);

      expect(await fitMintCore.challengeParticipants(0, user1.address)).to.be.true;
      const challenge = await fitMintCore.getChallengeDetails(0);
      expect(challenge.participantCount).to.equal(1);
    });

    it("Should not allow unverified users to join challenges", async function () {
      // Create challenge
      await fitMintCore.createChallenge("Test Challenge", 30000, 24 * 60 * 60, ethers.utils.parseEther("50"));

      // Try to join with unverified user
      const [, , , unverifiedUser] = await ethers.getSigners();
      await expect(
        fitMintCore.connect(unverifiedUser).joinChallenge(0)
      ).to.be.revertedWith("User not verified");
    });

    it("Should not allow double joining", async function () {
      // Create challenge
      await fitMintCore.createChallenge("Test Challenge", 30000, 24 * 60 * 60, ethers.utils.parseEther("50"));
      
      // Join once
      await fitMintCore.connect(user1).joinChallenge(0);
      
      // Try to join again
      await expect(
        fitMintCore.connect(user1).joinChallenge(0)
      ).to.be.revertedWith("Already joined");
    });

    it("Should update challenge progress and complete challenge", async function () {
      // Create challenge
      await fitMintCore.createChallenge("Test Challenge", 30000, 24 * 60 * 60, ethers.utils.parseEther("50"));
      
      // Join challenge
      await fitMintCore.connect(user1).joinChallenge(0);
      
      // Update progress to complete challenge
      await expect(
        fitMintCore.connect(user1).updateChallengeProgress(0, 30000)
      ).to.emit(fitMintCore, "ChallengeCompleted")
        .withArgs(0, user1.address, ethers.utils.parseEther("50"));

      const challenge = await fitMintCore.getChallengeDetails(0);
      expect(challenge.winner).to.equal(user1.address);
      expect(challenge.isActive).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update daily pool", async function () {
      const newPool = ethers.utils.parseEther("200000");
      await fitMintCore.updateDailyPool(newPool);
      expect(await fitMintCore.dailyRewardPool()).to.equal(newPool);
    });

    it("Should not allow non-owner to update daily pool", async function () {
      const newPool = ethers.utils.parseEther("200000");
      await expect(
        fitMintCore.connect(user1).updateDailyPool(newPool)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to pause and unpause", async function () {
      await fitMintCore.emergencyPause();
      expect(await fitMintCore.paused()).to.be.true;

      await fitMintCore.unpause();
      expect(await fitMintCore.paused()).to.be.false;
    });

    it("Should prevent claims when paused", async function () {
      // Verify user
      await fitMintCore.connect(user1).verifyUser(ethers.utils.formatBytes32String("test-hash"));
      
      // Pause contract
      await fitMintCore.emergencyPause();

      // Try to claim (should fail)
      await expect(
        fitMintCore.connect(user1).claimDailyReward(11000, 0, 400, "0x")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow emergency withdrawal", async function () {
      const withdrawAmount = ethers.utils.parseEther("1000");
      const initialBalance = await mockWLDToken.balanceOf(owner.address);
      
      await fitMintCore.emergencyWithdraw(withdrawAmount);
      
      const finalBalance = await mockWLDToken.balanceOf(owner.address);
      expect(finalBalance.sub(initialBalance)).to.equal(withdrawAmount);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero reward pool gracefully", async function () {
      // Verify user
      await fitMintCore.connect(user1).verifyUser(ethers.utils.formatBytes32String("test-hash"));
      
      // Set pool to 0
      await fitMintCore.updateDailyPool(0);
      
      // Claim should still work but with minimal reward
      await expect(
        fitMintCore.connect(user1).claimDailyReward(11000, 0, 400, "0x")
      ).to.emit(fitMintCore, "RewardClaimed");
    });

    it("Should reject invalid health data", async function () {
      // Verify user
      await fitMintCore.connect(user1).verifyUser(ethers.utils.formatBytes32String("test-hash"));
      
      // Try with zero steps and minutes
      await expect(
        fitMintCore.connect(user1).claimDailyReward(0, 0, 0, "0x")
      ).to.be.revertedWith("Invalid health data");
    });

    it("Should handle massive step counts", async function () {
      // Verify user
      await fitMintCore.connect(user1).verifyUser(ethers.utils.formatBytes32String("test-hash"));
      
      // Try with unrealistic step count
      await expect(
        fitMintCore.connect(user1).claimDailyReward(200000, 0, 400, "0x")
      ).to.be.revertedWith("Invalid health data");
    });
  });
});