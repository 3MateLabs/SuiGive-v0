// Script to inspect blockchain donations for a specific campaign
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Hardcoded SUI_CONFIG to avoid import issues
const SUI_CONFIG = {
  PACKAGE_ID: '0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187',
  REGISTRY_ID: '0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b',
  TREASURY_ID: '0x78e9fce20e895c509d525ea53340139a31333bd5afe7fdadbb1d6755f9aa8338',
  TREASURY_CAP_ID: '0x5afae39c3e945e0a17938e3d46f4d9dd81ae9749380b23f6ca1763e4b44ee7f3',
  NETWORK: 'testnet',
};

// Function to fetch campaign donations using the Sui CLI
async function fetchCampaignDonations(campaignId) {
  try {
    console.log(`Fetching blockchain donations for campaign: ${campaignId}`);
    
    // Use sui CLI to get campaign object data
    const campaignObjectCmd = `sui client object ${campaignId} --json`;
    const campaignObjectResult = execSync(campaignObjectCmd).toString();
    const campaignObject = JSON.parse(campaignObjectResult);
    
    console.log('\nCampaign Details:');
    console.log('----------------');
    
    if (!campaignObject || !campaignObject.data) {
      console.error(`Campaign ${campaignId} not found on blockchain`);
      return null;
    }
    
    // Extract campaign details
    const campaignData = campaignObject.data;
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
    
    // Fetch donation events for this campaign using the Sui CLI
    console.log('\nFetching donation events...');
    const eventsCmd = `sui client event-query --module crowdfunding --package ${SUI_CONFIG.PACKAGE_ID} --event DonationEvent --limit 50 --json`;
    const eventsResult = execSync(eventsCmd).toString();
    const events = JSON.parse(eventsResult);
    
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
        
        // Get donor address from blockchain event
        const donorAddress = donation.parsedJson.donor;
        const amount = donation.parsedJson.amount.toString();
        const campaignId = donation.parsedJson.campaign_id;
        const message = donation.parsedJson.message || '';
        const isAnonymous = donation.parsedJson.is_anonymous;
        
        console.log(`Missing donation details:
          Campaign ID: ${campaignId}
          Donor: ${donorAddress}
          Amount: ${amount}
          Message: ${message}
          Anonymous: ${isAnonymous ? 'Yes' : 'No'}
          Transaction ID: ${txDigest}
        `);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking donations in database:', error);
  }
}

// Function to check why donations might not be saving
async function diagnoseDonateSaveIssue() {
  try {
    console.log('\nDiagnosing donation save issues...');
    
    // Check if the saveDonation function is being called
    console.log('Checking for database connection issues...');
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. Found ${userCount} users.`);
    
    // Check for campaign records
    const campaignCount = await prisma.campaign.count();
    console.log(`Found ${campaignCount} campaigns in database.`);
    
    // Check for donation records
    const donationCount = await prisma.donation.count();
    console.log(`Found ${donationCount} donations in database.`);
    
    console.log('\nPossible issues:');
    console.log('1. The donate function in sui-campaigns.ts is not calling saveDonation');
    console.log('2. There are errors when calling saveDonation that are being caught and ignored');
    console.log('3. The blockchain transaction is failing before saveDonation is called');
    console.log('4. Foreign key constraints are failing (missing user or campaign records)');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error diagnosing donation save issues:', error);
  }
}

// Main function
async function main() {
  // Get campaign ID from command line arguments
  const campaignId = process.argv[2];
  
  if (!campaignId) {
    console.error('Please provide a campaign ID as an argument');
    console.log('Usage: node check-blockchain-donations.js <campaign-id>');
    
    // Run general diagnostics instead
    await diagnoseDonateSaveIssue();
    process.exit(1);
  }
  
  const donations = await fetchCampaignDonations(campaignId);
  
  if (donations && donations.length > 0) {
    await checkDonationsInDatabase(donations);
  } else {
    console.log('No donations found on blockchain for this campaign.');
    await diagnoseDonateSaveIssue();
  }
}

main().catch(console.error);
