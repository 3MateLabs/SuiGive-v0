// Sui contract configuration for SuiGive crowdfunding platform
export const SUI_CONFIG = {
  // Package ID from the deployed smart contract
  PACKAGE_ID: '0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187',
  // Registry object ID that stores all campaigns - will be created on initialization
  REGISTRY_ID: '0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b',
  // SgSuiTreasury ID for the closed-loop token system
  TREASURY_ID: '0x78e9fce20e895c509d525ea53340139a31333bd5afe7fdadbb1d6755f9aa8338',
  // Treasury Cap ID for the donation token
  TREASURY_CAP_ID: '0x5afae39c3e945e0a17938e3d46f4d9dd81ae9749380b23f6ca1763e4b44ee7f3',
  // Campaign ID for the Clean Water Project
  CAMPAIGN_ID: '', // Will be populated after creating a new campaign
  // sgUSD token configuration
  SGUSD_MANAGER_ID: '0x5eac564bc4a2cece19f126be160a752e859114cbd3cc24b23fc1e7f0879cc9c9',
  // SgSuiMinterCap ID for minting SG_SUI tokens
  SGSUI_MINTER_CAP_ID: '0xcbdd3d022470545c8555becdd9eb23f48463f1427c72745f1278e71f2f085baa',
  // Deployer address for admin operations
  DEPLOYER_ADDRESS: '0x4822bfc9c86d1a77daf48b0bdf8f012ae9b7f8f01b4195dc0f3fd4fb838525bd',
  // Network configuration
  NETWORK: 'testnet', // Change to 'mainnet' for production
  // Full node URL - using local proxy to avoid CORS issues
  FULLNODE_URL: '/api/sui-proxy'
};
