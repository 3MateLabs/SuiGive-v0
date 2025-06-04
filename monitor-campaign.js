// Script to monitor a campaign object and display all its details
const { SuiClient } = require('@mysten/sui/client');
const { bcs } = require('@mysten/sui/bcs');
const { fromB64 } = require('@mysten/sui/utils');

// Import SUI_CONFIG directly
const SUI_CONFIG = {
  PACKAGE_ID: '0x9b1398e542c72df0448054e98d59406468edb3379e2f35e12829e903a13fec51',
  REGISTRY_ID: '0xbea7df830dca9675ea4cd4aa8c243bef7f91dc048921e77ac074f8416788333e',
};

// Campaign ID to monitor - replace with your campaign ID
const CAMPAIGN_ID = process.argv[2];

if (!CAMPAIGN_ID) {
  console.error("Please provide a campaign ID as an argument");
  console.error("Usage: node monitor-campaign.js <campaign-id>");
  process.exit(1);
}

// Initialize Sui client
const client = new SuiClient({
  url: 'https://fullnode.mainnet.sui.io',
});

// Function to format balance with proper decimals (9 decimals for SUI/sgUSD)
function formatBalance(balance, decimals = 9) {
  if (!balance) return '0';
  
  const balanceStr = balance.toString().padStart(decimals + 1, '0');
  const integerPart = balanceStr.slice(0, -decimals) || '0';
  const decimalPart = balanceStr.slice(-decimals);
  return `${integerPart}.${decimalPart}`;
}

// Function to safely extract nested values from objects
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Function to fetch and display campaign details
async function monitorCampaign() {
  try {
    console.log(`Fetching campaign details for ID: ${CAMPAIGN_ID}`);
    
    // Fetch the campaign object with all details
    const campaignObj = await client.getObject({
      id: CAMPAIGN_ID,
      options: { 
        showContent: true,
        showDisplay: true,
        showOwner: true,
        showType: true,
        showStorageRebate: true,
      }
    });
    
    if (!campaignObj.data) {
      console.error("Campaign not found or error fetching campaign");
      return;
    }
    
    console.log("\n=== CAMPAIGN OBJECT DETAILS ===\n");
    
    // Display basic object info
    console.log("Object Type:", campaignObj.data.type);
    console.log("Object Owner:", campaignObj.data.owner);
    console.log("Storage Rebate:", campaignObj.data.storageRebate);
    console.log("Object Version:", campaignObj.data.version);
    
    // Extract and display campaign fields
    const campaignData = campaignObj.data.content;
    if (!campaignData || !campaignData.fields) {
      console.error("Campaign data structure is not as expected");
      return;
    }
    
    console.log("\n=== CAMPAIGN FIELDS ===\n");
    
    // Display all campaign fields
    const fields = campaignData.fields;
    
    // Basic campaign info
    console.log("Name:", fields.name);
    console.log("Description:", fields.description);
    console.log("Image URL:", fields.image_url);
    console.log("Creator:", fields.creator);
    console.log("Category:", fields.category);
    
    // Financial details
    console.log("\n=== FINANCIAL DETAILS ===\n");
    console.log("Goal Amount:", formatBalance(fields.goal_amount), "SUI");
    
    // Handle different possible structures for the raised balance
    let raisedRaw = '0';
    if (typeof fields.raised === 'string') {
      // Direct value
      raisedRaw = fields.raised;
    } else if (typeof fields.raised === 'object') {
      // Nested structure
      if (fields.raised?.fields?.value) {
        raisedRaw = fields.raised.fields.value;
      } else if (fields.raised?.value) {
        raisedRaw = fields.raised.value;
      }
    }
    console.log("Raised (SUI):", formatBalance(raisedRaw), "SUI");
    
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
    console.log("Raised (sgUSD):", formatBalance(raisedSgUSDRaw), "sgUSD");
    
    // Calculate progress percentage
    const goalAmount = BigInt(fields.goal_amount || '0');
    const raisedAmount = BigInt(raisedRaw || '0');
    const progressPercentage = goalAmount > 0 ? 
      Number((raisedAmount * BigInt(100)) / goalAmount) : 0;
    
    console.log("Progress:", progressPercentage.toFixed(2), "%");
    
    // Other campaign stats
    console.log("\n=== CAMPAIGN STATS ===\n");
    console.log("Is Active:", fields.is_active);
    console.log("Backer Count:", fields.backer_count);
    
    // Handle optional fields that might not be present in all campaigns
    const distributedAmount = fields.distributed_amount || '0';
    const withdrawnAmount = fields.withdrawn_amount || '0';
    const withdrawnSgUSD = fields.withdrawn_sgusd || '0';
    
    console.log("Distributed Amount:", formatBalance(distributedAmount), "SUI");
    console.log("Withdrawn Amount (SUI):", formatBalance(withdrawnAmount), "SUI");
    console.log("Withdrawn Amount (sgUSD):", formatBalance(withdrawnSgUSD), "sgUSD");
    
    // Deadline info
    const deadlineEpoch = parseInt(fields.deadline);
    const currentEpoch = await client.getLatestCheckpointSequenceNumber();
    console.log("\n=== TIME DETAILS ===\n");
    console.log("Deadline Epoch:", deadlineEpoch);
    console.log("Current Epoch:", currentEpoch);
    console.log("Status:", deadlineEpoch > currentEpoch ? "Active" : "Ended");
    
    // Display raw data for debugging
    console.log("\n=== RAW OBJECT DATA (for debugging) ===\n");
    console.log(JSON.stringify(campaignObj.data, null, 2));
    
  } catch (error) {
    console.error("Error monitoring campaign:", error);
  }
}

// Run the monitoring function
monitorCampaign();

// Set up interval to monitor continuously (every 10 seconds)
if (process.argv.includes('--watch')) {
  console.log("\nWatching campaign for changes (refresh every 10 seconds)...");
  console.log("Press Ctrl+C to stop watching\n");
  
  setInterval(monitorCampaign, 10000);
}
