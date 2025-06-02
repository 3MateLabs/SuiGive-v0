// Script to find campaigns on the testnet
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');

// Import SUI_CONFIG from the configuration
const SUI_CONFIG = {
  PACKAGE_ID: '0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187',
  REGISTRY_ID: '0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b',
  NETWORK: 'testnet',
};

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

// Function to fetch all campaigns from the registry
async function findCampaigns() {
  try {
    console.log(`Fetching campaigns from registry: ${SUI_CONFIG.REGISTRY_ID}`);
    
    // Fetch the registry object
    const registryObj = await client.getObject({
      id: SUI_CONFIG.REGISTRY_ID,
      options: { showContent: true }
    });
    
    if (!registryObj.data) {
      console.error("Registry not found or error fetching registry");
      return;
    }
    
    // Extract campaigns from the registry
    const registryData = registryObj.data.content;
    if (!registryData || !registryData.fields || !registryData.fields.campaigns) {
      console.error("Registry data structure is not as expected");
      return;
    }
    
    const campaigns = registryData.fields.campaigns;
    console.log(`Found ${campaigns.length} campaigns in the registry`);
    
    // Fetch details for each campaign
    for (let i = 0; i < campaigns.length; i++) {
      const campaignId = campaigns[i];
      console.log(`\n--- Campaign ${i+1} ---`);
      console.log(`ID: ${campaignId}`);
      
      try {
        // Fetch campaign details
        const campaignObj = await client.getObject({
          id: campaignId,
          options: { showContent: true }
        });
        
        if (!campaignObj.data) {
          console.log("Campaign not found or error fetching campaign");
          continue;
        }
        
        const campaignData = campaignObj.data.content;
        if (!campaignData || !campaignData.fields) {
          console.log("Campaign data structure is not as expected");
          continue;
        }
        
        const fields = campaignData.fields;
        
        // Display campaign details
        console.log(`Name: ${fields.name}`);
        console.log(`Description: ${fields.description}`);
        console.log(`Category: ${fields.category}`);
        console.log(`Goal Amount: ${formatBalance(fields.goal_amount)} SUI`);
        
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
        console.log(`Raised (SUI): ${formatBalance(raisedRaw)} SUI`);
        
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
        console.log(`Raised (sgUSD): ${formatBalance(raisedSgUSDRaw)} sgUSD`);
        
        console.log(`Backer Count: ${fields.backer_count}`);
        console.log(`Is Active: ${fields.is_active}`);
        console.log(`Creator: ${fields.creator}`);
      } catch (error) {
        console.error(`Error fetching campaign ${campaignId}:`, error);
      }
    }
    
  } catch (error) {
    console.error("Error finding campaigns:", error);
  }
}

// Run the function to find campaigns
findCampaigns();
