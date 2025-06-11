// Sui contract configuration for SuiGive crowdfunding platform
export const SUI_CONFIG = {
  // Package ID from the deployed smart contract
  PACKAGE_ID: '0x2c197bad6a8f24f57755ebbae999f70cd36dab9934dece4e20b95b6c44743e70',
  // Campaign Manager object ID that manages all campaigns - replaces Registry
  CAMPAIGN_MANAGER_ID: '0x3238492b12878201b67444e5fd41eb7be91657563ba7cf0e0b772cdd49821cd8',
  // DEPRECATED: Registry ID (kept for backward compatibility)
  REGISTRY_ID: '0x3238492b12878201b67444e5fd41eb7be91657563ba7cf0e0b772cdd49821cd8',
  // SgSuiTreasury ID for the closed-loop token system
  TREASURY_ID: '0x00ac8076d1825502eed6a0bf4763d00e4f34206e93f32c5a088ae638812ece8b',
  // Treasury Cap ID for the donation token (SG_USD)
  TREASURY_CAP_ID: '0xd5fe9b32c0f2950d9f4d10f9564c19aca7d5c5f0acf3ddb137ee367fdf9ef106',
  // Campaign ID for the Clean Water Project
  CAMPAIGN_ID: '', // Will be populated after creating a new campaign
  // sgUSD token configuration
  SGUSD_MANAGER_ID: '0xe3482d79fd307718c171fe16b655f90add26eb35fdeef6d9640ac9fcbd70085c',
  // SgSuiMinterCap ID for minting SG_SUI tokens
  SGSUI_MINTER_CAP_ID: '0x5658f4e1163f4df43e6e41581f1ad1f8302876ddca02badda7974818f0f99d7a',
  // Admin addresses
  PUBLISHER_ADDRESS: '0xf1df42d3b603f6d22fc276c25dd1eee4c3f767d7a7e7ec36bf9c3d416a74e228',
  BENEFICIARY_ADDRESS: '0x4822bfc9c86d1a77daf48b0bdf8f012ae9b7f8f01b4195dc0f3fd4fb838525bd',
  // Deployer address for admin operations (same as beneficiary)
  DEPLOYER_ADDRESS: '0x4822bfc9c86d1a77daf48b0bdf8f012ae9b7f8f01b4195dc0f3fd4fb838525bd',
  // Network configuration
  NETWORK: 'testnet', // Change to 'mainnet' for production
  // Full node URL - using local proxy to avoid CORS issues
  FULLNODE_URL: '/api/sui-proxy'
};
