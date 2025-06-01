// Test script for sgSUI token minting and redemption
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
  MINTER_CAP_ID: '', // The SgSuiMinterCap object ID
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

// Function to mint sgSUI tokens from campaign funds
async function mintSgSuiTokens(amount, recipientAddress) {
  try {
    console.log(`Minting ${amount} sgSUI tokens for ${recipientAddress}...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Split some SUI for the minting
    const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    // Call the add_funds_and_mint function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::sg_sui_token::add_funds_and_mint`,
      arguments: [
        tx.object(CONFIG.TREASURY_CAP_ID), // Treasury
        tx.object(CONFIG.MINTER_CAP_ID),   // Minter capability
        suiCoin,                           // SUI funds
        tx.pure.address(recipientAddress), // Recipient
        tx.pure.address(CONFIG.CAMPAIGN_ID) // Campaign ID
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
    
    console.log('sgSUI tokens minted successfully!');
    console.log('Transaction digest:', result.digest);
    
    return result;
  } catch (e) {
    console.error('Error minting sgSUI tokens:', e);
    throw e;
  }
}

// Function to redeem sgSUI tokens for SUI
async function redeemSgSuiTokens(sgSuiTokenId) {
  try {
    console.log(`Redeeming sgSUI token ${sgSuiTokenId} for SUI...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Call the redeem_sg_sui function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::sg_sui_token::redeem_sg_sui`,
      arguments: [
        tx.object(CONFIG.TREASURY_CAP_ID), // Treasury
        tx.object(sgSuiTokenId)            // sgSUI token to redeem
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
    
    console.log('sgSUI tokens redeemed successfully!');
    console.log('Transaction digest:', result.digest);
    
    return result;
  } catch (e) {
    console.error('Error redeeming sgSUI tokens:', e);
    throw e;
  }
}

// Function to transfer sgSUI tokens to another address
async function transferSgSuiTokens(sgSuiTokenId, recipientAddress) {
  try {
    console.log(`Transferring sgSUI token ${sgSuiTokenId} to ${recipientAddress}...`);
    
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Call the transfer_sg_sui function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::sg_sui_token::transfer_sg_sui`,
      arguments: [
        tx.object(sgSuiTokenId),           // sgSUI token to transfer
        tx.pure.address(recipientAddress)  // Recipient
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
    
    console.log('sgSUI tokens transferred successfully!');
    console.log('Transaction digest:', result.digest);
    
    return result;
  } catch (e) {
    console.error('Error transferring sgSUI tokens:', e);
    throw e;
  }
}

// Function to get all sgSUI tokens owned by an address
async function getSgSuiTokens(ownerAddress) {
  try {
    console.log(`Getting sgSUI tokens for ${ownerAddress}...`);
    
    // Query for sgSUI tokens owned by the address
    const response = await client.getOwnedObjects({
      owner: ownerAddress,
      filter: {
        StructType: `${CONFIG.PACKAGE_ID}::sg_sui_token::SG_SUI`
      },
      options: {
        showContent: true,
        showType: true,
      }
    });
    
    const tokens = [];
    
    for (const obj of response.data) {
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields;
        tokens.push({
          id: obj.data.objectId,
          campaignId: fields.campaign_id || '',
          amount: BigInt(fields.value || 0),
          owner: ownerAddress,
        });
      }
    }
    
    console.log(`Found ${tokens.length} sgSUI tokens:`);
    console.log(tokens);
    
    return tokens;
  } catch (e) {
    console.error('Error getting sgSUI tokens:', e);
    throw e;
  }
}

// Function to run a comprehensive test of sgSUI token functionality
async function runComprehensiveTest() {
  try {
    // Load keypair
    const keypair = loadKeypair();
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log('Running comprehensive sgSUI token test...');
    console.log('Using address:', address);
    
    // Request testnet tokens before running tests
    console.log('\n--- Step 0: Requesting testnet tokens ---');
    const balance = await requestTestTokens(address);
    
    // Check if we have enough tokens to proceed
    if (parseInt(balance) < 2000000000) { // 2 SUI minimum
      console.log('\nWARNING: Balance may be too low for complete testing.');
      console.log('Consider requesting more tokens from the faucet or running the test again.');
      console.log('Attempting to continue with available balance...');
    }
    
    // 1. Check existing sgSUI tokens
    console.log('\n--- Step 1: Checking existing sgSUI tokens ---');
    const existingTokens = await getSgSuiTokens(address);
    
    // 2. Mint new sgSUI tokens
    console.log('\n--- Step 2: Minting new sgSUI tokens ---');
    if (!CONFIG.MINTER_CAP_ID) {
      console.log('Skipping minting test: MINTER_CAP_ID not provided');
    } else {
      const mintAmount = 100000000; // 0.1 SUI
      await mintSgSuiTokens(mintAmount, address);
    }
    
    // 3. Check updated sgSUI tokens
    console.log('\n--- Step 3: Checking updated sgSUI tokens ---');
    const updatedTokens = await getSgSuiTokens(address);
    
    // 4. Transfer sgSUI tokens if we have any
    console.log('\n--- Step 4: Transferring sgSUI tokens ---');
    if (updatedTokens.length > 0) {
      const tokenToTransfer = updatedTokens[0];
      // Transfer to self for testing
      await transferSgSuiTokens(tokenToTransfer.id, address);
    } else {
      console.log('Skipping transfer test: No sgSUI tokens available');
    }
    
    // 5. Redeem sgSUI tokens if we have any
    console.log('\n--- Step 5: Redeeming sgSUI tokens ---');
    const tokensToRedeem = await getSgSuiTokens(address);
    if (tokensToRedeem.length > 0) {
      const tokenToRedeem = tokensToRedeem[0];
      await redeemSgSuiTokens(tokenToRedeem.id);
    } else {
      console.log('Skipping redemption test: No sgSUI tokens available');
    }
    
    // 6. Final check of sgSUI tokens
    console.log('\n--- Step 6: Final check of sgSUI tokens ---');
    const finalTokens = await getSgSuiTokens(address);
    
    console.log('\nComprehensive test completed successfully!');
  } catch (e) {
    console.error('Error during comprehensive test:', e);
  }
}

// Function to generate transaction bytes for CLI execution
async function generateMintTransactionBytes(amount, recipientAddress) {
  try {
    // Load keypair
    const keypair = loadKeypair();
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Split some SUI for the minting
    const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    // Call the add_funds_and_mint function
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::sg_sui_token::add_funds_and_mint`,
      arguments: [
        tx.object(CONFIG.TREASURY_CAP_ID), // Treasury
        tx.object(CONFIG.MINTER_CAP_ID),   // Minter capability
        suiCoin,                           // SUI funds
        tx.pure.address(recipientAddress), // Recipient
        tx.pure.address(CONFIG.CAMPAIGN_ID) // Campaign ID
      ]
    });
    
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
  mintSgSuiTokens,
  redeemSgSuiTokens,
  transferSgSuiTokens,
  getSgSuiTokens,
  requestTestTokens,
  runComprehensiveTest,
  generateMintTransactionBytes
};

// If run directly, run the comprehensive test
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}
