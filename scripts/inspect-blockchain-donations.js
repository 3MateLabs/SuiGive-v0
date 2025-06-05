// Script to inspect blockchain donations for a specific campaign
// Use ES modules with import statements
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import SUI SDK
import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';

// Define SUI_CONFIG manually to avoid import issues
const SUI_CONFIG = {
  PACKAGE_ID: '0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187',
  REGISTRY_ID: '0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b',
  TREASURY_ID: '0x78e9fce20e895c509d525ea53340139a31333bd5afe7fdadbb1d6755f9aa8338',
  TREASURY_CAP_ID: '0x5afae39c3e945e0a17938e3d46f4d9dd81ae9749380b23f6ca1763e4b44ee7f3',
  NETWORK: 'testnet',
};

// Create a Sui client
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Function to fetch donations for a campaign from the blockchain
async function fetchCampaignDonations(campaignId) {
  try {
    console.log(`Fetching blockchain donations for campaign: ${campaignId}`);
    
    // Get campaign object data
    const campaignObject = await client.getObject({
      id: campaignId,
      options: { showContent: true, showDisplay: true, showOwner: true }
    });
    
    console.log('\nCampaign Details:');
    console.log('----------------');
    
    if (!campaignObject || !campaignObject.data) {
      console.error(`Campaign ${campaignId} not found on blockchain`);
      return null;
    }
    
    // Extract campaign details
    const campaignData = campaignObject.data;
    console.log(`Name: ${campaignData.display?.data?.name || 'Unknown'}`);
    console.log(`Owner: ${JSON.stringify(campaignData.owner)}`);
    
    // Get campaign content
    const content = campaignData.content;
    if (content && content.dataType === 'moveObject') {
      const fields = content.fields;
      console.log(`Goal Amount: ${fields.goal_amount || 'Unknown'}`);
      console.log(`Current Amount: ${fields.current_amount || 'Unknown'}`);
      console.log(`Backer Count: ${fields.backer_count || 'Unknown'}`);
      console.log(`Deadline: ${new Date(Number(fields.deadline || 0)).toLocaleString()}`);
    }
    
    // Fetch donation events for this campaign
    console.log('\nFetching donation events...');
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::DonationEvent`
      },
      limit: 50
    });
    
    // Filter events for this campaign
    const campaignDonations = events.data.filter(event => {
      const parsedJson = event.parsedJson;
      return parsedJson && parsedJson.campaign_id === campaignId;
    });
    
    console.log(`\nFound ${campaignDonations.length} donations on blockchain for this campaign`);
    
    // Display donation details
    if (campaignDonations.length > 0) {
      console.log('\nDonation Details:');
      console.log('----------------');
      
      campaignDonations.forEach((donation, index) => {
        const parsedJson = donation.parsedJson;
        console.log(`\nDonation #${index + 1}:`);
        console.log(`Transaction ID: ${donation.id.txDigest}`);
        console.log(`Donor: ${parsedJson.donor}`);
        console.log(`Amount: ${parsedJson.amount / 1_000_000_000} SUI`);
        console.log(`Message: ${parsedJson.message || 'No message'}`);
        console.log(`Anonymous: ${parsedJson.is_anonymous ? 'Yes' : 'No'}`);
        console.log(`Timestamp: ${new Date(Number(donation.timestampMs)).toLocaleString()}`);
      });
    }
    
    return campaignDonations;
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    return null;
  }
}

// Function to check if these donations exist in our database
async function checkDonationsInDatabase(donations) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('\nChecking donations in database...');
    
    for (const donation of donations) {
      const txDigest = donation.id.txDigest;
      const dbDonation = await prisma.donation.findFirst({
        where: { transactionId: txDigest }
      });
      
      if (dbDonation) {
        console.log(`✅ Donation ${txDigest} exists in database`);
      } else {
        console.log(`❌ Donation ${txDigest} NOT found in database`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking donations in database:', error);
  }
}

// Main function
async function main() {
  // Get campaign ID from command line arguments
  const campaignId = process.argv[2];
  
  if (!campaignId) {
    console.error('Please provide a campaign ID as an argument');
    console.log('Usage: node inspect-blockchain-donations.js <campaign-id>');
    process.exit(1);
  }
  
  const donations = await fetchCampaignDonations(campaignId);
  
  if (donations && donations.length > 0) {
    await checkDonationsInDatabase(donations);
  }
}

main().catch(console.error);
