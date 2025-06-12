// Sui contract configuration for SuiGive crowdfunding platform
export const SUI_CONFIG = {
  // Package ID from the deployed smart contract
  PACKAGE_ID: '0x4bee3ad0e94bae438ae11f3dbe6c6977e1f35ed0cecdaac947ab8e7462a1d20e',
  // Campaign Manager object ID that manages all campaigns - replaces Registry
  CAMPAIGN_MANAGER_ID: '0xd8d38b02bd966b95750e61374c71fe083fefb495c0edf782b28ce27ca74c1040',
  // DEPRECATED: Registry ID (kept for backward compatibility)
  REGISTRY_ID: '0xd8d38b02bd966b95750e61374c71fe083fefb495c0edf782b28ce27ca74c1040',
  // SgSuiTreasury ID for the closed-loop token system
  TREASURY_ID: '0x0271c83399576b74456a124b9ed11ba28e06ae83f3c4886acf7d67197c490b2b',
  // Treasury Cap ID for the donation token (SG_USD)
  TREASURY_CAP_ID: '0xccda88de1ad742ba2cec1303585c28789cb36f78b018bc48fdd8344dca9aa853',
  // Campaign ID for the Clean Water Project
  CAMPAIGN_ID: '', // Will be populated after creating a new campaign
  // sgUSD token configuration
  SGUSD_MANAGER_ID: '0xdb8a5924efe01f4ef5cc83faca83cf78045bbb00c28b05d1e8018f0666596c2d',
  // SgSuiMinterCap ID for minting SG_SUI tokens
  SGSUI_MINTER_CAP_ID: '0xb76bbb45ac9669811077cafe6d9f1e768561998f235c27b4e2f84f27f36a931c',
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
