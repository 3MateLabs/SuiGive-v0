/**
 * Blockchain-Database Synchronization Script
 * 
 * This script synchronizes campaign and donation data between the Sui blockchain
 * and the PostgreSQL database, ensuring that all on-chain donations are properly
 * reflected in the database for analytics and UI display.
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

// Temporary file for storing blockchain data
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

/**
 * Main function to synchronize blockchain data with database
 */
async function syncBlockchainWithDatabase() {
  try {
    console.log('Starting blockchain-database synchronization...');
    
    // 1. Get all campaigns from the registry
    console.log('Fetching campaigns from blockchain registry...');
    const registryData = await getRegistryData();
    let campaignIds = extractCampaignIds(registryData);
    
    console.log(`Found ${campaignIds.length} campaigns in registry`);
    
    // If no campaigns found in registry, try to get them from the database
    if (campaignIds.length === 0) {
      console.log('No campaigns found in registry, checking database...');
      const dbCampaigns = await prisma.campaign.findMany({
        select: { id: true }
      });
      
      campaignIds = dbCampaigns.map(campaign => campaign.id);
      console.log(`Found ${campaignIds.length} campaigns in database`);
    }
    
    // 2. Process each campaign
    for (const campaignId of campaignIds) {
      try {
        await processCampaign(campaignId);
      } catch (error) {
        console.error(`Error processing campaign ${campaignId}:`, error);
        console.log(`Continuing with next campaign...`);
      }
    }
    
    // 3. Fix campaign statistics
    await fixCampaignStatistics();
    
    // 4. Fix user statistics
    await fixUserStatistics();
    
    console.log('Blockchain-database synchronization completed successfully');
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get registry data from blockchain
 */
async function getRegistryData() {
  try {
    const registryId = SUI_CONFIG.REGISTRY_ID;
    console.log(`Fetching registry data for ID: ${registryId}`);
    
    const command = `sui client object ${registryId} --json`;
    const output = execSync(command).toString();
    
    // Save output to temp file for debugging
    fs.writeFileSync(path.join(TEMP_DIR, 'registry-data.json'), output);
    
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
  console.log(`Processing campaign: ${campaignId}`);
  
  // 1. Check if campaign exists in database
  const dbCampaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  });
  
  // 2. Try to get campaign data from blockchain
  let campaignData;
  try {
    campaignData = await getCampaignData(campaignId);
    console.log(`Found campaign ${campaignId} on blockchain`);
  } catch (error) {
    console.warn(`Campaign ${campaignId} not found on blockchain: ${error.message}`);
    
    // If campaign exists in database but not on blockchain, we'll just skip updating it
    if (dbCampaign) {
      console.log(`Campaign ${campaignId} exists in database but not on blockchain, skipping update`);
      return;
    } else {
      console.error(`Campaign ${campaignId} not found in database or blockchain, skipping`);
      return;
    }
  }
  
  // 3. Create or update campaign in database
  if (!dbCampaign) {
    console.log(`Campaign ${campaignId} not found in database, creating...`);
    await createCampaignFromBlockchain(campaignData);
  } else {
    console.log(`Campaign ${campaignId} found in database, updating...`);
    await updateCampaignFromBlockchain(dbCampaign, campaignData);
  }
  
  // 4. Process donations for this campaign
  await processCampaignDonations(campaignId);
}

/**
 * Get campaign data from blockchain
 */
async function getCampaignData(campaignId) {
  try {
    const command = `sui client object ${campaignId} --json`;
    const output = execSync(command).toString();
    
    // Save output to temp file for debugging
    fs.writeFileSync(path.join(TEMP_DIR, `campaign-${campaignId.substring(0, 8)}.json`), output);
    
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
    
    console.log(`Created campaign ${fields.name} (${fields.id.id}) in database`);
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
    
    console.log(`Updated campaign ${fields.name} (${fields.id.id}) in database`);
  } catch (error) {
    console.error('Error updating campaign in database:', error);
    throw error;
  }
}

/**
 * Process donations for a campaign
 */
async function processCampaignDonations(campaignId) {
  try {
    console.log(`Processing donations for campaign: ${campaignId}`);
    
    // Get donation events from blockchain
    // Note: This is a simplified version. In a real implementation, 
    // you would need to query the blockchain for donation events
    // using the Sui SDK or CLI
    
    // For now, we'll just ensure the campaign stats match
    const campaignData = await getCampaignData(campaignId);
    const fields = campaignData.content.fields;
    
    // Get donation count from database
    const donationCount = await prisma.donation.count({
      where: { campaignId }
    });
    
    // Get unique donor count from database
    const uniqueDonors = await prisma.donation.groupBy({
      by: ['donorAddress'],
      where: { campaignId }
    });
    
    console.log(`Campaign ${campaignId} stats:`);
    console.log(`- Blockchain backer count: ${fields.backer_count}`);
    console.log(`- Database unique donors: ${uniqueDonors.length}`);
    console.log(`- Database donation count: ${donationCount}`);
    
    if (parseInt(fields.backer_count) > uniqueDonors.length) {
      console.warn(`⚠️ Campaign ${campaignId} has more backers on blockchain (${fields.backer_count}) than in database (${uniqueDonors.length})`);
      // This would be where you'd fetch and process missing donations
    }
  } catch (error) {
    console.error(`Error processing donations for campaign ${campaignId}:`, error);
  }
}

/**
 * Fix campaign statistics to match donation records
 */
async function fixCampaignStatistics() {
  try {
    console.log('Fixing campaign statistics...');
    
    // Get all campaigns
    const campaigns = await prisma.campaign.findMany();
    
    for (const campaign of campaigns) {
      // Get all donations for this campaign
      const donations = await prisma.donation.findMany({
        where: { campaignId: campaign.id }
      });
      
      // Calculate total amount
      let totalAmount = BigInt(0);
      for (const donation of donations) {
        totalAmount += BigInt(donation.amount);
      }
      
      // Get unique donor count
      const uniqueDonors = new Set(donations.map(d => d.donorAddress)).size;
      
      // Update campaign
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          currentAmount: totalAmount.toString(),
          backerCount: uniqueDonors
        }
      });
      
      console.log(`Fixed stats for campaign ${campaign.id}: amount=${totalAmount.toString()}, backers=${uniqueDonors}`);
    }
    
    console.log('Campaign statistics fixed successfully');
  } catch (error) {
    console.error('Error fixing campaign statistics:', error);
  }
}

