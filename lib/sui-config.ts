// Sui contract configuration for SuiGive crowdfunding platform
export const SUI_CONFIG = {
  // Package ID from the deployed smart contract
  PACKAGE_ID: '0x69ef98c5a266ac2c109e764379b1ab2ea3a786c2a543277c2bef7a619a2308ff',
  // Campaign Manager object ID that manages all campaigns - replaces Registry
  CAMPAIGN_MANAGER_ID: '0xc6bd218faaccd0195918a301677c5a1066ac6316e0367cb397ee947546e17c48',
  // DEPRECATED: Registry ID (kept for backward compatibility)
  REGISTRY_ID: '0xc6bd218faaccd0195918a301677c5a1066ac6316e0367cb397ee947546e17c48',
  // SgSuiTreasury ID for the closed-loop token system
  TREASURY_ID: '0x3fa5854fc02dae8bb936c79630b823587d3b4afea482722daf3810025db00775',
  // Treasury Cap ID for the donation token (SG_USD)
  TREASURY_CAP_ID: '0xb5f25a6e28485ed6b62d3ce39b56ea353b352dcfd51d6316f53ba5a5e599f6fe',
  // Campaign ID for the Clean Water Project
  CAMPAIGN_ID: '', // Will be populated after creating a new campaign
  // sgUSD token configuration
  SGUSD_MANAGER_ID: '0x9955350bfd09bf4658dd7ad3c90c40009b9fc37fe5baf30de1e68ec310e0f60c',
  // SgSuiMinterCap ID for minting SG_SUI tokens
  SGSUI_MINTER_CAP_ID: '0x77be4867935b8d54b905c15a5123dc4e0531a04779cb4890be92e8240f45a6df',
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
