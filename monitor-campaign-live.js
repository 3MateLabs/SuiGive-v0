// Script to continuously monitor a campaign object and display changes
const { SuiClient } = require('@mysten/sui/client');

// Campaign ID to monitor
const CAMPAIGN_ID = process.argv[2];

if (!CAMPAIGN_ID) {
  console.error("Please provide a campaign ID as an argument");
  console.error("Usage: node monitor-campaign-live.js <campaign-id>");
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

// Store previous state to detect changes
let previousState = null;

// Function to fetch and display campaign details
async function monitorCampaign() {
  try {
    // Fetch the campaign object with all details
    const campaignObj = await client.getObject({
      id: CAMPAIGN_ID,
      options: { 
        showContent: true,
        showVersion: true,
      }
    });
    
    if (!campaignObj.data) {
      console.error("Campaign not found or error fetching campaign");
      return;
    }
    
    // Extract campaign fields
    const campaignData = campaignObj.data.content;
    if (!campaignData || !campaignData.fields) {
      console.error("Campaign data structure is not as expected");
      return;
    }
    
    const fields = campaignData.fields;
    const version = campaignObj.data.version;
    
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
    
    // Create current state object
    const currentState = {
      version,
      name: fields.name,
      raised: raisedRaw,
      raisedSgUSD: raisedSgUSDRaw,
      backerCount: fields.backer_count,
      progress: progressPercentage.toFixed(2),
    };
    
    // Check if this is the first run or if there are changes
    if (!previousState) {
      // First run - display initial state
      console.clear();
      console.log(`=== MONITORING CAMPAIGN: ${fields.name} ===`);
      console.log(`Campaign ID: ${CAMPAIGN_ID}`);
      console.log(`Version: ${version}`);
      console.log(`Goal Amount: ${formatBalance(fields.goal_amount)} SUI`);
      console.log(`Raised (SUI): ${formatBalance(raisedRaw)} SUI`);
      console.log(`Raised (sgUSD): ${formatBalance(raisedSgUSDRaw)} sgUSD`);
      console.log(`Progress: ${progressPercentage.toFixed(2)}%`);
      console.log(`Backer Count: ${fields.backer_count}`);
      console.log(`\nMonitoring for changes... (Press Ctrl+C to stop)`);
    } else if (
      previousState.version !== currentState.version ||
      previousState.raised !== currentState.raised ||
      previousState.raisedSgUSD !== currentState.raisedSgUSD ||
      previousState.backerCount !== currentState.backerCount
    ) {
      // Changes detected - display before and after
      console.clear();
      console.log(`=== CHANGES DETECTED FOR CAMPAIGN: ${fields.name} ===`);
      console.log(`Campaign ID: ${CAMPAIGN_ID}`);
      
      // Version change
      if (previousState.version !== currentState.version) {
        console.log(`Version: ${previousState.version} -> ${currentState.version}`);
      }
      
      // SUI balance change
      if (previousState.raised !== currentState.raised) {
        console.log(`Raised (SUI): ${formatBalance(previousState.raised)} -> ${formatBalance(currentState.raised)} SUI`);
      } else {
        console.log(`Raised (SUI): ${formatBalance(currentState.raised)} SUI (unchanged)`);
      }
      
      // sgUSD balance change
      if (previousState.raisedSgUSD !== currentState.raisedSgUSD) {
        console.log(`Raised (sgUSD): ${formatBalance(previousState.raisedSgUSD)} -> ${formatBalance(currentState.raisedSgUSD)} sgUSD`);
      } else {
        console.log(`Raised (sgUSD): ${formatBalance(currentState.raisedSgUSD)} sgUSD (unchanged)`);
      }
      
      // Progress change
      if (previousState.progress !== currentState.progress) {
        console.log(`Progress: ${previousState.progress}% -> ${currentState.progress}%`);
      } else {
        console.log(`Progress: ${currentState.progress}% (unchanged)`);
      }
      
      // Backer count change
      if (previousState.backerCount !== currentState.backerCount) {
        console.log(`Backer Count: ${previousState.backerCount} -> ${currentState.backerCount}`);
      } else {
        console.log(`Backer Count: ${currentState.backerCount} (unchanged)`);
      }
      
      console.log(`\nTimestamp: ${new Date().toISOString()}`);
      console.log(`\nContinuing to monitor... (Press Ctrl+C to stop)`);
    }
    
    // Update previous state
    previousState = currentState;
    
  } catch (error) {
    console.error("Error monitoring campaign:", error);
  }
}

// Run the monitoring function immediately
monitorCampaign();

// Set up interval to monitor continuously (every 2 seconds)
console.log("Starting continuous monitoring (checks every 2 seconds)...");
console.log("Make a donation to the campaign and watch for changes");
console.log("Press Ctrl+C to stop monitoring\n");

setInterval(monitorCampaign, 2000);
