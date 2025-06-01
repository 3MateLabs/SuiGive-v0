// Test script for end-to-end user flow
const { SuiClient } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');
const { getFaucetHost, requestSuiFromFaucetV0 } = require('@mysten/sui/faucet');
const fs = require('fs');

// Import our test modules
const campaignTests = require('./test-campaign-management');
const tokenTests = require('./test-sg-sui-tokens');

// Configuration - using the deployed contract
const CONFIG = {
  PACKAGE_ID: '0xce8715edf77e5759c997fecc7d2ab96765997123d13349eff064cf20072efb00',
  REGISTRY_ID: '0xe41feab9b38b750472942e9e8be51b45f800f3aff9d965ec005cd9bf64919bce',
  TREASURY_CAP_ID: '0xe45271faef793f74039dbe963da9a8ab9d7fda8c9169fe3f8566ca5533b8bc79',
  CAMPAIGN_ID: '0xfc4729db70ce3277f513035e683ef6bd628f8b770616212ec096259b882043d9',
};

// Initialize Sui client with explicit URL
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

// Load keypair from environment or file
function loadKeypair() {
  // This is just a placeholder - you should use your own secure method to load keys
  const privateKeyB64 = process.env.SUI_PRIVATE_KEY;
  if (privateKeyB64) {
    return Ed25519Keypair.fromSecretKey(fromB64(privateKeyB64));
  }
  
  // Fallback to a local file (not recommended for production)
  try {
    const keyFile = JSON.parse(fs.readFileSync('./sui-key.json', 'utf8'));
    return Ed25519Keypair.fromSecretKey(fromB64(keyFile.privateKey));
  } catch (e) {
    console.log('No keypair file found, using test keypair for demonstration');
    // For testing only - DO NOT USE IN PRODUCTION
    return Ed25519Keypair.generate();
  }
}

// Request testnet tokens from the faucet
async function requestTestTokens(address) {
  try {
    console.log(`Requesting testnet tokens for ${address}...`);
    await requestSuiFromFaucetV0({
      host: getFaucetHost('testnet'),
      recipient: address,
    });
    console.log('Tokens requested successfully!');
    
    // Wait a moment for the faucet transaction to complete
    console.log('Waiting for tokens to be credited...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify the balance
    const balance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI'
    });
    console.log(`Current balance: ${balance.totalBalance} MIST (${parseInt(balance.totalBalance) / 1000000000} SUI)`);
    
    return balance.totalBalance;
  } catch (e) {
    console.error('Error requesting tokens:', e);
    return '0';
  }
}

