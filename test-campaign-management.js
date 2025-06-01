// Test script for campaign management and edge cases
const { SuiClient } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');
const { getFaucetHost, requestSuiFromFaucetV0 } = require('@mysten/sui/faucet');
const fs = require('fs');

// Configuration - using the deployed contract
const CONFIG = {
  PACKAGE_ID: '0xce8715edf77e5759c997fecc7d2ab96765997123d13349eff064cf20072efb00',
  REGISTRY_ID: '0xe41feab9b38b750472942e9e8be51b45f800f3aff9d965ec005cd9bf64919bce',
  TREASURY_CAP_ID: '0xe45271faef793f74039dbe963da9a8ab9d7fda8c9169fe3f8566ca5533b8bc79',
  CAMPAIGN_ID: '0xfc4729db70ce3277f513035e683ef6bd628f8b770616212ec096259b882043d9',
  // You'll need to provide these values from your wallet
  OWNER_CAP_ID: '', // The campaign owner capability ID
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

// Function to create a new campaign
async function createCampaign(name, description, imageUrl, goalAmount, deadline, category) {
  try {
    console.log(`Creating campaign "${name}"...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Call the create_campaign function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::crowdfunding::create_campaign`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.u64(goalAmount),
        tx.pure.u64(deadline),
        tx.pure.string(category),
        tx.object(CONFIG.REGISTRY_ID)
      ]
    });
    
    // Set the sender
    tx.setSender(senderAddress);
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    console.log('Campaign created successfully!');
    console.log('Transaction digest:', result.digest);
    
    // Extract the campaign ID and owner capability ID from the events
    const campaignId = extractCampaignIdFromEvents(result.events);
    const ownerCapId = extractOwnerCapIdFromEvents(result.events);
    
    console.log('Campaign ID:', campaignId);
    console.log('Owner Capability ID:', ownerCapId);
    
    return { campaignId, ownerCapId, result };
  } catch (e) {
    console.error('Error creating campaign:', e);
    throw e;
  }
}

// Function to extract campaign ID from events
function extractCampaignIdFromEvents(events) {
  if (!events) return null;
  
  const campaignCreatedEvent = events.find(event => 
    event.type === `${CONFIG.PACKAGE_ID}::crowdfunding::CampaignCreated`
  );
  
  if (campaignCreatedEvent && campaignCreatedEvent.parsedJson) {
    return campaignCreatedEvent.parsedJson.campaign_id;
  }
  
  return null;
}

// Function to extract owner capability ID from events
function extractOwnerCapIdFromEvents(events) {
  if (!events) return null;
  
  const capabilityCreatedEvent = events.find(event => 
    event.type === `${CONFIG.PACKAGE_ID}::crowdfunding::OwnerCapabilityCreated`
  );
  
  if (capabilityCreatedEvent && capabilityCreatedEvent.parsedJson) {
    return capabilityCreatedEvent.parsedJson.capability_id;
  }
  
  return null;
}

