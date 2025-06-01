// Import the correct modules from the latest Sui SDK
const { SuiClient } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { bcs } = require('@mysten/sui/bcs');

// Configuration
const PACKAGE_ID = '0xce8715edf77e5759c997fecc7d2ab96765997123d13349eff064cf20072efb00';
const REGISTRY_ID = '0xe41feab9b38b750472942e9e8be51b45f800f3aff9d965ec005cd9bf64919bce';

// Initialize Sui client with explicit URL
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

// Generate a test keypair
const keypair = Ed25519Keypair.generate();
const address = keypair.getPublicKey().toSuiAddress();

// Function to query the Registry object
async function queryRegistry() {
  try {
    console.log('Querying Registry object...');
    
    const registryObject = await client.getObject({
      id: REGISTRY_ID,
      options: {
        showContent: true,
        showOwner: true
      }
    });
    
    console.log('Registry Object:', JSON.stringify(registryObject, null, 2));
    return registryObject;
  } catch (e) {
    console.error('Error querying Registry:', e);
    throw e;
  }
}

// Function to list campaigns
async function listCampaigns() {
  try {
    console.log('Listing campaigns...');
    
    // Query dynamic fields of the Registry object
    const dynamicFields = await client.getDynamicFields({
      parentId: REGISTRY_ID
    });
    
    console.log('Dynamic Fields:', JSON.stringify(dynamicFields, null, 2));
    
    // For each dynamic field, get the campaign object
    const campaigns = [];
    for (const field of dynamicFields.data) {
      const campaignObject = await client.getObject({
        id: field.objectId,
        options: {
          showContent: true,
          showOwner: true
        }
      });
      
      campaigns.push(campaignObject);
    }
    
    console.log('Campaigns:', JSON.stringify(campaigns, null, 2));
    return campaigns;
  } catch (e) {
    console.error('Error listing campaigns:', e);
    throw e;
  }
}

// Function to create a simple transaction to test SDK
async function createTestTransaction() {
  try {
    console.log('Creating test transaction...');
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Split a coin for demonstration
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(1000000)]);
    
    // Transfer the coin back to the same address (just for testing)
    tx.transferObjects([coin], tx.pure.address(address));
    
    // Set the sender
    tx.setSender(address);
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    console.log('Transaction bytes:', txBytes.toString('base64'));
    
    return txBytes;
  } catch (e) {
    console.error('Error creating test transaction:', e);
    throw e;
  }
}

// Run the tests
async function runTests() {
  try {
    // Test Registry query
    await queryRegistry();
    
    // Test campaign listing
    await listCampaigns();
    
    // Test transaction building
    await createTestTransaction();
    
    console.log('All tests completed successfully!');
  } catch (e) {
    console.error('Test failed:', e);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  queryRegistry,
  listCampaigns,
  createTestTransaction,
  runTests
};
