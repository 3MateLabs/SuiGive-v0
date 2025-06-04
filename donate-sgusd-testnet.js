// Script to donate sgUSD tokens to a campaign on testnet
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { TransactionBlock } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');
const readline = require('readline');

// Import SUI_CONFIG for testnet
const SUI_CONFIG = {
  PACKAGE_ID: '0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187',
  REGISTRY_ID: '0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b',
  // SG_USD token type for testnet
  SG_USD_TYPE: '0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187::sg_usd::SG_USD',
  // SgUSD Manager ID for minting test tokens
  SGUSD_MANAGER_ID: '0x5eac564bc4a2cece19f126be160a752e859114cbd3cc24b23fc1e7f0879cc9c9',
};

// Campaign ID to donate to
const CAMPAIGN_ID = process.argv[2];

if (!CAMPAIGN_ID) {
  console.error("Please provide a campaign ID as an argument");
  console.error("Usage: node donate-sgusd-testnet.js <campaign-id>");
  process.exit(1);
}

// Initialize Sui client for testnet
const client = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

// Function to format balance with proper decimals (9 decimals for SUI/sgUSD)
function formatBalance(balance, decimals = 9) {
  if (!balance) return '0';
  
  const balanceStr = balance.toString().padStart(decimals + 1, '0');
  const integerPart = balanceStr.slice(0, -decimals) || '0';
  const decimalPart = balanceStr.slice(-decimals);
  return `${integerPart}.${decimalPart}`;
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to fetch sgUSD coins for an address
async function getSgUSDCoins(address) {
  try {
    const coins = await client.getCoins({
      owner: address,
      coinType: SUI_CONFIG.SG_USD_TYPE,
    });
    
    return coins.data.map(coin => ({
      coinObjectId: coin.coinObjectId,
      balance: coin.balance,
      formattedBalance: formatBalance(coin.balance),
    }));
  } catch (error) {
    console.error("Error fetching sgUSD coins:", error);
    return [];
  }
}

// Function to mint sgUSD tokens for testing (testnet only)
async function mintSgUSD(senderKeypair, amount) {
  try {
    console.log(`Minting ${formatBalance(amount)} sgUSD for testing...`);
    
    const tx = new TransactionBlock();
    
    // Call the mint_and_transfer function to mint sgUSD tokens
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::mint_and_transfer`,
      arguments: [
        tx.object(SUI_CONFIG.SGUSD_MANAGER_ID), // sgUSD manager
        tx.pure(amount),                        // amount to mint
        tx.pure(senderKeypair.getPublicKey().toSuiAddress()), // recipient
      ],
    });
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: senderKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    console.log("Minting transaction executed successfully!");
    console.log("Transaction digest:", result.digest);
    console.log("Status:", result.effects.status.status);
    
    // Find the created coin
    const events = result.events || [];
    const coinEvent = events.find(event => 
      event.type.includes('::coin::CoinCreated')
    );
    
    if (coinEvent) {
      console.log("\nCoin Created Event:", JSON.stringify(coinEvent, null, 2));
    }
    
    return result;
  } catch (error) {
    console.error("Error minting sgUSD:", error);
    throw error;
  }
}

// Function to donate sgUSD to a campaign
async function donateSgUSD(senderKeypair, coinObjectId, amount, campaignId) {
  try {
    console.log(`Donating ${formatBalance(amount)} sgUSD to campaign ${campaignId}`);
    
    const tx = new TransactionBlock();
    
    // Split the coin if necessary and get the coin to donate
    const [coin] = tx.splitCoins(tx.object(coinObjectId), [tx.pure(amount)]);
    
    // Call the donate_sgusd function
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate_sgusd`,
      arguments: [
        tx.object(SUI_CONFIG.REGISTRY_ID), // registry
        tx.object(campaignId),             // campaign
        coin,                              // coin
      ],
    });
    
    // Sign and execute the transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: senderKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    console.log("Transaction executed successfully!");
    console.log("Transaction digest:", result.digest);
    console.log("Status:", result.effects.status.status);
    
    // Check for donation event
    const events = result.events || [];
    const donationEvent = events.find(event => 
      event.type.includes('::crowdfunding::DonationEvent')
    );
    
    if (donationEvent) {
      console.log("\nDonation Event:", JSON.stringify(donationEvent, null, 2));
    }
    
    return result;
  } catch (error) {
    console.error("Error donating sgUSD:", error);
    throw error;
  }
}

