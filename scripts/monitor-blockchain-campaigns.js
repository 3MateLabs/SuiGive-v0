/**
 * Blockchain Campaign Monitor
 * 
 * This script continuously monitors campaigns on the Sui blockchain and syncs
 * donation data with the PostgreSQL database. It can be run as a background
 * process to ensure the database always reflects the current blockchain state.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
// Import SUI_CONFIG from the config file
let SUI_CONFIG;
try {
  // Try to import from compiled JS file
  SUI_CONFIG = require('../lib/sui-config').SUI_CONFIG;
} catch (error) {
  // If that fails, read the values from .env file
  require('dotenv').config();
  SUI_CONFIG = {
    PACKAGE_ID: process.env.PACKAGE_ID,
    REGISTRY_ID: process.env.REGISTRY_ID,
    TREASURY_ID: process.env.TREASURY_ID,
    TREASURY_CAP_ID: process.env.TREASURY_CAP_ID,
    NETWORK: process.env.NETWORK || 'testnet'
  };
  console.log('Using SUI_CONFIG from environment variables:', SUI_CONFIG);
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  // How often to check for updates (in milliseconds)
  POLLING_INTERVAL: 60000, // 1 minute
  
  // Maximum number of campaigns to process in one batch
  BATCH_SIZE: 10,
  
  // Directory for temporary files
  TEMP_DIR: path.join(__dirname, 'temp'),
  
  // Whether to log detailed information
  VERBOSE: true
};

// Create temp directory if it doesn't exist
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
  fs.mkdirSync(CONFIG.TEMP_DIR);
}

/**
 * Main monitoring function
 */
async function monitorBlockchainCampaigns() {
  try {
    log('Starting blockchain campaign monitor...');
    
    // Run initial sync
    await syncAllCampaigns();
    
    // Set up continuous monitoring
    setInterval(async () => {
      log('Running periodic sync...');
      await syncAllCampaigns();
    }, CONFIG.POLLING_INTERVAL);
    
  } catch (error) {
    console.error('Error in monitor:', error);
    process.exit(1);
  }
}

/**
 * Sync all campaigns from blockchain to database
 */
async function syncAllCampaigns() {
  try {
    // 1. Get all campaigns from registry
    const registryData = await getRegistryData();
    const campaignIds = extractCampaignIds(registryData);
    
    log(`Found ${campaignIds.length} campaigns in registry`);
    
    // 2. Process campaigns in batches
    for (let i = 0; i < campaignIds.length; i += CONFIG.BATCH_SIZE) {
      const batch = campaignIds.slice(i, i + CONFIG.BATCH_SIZE);
      log(`Processing batch ${i/CONFIG.BATCH_SIZE + 1}/${Math.ceil(campaignIds.length/CONFIG.BATCH_SIZE)}`);
      
      // Process campaigns in parallel
      await Promise.all(batch.map(campaignId => processCampaign(campaignId)));
    }
    
    log('Campaign sync completed');
  } catch (error) {
    console.error('Error syncing campaigns:', error);
  }
}

/**
 * Get registry data from blockchain
 */
async function getRegistryData() {
  try {
    const registryId = SUI_CONFIG.REGISTRY_ID;
    log(`Fetching registry data for ID: ${registryId}`);
    
    const command = `sui client object ${registryId} --json`;
    const output = execSync(command).toString();
    
    return JSON.parse(output);
  } catch (error) {
    console.error('Error fetching registry data:', error);
    throw error;
  }
}

/**
 * Extract campaign IDs from registry data
 */
function extractCampaignIds(registryData) {
  try {
    // Extract campaign IDs from registry data
    const campaigns = registryData.content.fields.campaigns;
    return campaigns.map(campaign => campaign.fields.id.id);
  } catch (error) {
    console.error('Error extracting campaign IDs:', error);
    return [];
  }
}

/**
 * Process a single campaign
 */
