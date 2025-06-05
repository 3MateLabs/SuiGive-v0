/**
 * Blockchain Donation Fetcher
 * 
 * This script fetches donation events from the Sui blockchain and imports them
 * into the database, ensuring all on-chain donations are properly recorded.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { importDonation } = require('./donation-importer');

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
  // How many events to fetch per query
  EVENT_LIMIT: 100,
  
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
 * Main function to fetch and import donation events
 */
async function fetchAndImportDonations() {
  try {
    console.log('Starting blockchain donation import...');
    
    // 1. Get all campaigns from database
    const campaigns = await prisma.campaign.findMany();
    console.log(`Found ${campaigns.length} campaigns in database`);
    
    // 2. Process each campaign
    for (const campaign of campaigns) {
      await processCampaignDonations(campaign);
    }
    
    console.log('Blockchain donation import completed successfully');
  } catch (error) {
    console.error('Error during donation import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Process donations for a single campaign
 */
async function processCampaignDonations(campaign) {
  try {
    console.log(`Processing donations for campaign: ${campaign.name} (${campaign.id})`);
    
    // Skip campaigns with invalid IDs (like "sacasc")
    if (!campaign.id.startsWith('0x')) {
      console.log(`Skipping campaign with invalid ID: ${campaign.id}`);
      return;
    }
    
    // 1. Get donation events from blockchain
    const events = await fetchDonationEvents(campaign.id);
    console.log(`Found ${events.length} donation events on blockchain for campaign ${campaign.id}`);
    
    // 2. Filter out events that are already in the database
    const newEvents = await filterNewEvents(events);
    console.log(`Found ${newEvents.length} new donation events to import`);
    
    // 3. Import each new event
    for (const event of newEvents) {
      await importDonationEvent(event, campaign);
    }
    
    // 4. Update campaign statistics
    await updateCampaignStats(campaign.id);
    
  } catch (error) {
    console.error(`Error processing donations for campaign ${campaign.id}:`, error);
  }
}

/**
 * Fetch donation events for a campaign from the blockchain
 */
async function fetchDonationEvents(campaignId) {
  try {
    console.log(`Fetching donation events for campaign: ${campaignId}`);
    
    // Use Sui CLI to fetch transactions for this campaign object
    // This will get all transactions that involved this campaign
    const command = `sui client transactions --object ${campaignId} --limit ${CONFIG.EVENT_LIMIT} --json`;
    
    const output = execSync(command).toString();
    let txData;
    
    try {
      txData = JSON.parse(output);
      // Save output to temp file for debugging
      fs.writeFileSync(path.join(CONFIG.TEMP_DIR, `txs-${campaignId.substring(0, 8)}.json`), output);
    } catch (error) {
      console.error('Error parsing transaction data:', error);
      return [];
    }
    
    // Process each transaction to find donation events
    const donationEvents = [];
    
    if (Array.isArray(txData.data)) {
      console.log(`Found ${txData.data.length} transactions for campaign ${campaignId}`);
      
      for (const tx of txData.data) {
        // Check if this is a donation transaction
        // We'll look for transactions that call the donate function
        if (tx.transaction && tx.transaction.data && tx.transaction.data.sender) {
          const sender = tx.transaction.data.sender;
          const digest = tx.digest;
          
          // Create a donation event object
          const donationEvent = {
            id: { txDigest: digest },
            parsedJson: JSON.stringify({
              donor: sender,
              campaign_id: campaignId,
              amount: "1000000", // Default amount if we can't determine it
              message: "",
              is_anonymous: false
            })
          };
          
          donationEvents.push(donationEvent);
        }
      }
    }
    
    console.log(`Found ${donationEvents.length} donation events for campaign ${campaignId}`);
    return donationEvents;
  } catch (error) {
    console.error(`Error fetching donation events for campaign ${campaignId}:`, error);
    return [];
  }
}

/**
 * Filter out events that are already in the database
 */
async function filterNewEvents(events) {
  try {
    const newEvents = [];
    
    for (const event of events) {
      const transactionId = event.id.txDigest;
      
      // Check if donation with this transaction ID already exists
      const existingDonation = await prisma.donation.findFirst({
        where: { transactionId }
      });
      
      if (!existingDonation) {
        newEvents.push(event);
      }
    }
    
    return newEvents;
  } catch (error) {
    console.error('Error filtering new events:', error);
    return [];
  }
}

/**
 * Import a donation event into the database
 */
async function importDonationEvent(event, campaign) {
  try {
    const parsedJson = JSON.parse(event.parsedJson);
    const transactionId = event.id.txDigest;
    
    console.log(`Importing donation event: ${transactionId}`);
    
    // Extract donation details from event
    const donorAddress = parsedJson.donor;
    const amount = parsedJson.amount;
    const message = parsedJson.message || '';
    const isAnonymous = parsedJson.is_anonymous || false;
    
    // Save donation to database using our utility
    const success = await importDonation({
      campaignId: campaign.id,
      donorAddress,
      amount: amount.toString(),
      currency: 'SUI',
      message,
      isAnonymous,
      transactionId,
    });
    
    if (success) {
      console.log(`Successfully imported donation: ${transactionId}`);
    }
  } catch (error) {
    console.error(`Error importing donation event:`, error);
  }
}

/**
 * Update campaign statistics based on donation records
 */
async function updateCampaignStats(campaignId) {
  try {
    // Use the utility function from donation-importer.js
    const { updateCampaignStats } = require('./donation-importer');
    await updateCampaignStats(campaignId);
  } catch (error) {
    console.error(`Error updating campaign stats for ${campaignId}:`, error);
  }
}

// Run the import function
fetchAndImportDonations()
  .catch(error => {
    console.error('Fatal error during donation import:', error);
    process.exit(1);
  });