// Function to monitor campaign before and after donation
async function monitorCampaign(campaignId) {
  try {
    console.log(`Fetching campaign details for ID: ${campaignId}`);
    
    const campaignObj = await client.getObject({
      id: campaignId,
      options: { showContent: true }
    });
    
    if (!campaignObj.data) {
      console.error("Campaign not found or error fetching campaign");
      return null;
    }
    
    const campaignData = campaignObj.data.content;
    if (!campaignData || !campaignData.fields) {
      console.error("Campaign data structure is not as expected");
      return null;
    }
    
    const fields = campaignData.fields;
    
    // Handle different possible structures for the raised balance
    let raisedRaw = '0';
    if (typeof fields.raised === 'string') {
      raisedRaw = fields.raised;
    } else if (typeof fields.raised === 'object') {
      if (fields.raised?.fields?.value) {
        raisedRaw = fields.raised.fields.value;
      } else if (fields.raised?.value) {
        raisedRaw = fields.raised.value;
      }
    }
    
    // Handle different possible structures for sgUSD balance
    let raisedSgUSDRaw = '0';
    if (typeof fields.raised_sgusd === 'string') {
      raisedSgUSDRaw = fields.raised_sgusd;
    } else if (typeof fields.raised_sgusd === 'object') {
      if (fields.raised_sgusd?.fields?.value) {
        raisedSgUSDRaw = fields.raised_sgusd.fields.value;
      } else if (fields.raised_sgusd?.value) {
        raisedSgUSDRaw = fields.raised_sgusd.value;
      }
    }
    
    // Calculate progress percentage
    const goalAmount = BigInt(fields.goal_amount || '0');
    const raisedAmount = BigInt(raisedRaw || '0');
    const progressPercentage = goalAmount > 0 ? 
      Number((raisedAmount * BigInt(100)) / goalAmount) : 0;
    
    console.log(`Name: ${fields.name}`);
    console.log(`Goal Amount: ${formatBalance(fields.goal_amount)} SUI`);
    console.log(`Raised (SUI): ${formatBalance(raisedRaw)} SUI`);
    console.log(`Raised (sgUSD): ${formatBalance(raisedSgUSDRaw)} sgUSD`);
    console.log(`Progress: ${progressPercentage.toFixed(2)}%`);
    console.log(`Backer Count: ${fields.backer_count}`);
    console.log(`Version: ${campaignObj.data.version}`);
    
    return {
      name: fields.name,
      goalAmount: fields.goal_amount,
      raisedSUI: raisedRaw,
      raisedSgUSD: raisedSgUSDRaw,
      backerCount: fields.backer_count,
      version: campaignObj.data.version
    };
  } catch (error) {
    console.error("Error monitoring campaign:", error);
    return null;
  }
}

