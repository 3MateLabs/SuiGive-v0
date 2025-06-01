// Generate CLI commands for testing SuiGive contract
const { SuiClient } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');

// Configuration - using the deployed contract
const CONFIG = {
  PACKAGE_ID: '0xce8715edf77e5759c997fecc7d2ab96765997123d13349eff064cf20072efb00',
  REGISTRY_ID: '0xe41feab9b38b750472942e9e8be51b45f800f3aff9d965ec005cd9bf64919bce',
  TREASURY_CAP_ID: '0xe45271faef793f74039dbe963da9a8ab9d7fda8c9169fe3f8566ca5533b8bc79',
  CAMPAIGN_ID: '0xfc4729db70ce3277f513035e683ef6bd628f8b770616212ec096259b882043d9',
};

// Initialize Sui client
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

// Function to generate CLI commands for testing the SuiGive contract
async function generateTestCommands() {
  console.log('=== SuiGive Contract Test Commands ===');
  console.log('Run these commands with the Sui CLI to test the contract functionality.\n');
  
  // 1. Create a new campaign
  console.log('1. Create a new campaign:');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function create_campaign \\
  --args "Test Campaign" "A test campaign description" "https://example.com/image.jpg" 1000000000 $(date -v+1d +%s) "Test" ${CONFIG.REGISTRY_ID} \\
  --gas-budget 10000000
  `);
  
  // 2. Get campaign details
  console.log('\n2. Get campaign details (replace CAMPAIGN_ID with the ID from step 1):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function get_campaign_details \\
  --args CAMPAIGN_ID \\
  --gas-budget 10000000
  `);
  
  // 3. Donate to campaign
  console.log('\n3. Donate to campaign (replace CAMPAIGN_ID with the ID from step 1, and COIN_OBJECT_ID with a SUI coin object ID):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function donate \\
  --args CAMPAIGN_ID COIN_OBJECT_ID ${CONFIG.TREASURY_CAP_ID} false \\
  --gas-budget 10000000
  `);
  
  // 4. Check if campaign goal is reached
  console.log('\n4. Check if campaign goal is reached (replace CAMPAIGN_ID with the ID from step 1):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function is_goal_reached \\
  --args CAMPAIGN_ID \\
  --gas-budget 10000000
  `);
  
  // 5. Withdraw funds from campaign
  console.log('\n5. Withdraw funds from campaign (replace CAMPAIGN_ID and OWNER_CAP_ID):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function withdraw_funds \\
  --args CAMPAIGN_ID OWNER_CAP_ID \\
  --gas-budget 10000000
  `);
  
  // 6. End campaign
  console.log('\n6. End campaign (replace CAMPAIGN_ID and OWNER_CAP_ID):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function end_campaign \\
  --args CAMPAIGN_ID OWNER_CAP_ID \\
  --gas-budget 10000000
  `);
  
  // 7. Mint sgSUI tokens
  console.log('\n7. Mint sgSUI tokens (replace TREASURY_ID, MINTER_CAP_ID, COIN_OBJECT_ID, and RECIPIENT_ADDRESS):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module sg_sui_token \\
  --function add_funds_and_mint \\
  --args TREASURY_ID MINTER_CAP_ID COIN_OBJECT_ID RECIPIENT_ADDRESS ${CONFIG.CAMPAIGN_ID} \\
  --gas-budget 10000000
  `);
  
  // 8. Redeem sgSUI tokens
  console.log('\n8. Redeem sgSUI tokens (replace TREASURY_ID and SG_SUI_TOKEN_ID):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module sg_sui_token \\
  --function redeem_sg_sui \\
  --args TREASURY_ID SG_SUI_TOKEN_ID \\
  --gas-budget 10000000
  `);
  
  // 9. Transfer sgSUI tokens
  console.log('\n9. Transfer sgSUI tokens (replace SG_SUI_TOKEN_ID and RECIPIENT_ADDRESS):');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module sg_sui_token \\
  --function transfer_sg_sui \\
  --args SG_SUI_TOKEN_ID RECIPIENT_ADDRESS \\
  --gas-budget 10000000
  `);
  
  // 10. Get your SUI coins
  console.log('\n10. Get your SUI coins (to find a COIN_OBJECT_ID for donations):');
  console.log(`sui client gas
  `);
  
  // 11. Existing campaign details
  console.log('\n11. Get details for the existing campaign:');
  console.log(`sui client call \\
  --package ${CONFIG.PACKAGE_ID} \\
  --module crowdfunding \\
  --function get_campaign_details \\
  --args ${CONFIG.CAMPAIGN_ID} \\
  --gas-budget 10000000
  `);
  
  console.log('\n=== Test Sequence ===');
  console.log('For a complete test, run the commands in the following order:');
  console.log('1. Create a campaign');
  console.log('2. Get campaign details to verify creation');
  console.log('3. Donate to the campaign');
  console.log('4. Check if campaign goal is reached');
  console.log('5. Withdraw funds (if you own the campaign)');
  console.log('6. End campaign (if you own the campaign)');
  console.log('7. Mint sgSUI tokens (if you have the minter capability)');
  console.log('8. Redeem sgSUI tokens (if you have sgSUI tokens)');
}

// Run the function
generateTestCommands().catch(console.error);