// Function to donate to a campaign
async function donateToCampaign(campaignId, amount) {
  try {
    console.log(`Donating ${amount} to campaign ${campaignId}...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Split a coin for donation
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    // Call the donate function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        tx.object(campaignId),
        coin,
        tx.object(CONFIG.TREASURY_CAP_ID),
        tx.pure.bool(false) // not anonymous
      ]
    });
    
    // Set the sender
    tx.setSender(senderAddress);
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    console.log('Donation successful!');
    console.log('Transaction digest:', result.digest);
    
    return result;
  } catch (e) {
    console.error('Error donating to campaign:', e);
    throw e;
  }
}

// Function to withdraw funds from a campaign
async function withdrawFunds(campaignId, ownerCapId) {
  try {
    console.log(`Withdrawing funds from campaign ${campaignId}...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Call the withdraw_funds function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::crowdfunding::withdraw_funds`,
      arguments: [
        tx.object(campaignId),
        tx.object(ownerCapId)
      ]
    });
    
    // Set the sender
    tx.setSender(senderAddress);
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    console.log('Funds withdrawn successfully!');
    console.log('Transaction digest:', result.digest);
    
    return result;
  } catch (e) {
    console.error('Error withdrawing funds:', e);
    throw e;
  }
}

// Function to end a campaign
async function endCampaign(campaignId, ownerCapId) {
  try {
    console.log(`Ending campaign ${campaignId}...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Call the end_campaign function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::crowdfunding::end_campaign`,
      arguments: [
        tx.object(campaignId),
        tx.object(ownerCapId)
      ]
    });
    
    // Set the sender
    tx.setSender(senderAddress);
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    console.log('Campaign ended successfully!');
    console.log('Transaction digest:', result.digest);
    
    return result;
  } catch (e) {
    console.error('Error ending campaign:', e);
    throw e;
  }
}

// Function to get campaign details
async function getCampaignDetails(campaignId) {
  try {
    console.log(`Getting details for campaign ${campaignId}...`);
    
    const campaign = await client.getObject({
      id: campaignId,
      options: { showContent: true, showOwner: true }
    });
    
    if (!campaign.data || !campaign.data.content) {
      console.log('Campaign not found or has no content');
      return null;
    }
    
    const campaignData = campaign.data.content;
    
    if (!('fields' in campaignData)) {
      console.log('Campaign data does not have expected structure');
      return null;
    }
    
    const fields = campaignData.fields;
    
    const campaignDetails = {
      id: campaignId,
      name: fields.name,
      description: fields.description,
      imageUrl: fields.image_url,
      goalAmount: fields.goal_amount,
      currentAmount: fields.current_amount,
      deadline: fields.deadline,
      isActive: fields.is_active,
      creator: fields.creator,
      category: fields.category,
      createdAt: fields.created_at
    };
    
    console.log('Campaign details:', campaignDetails);
    
    return campaignDetails;
  } catch (e) {
    console.error('Error getting campaign details:', e);
    throw e;
  }
}

// Function to check if a campaign has reached its goal
async function isGoalReached(campaignId) {
  try {
    const campaign = await getCampaignDetails(campaignId);
    
    if (!campaign) {
      return false;
    }
    
    const currentAmount = BigInt(campaign.currentAmount);
    const goalAmount = BigInt(campaign.goalAmount);
    
    const reached = currentAmount >= goalAmount;
    
    console.log(`Campaign goal reached: ${reached}`);
    console.log(`Current amount: ${currentAmount}, Goal amount: ${goalAmount}`);
    
    return reached;
  } catch (e) {
    console.error('Error checking if goal reached:', e);
    return false;
  }
}

// Function to run a comprehensive test of campaign management
async function runComprehensiveTest() {
  try {
    console.log('Running comprehensive campaign management test...');
    
    // Load keypair
    const keypair = loadKeypair();
    const address = keypair.getPublicKey().toSuiAddress();
    
    // Request testnet tokens before running tests
    console.log('\n--- Step 0: Requesting testnet tokens ---');
    const balance = await requestTestTokens(address);
    
    // Check if we have enough tokens to proceed
    if (parseInt(balance) < 2000000000) { // 2 SUI minimum
      console.log('\nWARNING: Balance may be too low for complete testing.');
      console.log('Consider requesting more tokens from the faucet or running the test again.');
      console.log('Attempting to continue with available balance...');
    }
    
    // 1. Create a new campaign
    console.log('\n--- Step 1: Creating a new campaign ---');
    const { campaignId, ownerCapId } = await createCampaign(
      'Test Campaign ' + Date.now(),
      'A campaign for testing the SuiGive platform',
      'https://example.com/image.jpg',
      1000000000, // 1 SUI
      Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      'Test'
    );
    // 2. Get campaign details
    console.log('\n--- Step 2: Getting campaign details ---');
    const campaignDetails = await getCampaignDetails(campaignId);
    
    // 3. Donate to the campaign
    console.log('\n--- Step 3: Donating to the campaign ---');
    await donateToCampaign(campaignId, 100000000); // 0.1 SUI
    
    // 4. Check if goal is reached
    console.log('\n--- Step 4: Checking if goal is reached ---');
    await isGoalReached(campaignId);
    
    // 5. Donate more to reach the goal
    console.log('\n--- Step 5: Donating more to reach the goal ---');
    await donateToCampaign(campaignId, 900000000); // 0.9 SUI
    
    // 6. Check if goal is reached now
    console.log('\n--- Step 6: Checking if goal is reached now ---');
    await isGoalReached(campaignId);
    
    // 7. Withdraw funds
    console.log('\n--- Step 7: Withdrawing funds ---');
    if (ownerCapId) {
      await withdrawFunds(campaignId, ownerCapId);
    } else {
      console.log('Skipping withdrawal: No owner capability ID available');
    }
    
    // 8. End the campaign
    console.log('\n--- Step 8: Ending the campaign ---');
    if (ownerCapId) {
      await endCampaign(campaignId, ownerCapId);
    } else {
      console.log('Skipping ending campaign: No owner capability ID available');
    }
    
    // 9. Final check of campaign details
    console.log('\n--- Step 9: Final check of campaign details ---');
    await getCampaignDetails(campaignId);
    
    console.log('\nComprehensive test completed successfully!');
  } catch (e) {
    console.error('Error during comprehensive test:', e);
  }
}

// Function to test edge cases
async function testEdgeCases() {
  try {
    console.log('Testing edge cases...');
    
    // 1. Test donating to a non-existent campaign
    console.log('\n--- Edge Case 1: Donating to a non-existent campaign ---');
    try {
      await donateToCampaign('0x1234567890123456789012345678901234567890', 100000000);
    } catch (e) {
      console.log('Expected error occurred:', e.message);
    }
    
    // 2. Test withdrawing from a campaign without owner capability
    console.log('\n--- Edge Case 2: Withdrawing without owner capability ---');
    try {
      await withdrawFunds(CONFIG.CAMPAIGN_ID, '0x1234567890123456789012345678901234567890');
    } catch (e) {
      console.log('Expected error occurred:', e.message);
    }
    
    // 3. Test creating a campaign with past deadline
    console.log('\n--- Edge Case 3: Creating a campaign with past deadline ---');
    try {
      await createCampaign(
        'Past Deadline Campaign',
        'A campaign with a deadline in the past',
        'https://example.com/image.jpg',
        1000000000, // 1 SUI
        Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        'Test'
      );
    } catch (e) {
      console.log('Expected error occurred:', e.message);
    }
    
    // 4. Test donating to an ended campaign
    console.log('\n--- Edge Case 4: Donating to an ended campaign ---');
    // First, create a campaign
    const { campaignId, ownerCapId } = await createCampaign(
      'Ending Campaign Test',
      'A campaign that will be ended',
      'https://example.com/image.jpg',
      1000000000, // 1 SUI
      Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      'Test'
    );
    
    // End the campaign
    if (ownerCapId) {
      await endCampaign(campaignId, ownerCapId);
      
      // Try to donate to the ended campaign
      try {
        await donateToCampaign(campaignId, 100000000);
      } catch (e) {
        console.log('Expected error occurred:', e.message);
      }
    } else {
      console.log('Skipping test: No owner capability ID available');
    }
    
    console.log('\nEdge case testing completed!');
  } catch (e) {
    console.error('Error during edge case testing:', e);
  }
}

// Export functions
module.exports = {
  createCampaign,
  donateToCampaign,
  withdrawFunds,
  endCampaign,
  getCampaignDetails,
  isGoalReached,
  requestTestTokens,
  runComprehensiveTest,
  testEdgeCases
};

// If run directly, run the comprehensive test
if (require.main === module) {
  // Uncomment the test you want to run
  runComprehensiveTest().catch(console.error);
  // testEdgeCases().catch(console.error);
}
