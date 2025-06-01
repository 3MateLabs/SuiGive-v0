// Import the correct modules from the latest Sui SDK
const { SuiClient } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');
const { bcs } = require('@mysten/sui/bcs');
const fs = require('fs');

// Configuration - using the newly deployed contract
const PACKAGE_ID = '0xce8715edf77e5759c997fecc7d2ab96765997123d13349eff064cf20072efb00';
const CAMPAIGN_ID = '0xfc4729db70ce3277f513035e683ef6bd628f8b770616212ec096259b882043d9';
const TREASURY_CAP_ID = '0xe45271faef793f74039dbe963da9a8ab9d7fda8c9169fe3f8566ca5533b8bc79';
const DONATION_AMOUNT = 50000000; // 0.05 SUI

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
    // This is just for testing transaction building
    return Ed25519Keypair.generate();
  }
}

// Function to create a donation transaction
async function createDonationTransaction() {
  try {
    console.log('Creating donation transaction...');
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Split a coin for donation
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(DONATION_AMOUNT)]);
    
    // Call the donate function
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        tx.object(CAMPAIGN_ID),
        coin,
        tx.object(TREASURY_CAP_ID),
        tx.pure.bool(false) // not anonymous
      ]
    });
    
    console.log('Transaction created successfully!');
    return tx;
  } catch (e) {
    console.error('Error creating donation transaction:', e);
    throw e;
  }
}

// Function to execute the donation transaction
async function executeDonation() {
  try {
    // Load keypair
    const keypair = loadKeypair();
    
    // Create the transaction
    const tx = await createDonationTransaction();
    
    // Set the sender
    tx.setSender(keypair.getPublicKey().toSuiAddress());
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    console.log('Transaction bytes:', txBytes.toString('base64'));
    
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
    console.log('Transaction effects:', JSON.stringify(result.effects, null, 2));
    
    return result;
  } catch (e) {
    console.error('Error executing donation:', e);
    throw e;
  }
}

// Function to create a campaign
async function createCampaign(name, description, imageUrl, goalAmount, deadline, category) {
  try {
    // Load keypair
    const keypair = loadKeypair();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Call the create_campaign function
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::create_campaign`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.u64(goalAmount),
        tx.pure.u64(deadline),
        tx.pure.string(category),
        tx.object('0xe41feab9b38b750472942e9e8be51b45f800f3aff9d965ec005cd9bf64919bce') // Registry ID
      ]
    });
    
    // Set the sender
    tx.setSender(keypair.getPublicKey().toSuiAddress());
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Campaign transaction built successfully!');
    
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
    
    return result;
  } catch (e) {
    console.error('Error creating campaign:', e);
    throw e;
  }
}

// Function to generate transaction bytes for CLI execution
async function generateTransactionBytes() {
  try {
    // Load keypair to get the sender address
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create the transaction
    const tx = await createDonationTransaction();
    
    // Set the sender
    tx.setSender(senderAddress);
    
    // Build the transaction
    const txBytes = await tx.build({ client });
    
    console.log('Transaction built successfully!');
    console.log('To execute this transaction using the Sui CLI, run:');
    console.log(`sui client execute-transaction-block --tx-bytes ${txBytes.toString('base64')} --gas-budget 10000000`);
    
    return txBytes.toString('base64');
  } catch (e) {
    console.error('Error generating transaction bytes:', e);
    throw e;
  }
}

// Export functions
module.exports = {
  createDonationTransaction,
  executeDonation,
  createCampaign,
  generateTransactionBytes
};

// If run directly, generate transaction bytes
if (require.main === module) {
  generateTransactionBytes().catch(console.error);
}