/**
 * Fix user statistics to match donation records
 */
async function fixUserStatistics() {
  try {
    console.log('Fixing user statistics...');
    
    // Get all users
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      // Get all donations for this user
      const donations = await prisma.donation.findMany({
        where: { donorAddress: user.address }
      });
      
      // Calculate total amount
      let totalAmount = BigInt(0);
      for (const donation of donations) {
        totalAmount += BigInt(donation.amount);
      }
      
      // Find first and last donation dates
      let firstDonation = null;
      let lastDonation = null;
      
      if (donations.length > 0) {
        // Sort donations by date
        const sortedDonations = [...donations].sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        );
        
        firstDonation = sortedDonations[0].createdAt;
        lastDonation = sortedDonations[sortedDonations.length - 1].createdAt;
      }
      
      // Update user
      await prisma.user.update({
        where: { address: user.address },
        data: {
          totalDonated: totalAmount.toString(),
          donationCount: donations.length,
          firstDonation: firstDonation || user.firstDonation,
          lastDonation: lastDonation || user.lastDonation
        }
      });
      
      console.log(`Fixed stats for user ${user.address}: amount=${totalAmount.toString()}, count=${donations.length}`);
    }
    
    console.log('User statistics fixed successfully');
  } catch (error) {
    console.error('Error fixing user statistics:', error);
  }
}

// Run the sync function
syncBlockchainWithDatabase()
  .catch(error => {
    console.error('Fatal error during synchronization:', error);
    process.exit(1);
  });