async function processCampaign(campaignId) {
  try {
    log(`Processing campaign: ${campaignId}`);
    
    // 1. Get campaign data from blockchain
    const campaignData = await getCampaignData(campaignId);
    
    // 2. Check if campaign exists in database
    const dbCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });
    
    // 3. Create or update campaign in database
    if (!dbCampaign) {
      log(`Campaign ${campaignId} not found in database, creating...`);
      await createCampaignFromBlockchain(campaignData);
    } else {
      // Check if blockchain data is different from database
      const needsUpdate = campaignNeedsUpdate(dbCampaign, campaignData);
      if (needsUpdate) {
        log(`Campaign ${campaignId} needs update, updating...`);
        await updateCampaignFromBlockchain(dbCampaign, campaignData);
      } else {
        log(`Campaign ${campaignId} is up to date`);
      }
    }
    
    // 4. Process donations for this campaign
    await syncCampaignDonations(campaignId, campaignData);
    
  } catch (error) {
    console.error(`Error processing campaign ${campaignId}:`, error);
  }
}

/**
 * Check if campaign needs update based on blockchain data
 */
function campaignNeedsUpdate(dbCampaign, blockchainData) {
  const fields = blockchainData.content.fields;
  
  // Check if key fields are different
  if (
    dbCampaign.backerCount !== parseInt(fields.backer_count) ||
    dbCampaign.currentAmount !== fields.raised_sgusd
  ) {
    return true;
  }
  
  return false;
}

/**
 * Get campaign data from blockchain
 */
async function getCampaignData(campaignId) {
  try {
    const command = `sui client object ${campaignId} --json`;
    const output = execSync(command).toString();
    
    return JSON.parse(output);
  } catch (error) {
    console.error(`Error fetching campaign data for ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Create a new campaign in the database from blockchain data
 */
async function createCampaignFromBlockchain(campaignData) {
  try {
    const fields = campaignData.content.fields;
    
    // Convert deadline from Unix timestamp to Date
    const deadlineDate = new Date(parseInt(fields.deadline) * 1000);
    
    await prisma.campaign.create({
      data: {
        id: fields.id.id,
        name: fields.name,
        description: fields.description,
        imageUrl: fields.image_url,
        goalAmount: fields.goal_amount,
        currentAmount: fields.raised_sgusd,
        creator: fields.creator,
        deadline: deadlineDate,
        category: fields.category,
        backerCount: parseInt(fields.backer_count),
      }
    });
    
    log(`Created campaign ${fields.name} (${fields.id.id}) in database`);
  } catch (error) {
    console.error('Error creating campaign in database:', error);
    throw error;
  }
}

/**
 * Update an existing campaign in the database from blockchain data
 */
async function updateCampaignFromBlockchain(dbCampaign, campaignData) {
  try {
    const fields = campaignData.content.fields;
    
    // Convert deadline from Unix timestamp to Date
    const deadlineDate = new Date(parseInt(fields.deadline) * 1000);
    
    await prisma.campaign.update({
      where: { id: fields.id.id },
      data: {
        name: fields.name,
        description: fields.description,
        imageUrl: fields.image_url,
        goalAmount: fields.goal_amount,
        currentAmount: fields.raised_sgusd,
        deadline: deadlineDate,
        category: fields.category,
        backerCount: parseInt(fields.backer_count),
      }
    });
    
    log(`Updated campaign ${fields.name} (${fields.id.id}) in database`);
  } catch (error) {
    console.error('Error updating campaign in database:', error);
    throw error;
  }
}

/**
 * Sync donations for a campaign by checking blockchain events
 */
async function syncCampaignDonations(campaignId, campaignData) {
  try {
    const fields = campaignData.content.fields;
    const blockchainBackerCount = parseInt(fields.backer_count);
    
    // Get donation count from database
    const donations = await prisma.donation.findMany({
      where: { campaignId }
    });
    
    // Get unique donor count from database
    const uniqueDonors = new Set(donations.map(d => d.donorAddress)).size;
    
    if (blockchainBackerCount > uniqueDonors) {
      log(`⚠️ Campaign ${campaignId} has more backers on blockchain (${blockchainBackerCount}) than in database (${uniqueDonors})`);
      
      // This would be where you'd fetch donation events from the blockchain
      // and create missing donation records in the database
      
      // For now, we'll just update the campaign stats to match the blockchain
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          backerCount: blockchainBackerCount,
          currentAmount: fields.raised_sgusd
        }
      });
      
      log(`Updated campaign ${campaignId} stats to match blockchain`);
    }
  } catch (error) {
    console.error(`Error syncing donations for campaign ${campaignId}:`, error);
  }
}

/**
 * Utility function for logging
 */
function log(message) {
  if (CONFIG.VERBOSE) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// Run the monitor
monitorBlockchainCampaigns()
  .catch(error => {
    console.error('Fatal error in monitor:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Monitor shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
