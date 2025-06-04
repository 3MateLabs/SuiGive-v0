// Script to donate sgUSD tokens to a campaign
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { TransactionBlock } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');
const readline = require('readline');

// Import SUI_CONFIG directly
const SUI_CONFIG = {
  PACKAGE_ID: '0x9b1398e542c72df0448054e98d59406468edb3379e2f35e12829e903a13fec51',
  REGISTRY_ID: '0xbea7df830dca9675ea4cd4aa8c243bef7f91dc048921e77ac074f8416788333e',
  // SG_USD token type - this is the token type for sgUSD
  SG_USD_TYPE: '0x1e8b532cca6569cab9f9b9ebc73f8c13885012ade714729aa3b450e0339ac766::sg_usd::SG_USD',
};

// Campaign ID to donate to
const CAMPAIGN_ID = process.argv[2];

if (!CAMPAIGN_ID) {
  console.error("Please provide a campaign ID as an argument");
  console.error("Usage: node donate-sgusd.js <campaign-id>");
  process.exit(1);
}

// Initialize Sui client
const client = new SuiClient({
  url: getFullnodeUrl('mainnet'),
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

// Main function to execute the donation
async function main() {
  try {
    // First, fetch campaign details to show current state
    console.log(`Fetching initial campaign details for ID: ${CAMPAIGN_ID}`);
    const campaignBefore = await client.getObject({
      id: CAMPAIGN_ID,
      options: { showContent: true }
    });
    
    if (!campaignBefore.data) {
      console.error("Campaign not found or error fetching campaign");
      process.exit(1);
    }
    
    const campaignFields = campaignBefore.data.content.fields;
    console.log("\nCampaign before donation:");
    console.log("Name:", campaignFields.name);
    console.log("Goal Amount:", formatBalance(campaignFields.goal_amount), "SUI");
    console.log("Current SUI raised:", formatBalance(campaignFields.raised), "SUI");
    
    // Get private key from user
    const privateKeyBase64 = await prompt("Enter your private key (base64 encoded): ");
    
    // Create keypair from private key
    const privateKeyBytes = fromB64(privateKeyBase64);
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`Using address: ${address}`);
    
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
    console.log("\nWaiting for transaction to be processed...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fetch campaign details again to show updated state
    console.log(`\nFetching updated campaign details for ID: ${CAMPAIGN_ID}`);
    const campaignAfter = await client.getObject({
      id: CAMPAIGN_ID,
      options: { showContent: true }
    });
    
    if (!campaignAfter.data) {
      console.error("Error fetching updated campaign details");
      process.exit(1);
    }
    
    const updatedFields = campaignAfter.data.content.fields;
    console.log("\nCampaign after donation:");
    console.log("Name:", updatedFields.name);
    console.log("Goal Amount:", formatBalance(updatedFields.goal_amount), "SUI");
    console.log("Current SUI raised:", formatBalance(updatedFields.raised), "SUI");
    
    // Check for sgUSD balance
    let sgUSDRaised = '0';
    if (updatedFields.raised_sgusd) {
      if (typeof updatedFields.raised_sgusd === 'string') {
        sgUSDRaised = updatedFields.raised_sgusd;
      } else if (updatedFields.raised_sgusd.fields && updatedFields.raised_sgusd.fields.value) {
        sgUSDRaised = updatedFields.raised_sgusd.fields.value;
      }
    }
    console.log("Current sgUSD raised:", formatBalance(sgUSDRaised), "sgUSD");
    console.log("Backer Count:", updatedFields.backer_count);
    
    console.log("\nDonation completed successfully!");
    
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
