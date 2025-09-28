import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    worldchain: {
      url: process.env.WORLD_CHAIN_RPC_URL || "https://worldchain-mainnet.g.alchemy.com/public",
      accounts: [], // Configure with deployment wallet
      chainId: 480,
    },
    "worldchain-sepolia": {
      url: process.env.WORLD_CHAIN_TESTNET_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/public", 
      accounts: [], // Configure with deployment wallet
      chainId: 4801,
    },
  },
  etherscan: {
    apiKey: {
      worldchain: "configure-worldscan-api-key", // Set WORLDSCAN_API_KEY env var
    },
    customChains: [
      {
        network: "worldchain",
        chainId: 480,
        urls: {
          apiURL: "https://worldchain-mainnet.explorer.alchemy.com/api",
          browserURL: "https://worldchain-mainnet.explorer.alchemy.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;