const { SuiClient } = require('@mysten/sui/client');
const { TransactionBlock } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');
const fs = require('fs');

// Configuration
const PACKAGE_ID = '0xbd8a4e3dc8496a6b4cd037976688ce3d54bc156ccd93fd02cffa6ae2ad34c90a';
const NETWORK = 'testnet';

// Initialize Sui client
const client = new SuiClient({ network: NETWORK });

// Load keypair from environment or file
// Replace this with your own key loading mechanism
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
    console.error('Failed to load keypair:', e);
    throw new Error('No keypair available');
  }
}

// Find shared objects of a specific type
async function findSharedObjects(type) {
  try {
    const objects = await client.getOwnedObjects({
      owner: 'Immutable',
      filter: { StructType: type },
      options: { showContent: true }
    });
    return objects.data;
  } catch (e) {
    console.error('Error finding shared objects:', e);
    return [];
  }
}

// Find the Registry object
async function findRegistry() {
  const registryType = `${PACKAGE_ID}::crowdfunding::Registry`;
  const objects = await findSharedObjects(registryType);
  if (objects.length > 0) {
    return objects[0].data.objectId;
  }
  throw new Error('Registry not found');
}

// Create a campaign
async function createCampaign(name, description, imageUrl, goalAmount, deadline, category) {
  try {
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Find the Registry
    const registryId = await findRegistry();
    
    // Create transaction block
    const tx = new TransactionBlock();
    
    // Call the create_campaign function
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::create_campaign`,
      arguments: [
        tx.pure(name),
        tx.pure(description),
        tx.pure(imageUrl),
        tx.pure(goalAmount),
        tx.pure(deadline),
        tx.pure(category),
        tx.object(registryId)
      ]
    });
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    console.log('Campaign created:', result);
    return result;
  } catch (e) {
    console.error('Error creating campaign:', e);
    throw e;
  }
}

// Donate to a campaign
async function donate(campaignId, amount, isAnonymous = false) {
  try {
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Find the Treasury Cap for DONATION_TOKEN
    const treasuryCapType = `0x2::coin::TreasuryCap<${PACKAGE_ID}::donation_token::DONATION_TOKEN>`;
    const treasuryCaps = await client.getOwnedObjects({
      owner: senderAddress,
      filter: { StructType: treasuryCapType },
      options: { showContent: true }
    });
    
    if (treasuryCaps.data.length === 0) {
      throw new Error('Treasury Cap not found');
    }
    
    const treasuryCapId = treasuryCaps.data[0].data.objectId;
    
    // Create transaction block
    const tx = new TransactionBlock();
    
    // Create a coin for donation
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    
    // Call the donate function
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        tx.object(campaignId),
        coin,
        tx.object(treasuryCapId),
        tx.pure(isAnonymous)
      ]
    });
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    console.log('Donation made:', result);
    return result;
  } catch (e) {
    console.error('Error donating:', e);
    throw e;
  }
}

// List all campaigns
async function listCampaigns() {
  try {
    const registryId = await findRegistry();
    
    // Get the registry object
    const registry = await client.getObject({
      id: registryId,
      options: { showContent: true }
    });
    
    // Extract campaign IDs from the registry
    const campaignIds = registry.data.content.fields.campaigns;
    
    // Fetch details for each campaign
    const campaigns = [];
    for (const id of campaignIds) {
      const campaign = await client.getObject({
        id,
        options: { showContent: true }
      });
      campaigns.push(campaign.data);
    }
    
    console.log('Campaigns:', campaigns);
    return campaigns;
  } catch (e) {
    console.error('Error listing campaigns:', e);
    throw e;
  }
}

// Export functions
module.exports = {
  createCampaign,
  donate,
  listCampaigns,
  findRegistry
};

// Example usage (uncomment to run)
/*
(async () => {
  try {
    // Create a campaign
    const campaignResult = await createCampaign(
      'Clean Water Project',
      'Providing clean water to communities in need',
      'https://example.com/water.jpg',
      '100000000', // 1 SUI
      '1735689600', // Some future date
      'Humanitarian'
    );
    
    // List all campaigns
    const campaigns = await listCampaigns();
    
    // Donate to the first campaign
    if (campaigns.length > 0) {
      await donate(campaigns[0].objectId, '50000000', false); // 0.5 SUI
    }
  } catch (e) {
    console.error('Error in example:', e);
  }
})();
*/
