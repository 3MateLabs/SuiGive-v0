// Environment-based configuration for SuiGive
// This file reads from .env file but falls back to hardcoded values if env vars aren't set

// Import dotenv to load environment variables from .env file
import 'dotenv/config';

// Configuration object with environment variables and fallbacks
export const ENV_CONFIG = {
  // Package ID from the deployed smart contract
  PACKAGE_ID: process.env.PACKAGE_ID || '0x210948b3dd5deb852eebf1fbcc6eb3a2c66f1e5d0a962795390975ede03bdaef',
  // Registry object ID that stores all campaigns
  REGISTRY_ID: process.env.REGISTRY_ID || '0x644ce8e8bb410c0f7debb49de0dfec019886d6f3ee780c41d5002908b66e18e3',
  // SgSuiTreasury ID for the closed-loop token system
  TREASURY_ID: process.env.TREASURY_ID || '0x231b9e385a16297fdff43e4c27920aec8c4588a4bf302512e46d17c17dd6a7cc',
  // Treasury Cap ID for the donation token
  TREASURY_CAP_ID: process.env.TREASURY_CAP_ID || '0x13a4e9a1b0548495f90653975651563d74fae84f6046e375d04122b6d201c073',
  // Campaign ID for the Clean Water Project
  CAMPAIGN_ID: process.env.CAMPAIGN_ID || '', // Will be populated after creating a new campaign
  // sgUSD token configuration
  SGUSD_MANAGER_ID: process.env.SGUSD_MANAGER_ID || '0x2986f0d5c25380bef314265eedc62e4e4c534bd7fd0abcc19f667bf10c2e2e3a',
  // Deployer address for admin operations
  DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS || '0x4822bfc9c86d1a77daf48b0bdf8f012ae9b7f8f01b4195dc0f3fd4fb838525bd',
  // Network configuration
  NETWORK: process.env.NETWORK || 'testnet', // Change to 'mainnet' for production
  // Full node URL - using local proxy to avoid CORS issues
  FULLNODE_URL: process.env.FULLNODE_URL || '/api/sui-proxy'
};

// Export for backward compatibility with existing code
export const SUI_CONFIG = ENV_CONFIG;