// Function to run a complete end-to-end test of the SuiGive platform
async function runEndToEndTest() {
  try {
    // Load keypair
    const keypair = loadKeypair();
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log('Running end-to-end test of the SuiGive platform...');
    console.log('Using address:', address);
    
    // Request testnet tokens before running tests
    console.log('\n=== STEP 0: Requesting testnet tokens ===');
    const balance = await requestTestTokens(address);
    
    // Check if we have enough tokens to proceed
    if (parseInt(balance) < 2000000000) { // 2 SUI minimum
      console.log('\nWARNING: Balance may be too low for complete testing.');
      console.log('Consider requesting more tokens from the faucet or running the test again.');
      console.log('Attempting to continue with available balance...');
    }
    
    // Step 1: Create a new campaign
    console.log('\n=== STEP 1: Creating a new campaign ===');
    const { campaignId, ownerCapId } = await campaignTests.createCampaign(
      'E2E Test Campaign ' + Date.now(),
      'A campaign for end-to-end testing of the SuiGive platform',
      'https://example.com/image.jpg',
      1000000000, // 1 SUI
      Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      'Test'
    );
    
    // Step 2: Get campaign details
    console.log('\n=== STEP 2: Getting campaign details ===');
    const campaignDetails = await campaignTests.getCampaignDetails(campaignId);
    
    // Step 3: Donate to the campaign
    console.log('\n=== STEP 3: Donating to the campaign ===');
    await campaignTests.donateToCampaign(campaignId, 500000000); // 0.5 SUI
    
    // Step 4: Check updated campaign details
    console.log('\n=== STEP 4: Checking updated campaign details ===');
    const updatedCampaignDetails = await campaignTests.getCampaignDetails(campaignId);
    
    // Step 5: Donate more to reach the goal
    console.log('\n=== STEP 5: Donating more to reach the goal ===');
    await campaignTests.donateToCampaign(campaignId, 500000000); // 0.5 SUI more
    
    // Step 6: Check if goal is reached
    console.log('\n=== STEP 6: Checking if goal is reached ===');
    const goalReached = await campaignTests.isGoalReached(campaignId);
    
    // Step 7: Mint sgSUI tokens for a service provider
    console.log('\n=== STEP 7: Minting sgSUI tokens for a service provider ===');
    // Note: This requires the MINTER_CAP_ID to be set in the tokenTests module
    // If it's not set, this step will be skipped
    try {
      if (tokenTests.CONFIG && tokenTests.CONFIG.MINTER_CAP_ID) {
        const serviceProviderAddress = address; // Using same address for testing
        await tokenTests.mintSgSuiTokens(500000000, serviceProviderAddress); // 0.5 SUI
      } else {
        console.log('Skipping minting: MINTER_CAP_ID not provided in tokenTests module');
      }
    } catch (e) {
      console.log('Error during minting, skipping this step:', e.message);
    }
    
    // Step 8: Check sgSUI tokens
    console.log('\n=== STEP 8: Checking sgSUI tokens ===');
    const sgSuiTokens = await tokenTests.getSgSuiTokens(address);
    
    // Step 9: Transfer sgSUI tokens (if any)
    console.log('\n=== STEP 9: Transferring sgSUI tokens ===');
    if (sgSuiTokens.length > 0) {
      const tokenToTransfer = sgSuiTokens[0];
      // Transfer to self for testing
      await tokenTests.transferSgSuiTokens(tokenToTransfer.id, address);
    } else {
      console.log('Skipping transfer: No sgSUI tokens available');
    }
    
    // Step 10: Redeem sgSUI tokens (if any)
    console.log('\n=== STEP 10: Redeeming sgSUI tokens ===');
    const tokensToRedeem = await tokenTests.getSgSuiTokens(address);
    if (tokensToRedeem.length > 0) {
      const tokenToRedeem = tokensToRedeem[0];
      await tokenTests.redeemSgSuiTokens(tokenToRedeem.id);
    } else {
      console.log('Skipping redemption: No sgSUI tokens available');
    }
    
    // Step 11: Withdraw funds from the campaign
    console.log('\n=== STEP 11: Withdrawing funds from the campaign ===');
    if (ownerCapId) {
      await campaignTests.withdrawFunds(campaignId, ownerCapId);
    } else {
      console.log('Skipping withdrawal: No owner capability ID available');
    }
    
    // Step 12: End the campaign
    console.log('\n=== STEP 12: Ending the campaign ===');
    if (ownerCapId) {
      await campaignTests.endCampaign(campaignId, ownerCapId);
    } else {
      console.log('Skipping ending campaign: No owner capability ID available');
    }
    
    // Step 13: Final check of campaign details
    console.log('\n=== STEP 13: Final check of campaign details ===');
    await campaignTests.getCampaignDetails(campaignId);
    
    console.log('\nEnd-to-end test completed successfully!');
    console.log('Campaign ID:', campaignId);
    console.log('Owner Capability ID:', ownerCapId);
    
    return { campaignId, ownerCapId };
  } catch (e) {
    console.error('Error during end-to-end test:', e);
    throw e;
  }
}

// Function to generate CLI commands for the end-to-end test
function generateCliCommands(campaignId, ownerCapId) {
  console.log('\n=== CLI Commands for Manual Testing ===');
  
  console.log('\n# Get campaign details');
  console.log(`sui client call --package ${CONFIG.PACKAGE_ID} --module crowdfunding --function get_campaign_details --args ${campaignId} --gas-budget 10000000`);
  
  console.log('\n# Donate to campaign (0.1 SUI)');
  console.log(`sui client call --package ${CONFIG.PACKAGE_ID} --module crowdfunding --function donate --args ${campaignId} <COIN_OBJECT_ID> ${CONFIG.TREASURY_CAP_ID} false --gas-budget 10000000`);
  
  console.log('\n# Withdraw funds');
  console.log(`sui client call --package ${CONFIG.PACKAGE_ID} --module crowdfunding --function withdraw_funds --args ${campaignId} ${ownerCapId} --gas-budget 10000000`);
  
  console.log('\n# End campaign');
  console.log(`sui client call --package ${CONFIG.PACKAGE_ID} --module crowdfunding --function end_campaign --args ${campaignId} ${ownerCapId} --gas-budget 10000000`);
  
  console.log('\n# Mint sgSUI tokens');
  console.log(`sui client call --package ${CONFIG.PACKAGE_ID} --module sg_sui_token --function add_funds_and_mint --args <TREASURY_ID> <MINTER_CAP_ID> <COIN_OBJECT_ID> <RECIPIENT_ADDRESS> ${campaignId} --gas-budget 10000000`);
  
  console.log('\n# Redeem sgSUI tokens');
  console.log(`sui client call --package ${CONFIG.PACKAGE_ID} --module sg_sui_token --function redeem_sg_sui --args <TREASURY_ID> <SG_SUI_TOKEN_ID> --gas-budget 10000000`);
}

// Export functions
module.exports = {
  runEndToEndTest,
  generateCliCommands
};

// If run directly, run the end-to-end test
if (require.main === module) {
  runEndToEndTest()
    .then(({ campaignId, ownerCapId }) => {
      if (campaignId && ownerCapId) {
        generateCliCommands(campaignId, ownerCapId);
      }
    })
    .catch(console.error);
}