// Main function to execute the donation
async function main() {
  try {
    // First, fetch campaign details to show current state
    console.log(`\n=== CAMPAIGN BEFORE DONATION ===`);
    const campaignBefore = await monitorCampaign(CAMPAIGN_ID);
    
    if (!campaignBefore) {
      process.exit(1);
    }
    
    // Get private key from user
    const privateKeyBase64 = await prompt("\nEnter your private key (base64 encoded): ");
    
    // Create keypair from private key
    const privateKeyBytes = fromB64(privateKeyBase64);
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`\nUsing address: ${address}`);
    
    // Ask if user wants to mint sgUSD for testing
    const shouldMint = await prompt("Do you want to mint sgUSD tokens for testing? (y/n): ");
    
    if (shouldMint.toLowerCase() === 'y') {
      // Get amount to mint
      const mintAmount = parseFloat(await prompt("Enter amount of sgUSD to mint: "));
      if (isNaN(mintAmount) || mintAmount <= 0) {
        console.error("Invalid mint amount");
        process.exit(1);
      }
      
      // Convert to smallest units (9 decimals)
      const mintInUnits = Math.floor(mintAmount * 1_000_000_000).toString();
      
      // Mint sgUSD
      await mintSgUSD(keypair, mintInUnits);
      
      // Wait a bit for the transaction to be processed
      console.log("\nWaiting for minting transaction to be processed...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Fetch sgUSD coins for the address
    const sgUSDCoins = await getSgUSDCoins(address);
    
    if (sgUSDCoins.length === 0) {
      console.error("No sgUSD coins found for this address");
      process.exit(1);
    }
    
    console.log("\nAvailable sgUSD coins:");
    sgUSDCoins.forEach((coin, index) => {
      console.log(`[${index}] ID: ${coin.coinObjectId}, Balance: ${coin.formattedBalance} sgUSD`);
    });
    
    // Get coin selection from user
    const coinIndex = parseInt(await prompt("Select a coin to use (enter index number): "));
    if (isNaN(coinIndex) || coinIndex < 0 || coinIndex >= sgUSDCoins.length) {
      console.error("Invalid coin selection");
      process.exit(1);
    }
    
    const selectedCoin = sgUSDCoins[coinIndex];
    
    // Get donation amount from user
    const donationAmount = parseFloat(await prompt("Enter donation amount in sgUSD: "));
    if (isNaN(donationAmount) || donationAmount <= 0) {
      console.error("Invalid donation amount");
      process.exit(1);
    }
    
    // Convert to smallest units (9 decimals)
    const donationInUnits = Math.floor(donationAmount * 1_000_000_000).toString();
    
    // Check if selected coin has enough balance
    if (BigInt(selectedCoin.balance) < BigInt(donationInUnits)) {
      console.error(`Not enough balance in selected coin. Available: ${selectedCoin.formattedBalance} sgUSD`);
      process.exit(1);
    }
    
    // Donate sgUSD
    await donateSgUSD(keypair, selectedCoin.coinObjectId, donationInUnits, CAMPAIGN_ID);
    
    // Wait a bit for the transaction to be processed
    console.log("\nWaiting for donation transaction to be processed...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fetch campaign details again to show updated state
    console.log(`\n=== CAMPAIGN AFTER DONATION ===`);
    const campaignAfter = await monitorCampaign(CAMPAIGN_ID);
    
    if (campaignAfter) {
      // Compare before and after
      console.log(`\n=== CHANGES DETECTED ===`);
      
      // Version change
      console.log(`Version: ${campaignBefore.version} -> ${campaignAfter.version}`);
      
      // SUI balance change
      if (campaignBefore.raisedSUI !== campaignAfter.raisedSUI) {
        console.log(`Raised (SUI): ${formatBalance(campaignBefore.raisedSUI)} -> ${formatBalance(campaignAfter.raisedSUI)} SUI`);
      } else {
        console.log(`Raised (SUI): ${formatBalance(campaignAfter.raisedSUI)} SUI (unchanged)`);
      }
      
      // sgUSD balance change
      if (campaignBefore.raisedSgUSD !== campaignAfter.raisedSgUSD) {
        console.log(`Raised (sgUSD): ${formatBalance(campaignBefore.raisedSgUSD)} -> ${formatBalance(campaignAfter.raisedSgUSD)} sgUSD`);
        
        // Calculate the difference
        const beforeAmount = BigInt(campaignBefore.raisedSgUSD || '0');
        const afterAmount = BigInt(campaignAfter.raisedSgUSD || '0');
        const difference = afterAmount - beforeAmount;
        
        console.log(`sgUSD Increase: ${formatBalance(difference.toString())} sgUSD`);
      } else {
        console.log(`Raised (sgUSD): ${formatBalance(campaignAfter.raisedSgUSD)} sgUSD (unchanged)`);
      }
      
      // Backer count change
      if (campaignBefore.backerCount !== campaignAfter.backerCount) {
        console.log(`Backer Count: ${campaignBefore.backerCount} -> ${campaignAfter.backerCount}`);
      } else {
        console.log(`Backer Count: ${campaignAfter.backerCount} (unchanged)`);
      }
    }
    
    console.log("\nDonation test completed!");
    
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
