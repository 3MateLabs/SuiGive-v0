// Script to inspect blockchain data using the correct IDs from .env
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Get IDs from environment variables
const SUI_CONFIG = {
  PACKAGE_ID: process.env.PACKAGE_ID,
  REGISTRY_ID: process.env.REGISTRY_ID,
  TREASURY_ID: process.env.TREASURY_ID,
  TREASURY_CAP_ID: process.env.TREASURY_CAP_ID,
  SGUSD_MANAGER_ID: process.env.SGUSD_MANAGER_ID,
  DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS,
  NETWORK: process.env.NETWORK || 'testnet',
};

console.log('Using the following configuration:');
console.log(JSON.stringify(SUI_CONFIG, null, 2));

async function inspectBlockchainData() {
  try {
    console.log('\n=== INSPECTING BLOCKCHAIN DATA ===');
    
    // 1. Check Registry Object
    console.log('\n--- REGISTRY OBJECT ---');
    try {
      const registryCmd = `sui client object ${SUI_CONFIG.REGISTRY_ID} --json`;
      console.log(`Executing: ${registryCmd}`);
      
      const registryOutput = execSync(registryCmd).toString();
      // Save output to a file for inspection
      fs.writeFileSync(path.join(__dirname, 'registry-output.json'), registryOutput);
      console.log(`Registry data saved to ${path.join(__dirname, 'registry-output.json')}`);
      
      try {
        const registry = JSON.parse(registryOutput);
        if (registry && registry.data && registry.data.content) {
          const content = registry.data.content;
          if (content.fields && content.fields.campaigns) {
            const campaignIds = content.fields.campaigns;
            console.log(`Found ${campaignIds.length} campaign IDs in registry:`);
            
            // Print first 5 campaign IDs
            campaignIds.slice(0, 5).forEach((id, index) => {
              console.log(`${index+1}. ${id}`);
            });
            
            // Save all campaign IDs to a file
            fs.writeFileSync(
              path.join(__dirname, 'campaign-ids.json'), 
              JSON.stringify(campaignIds, null, 2)
            );
            console.log(`All campaign IDs saved to ${path.join(__dirname, 'campaign-ids.json')}`);
            
            // Check if these campaigns exist in our database
            const dbCampaigns = await prisma.campaign.findMany({
              select: { id: true, name: true }
            });
            
            console.log('\nComparing blockchain campaigns with database:');
            console.log(`Database has ${dbCampaigns.length} campaigns`);
            console.log(`Blockchain has ${campaignIds.length} campaigns`);
            
            // Check for campaigns in blockchain but not in database
            const missingInDb = campaignIds.filter(id => 
              !dbCampaigns.some(dbCampaign => dbCampaign.id === id)
            );
            
            if (missingInDb.length > 0) {
              console.log(`\n${missingInDb.length} campaigns exist on blockchain but not in database:`);
              missingInDb.slice(0, 5).forEach((id, i) => {
                console.log(`${i+1}. ${id}`);
              });
              
              if (missingInDb.length > 5) {
                console.log(`...and ${missingInDb.length - 5} more`);
              }
            }
            
            // Check for campaigns in database but not in blockchain
            const missingInBlockchain = dbCampaigns.filter(dbCampaign => 
              !campaignIds.includes(dbCampaign.id)
            );
            
            if (missingInBlockchain.length > 0) {
              console.log(`\n${missingInBlockchain.length} campaigns exist in database but not on blockchain:`);
              missingInBlockchain.forEach((campaign, i) => {
                console.log(`${i+1}. ${campaign.id} (${campaign.name})`);
              });
            }
            
            // Fetch details for a sample campaign
            if (campaignIds.length > 0) {
              const sampleCampaignId = campaignIds[0];
              console.log(`\nFetching details for sample campaign ${sampleCampaignId}...`);
              
              const campaignCmd = `sui client object ${sampleCampaignId} --json`;
              console.log(`Executing: ${campaignCmd}`);
              
              try {
                const campaignOutput = execSync(campaignCmd).toString();
                fs.writeFileSync(
                  path.join(__dirname, 'sample-campaign.json'), 
                  campaignOutput
                );
                console.log(`Sample campaign data saved to ${path.join(__dirname, 'sample-campaign.json')}`);
                
                const campaign = JSON.parse(campaignOutput);
                if (campaign && campaign.data && campaign.data.content) {
                  const fields = campaign.data.content.fields;
                  console.log('Campaign blockchain details:');
                  console.log(`Name: ${fields.name}`);
                  console.log(`Description: ${fields.description}`);
                  console.log(`Goal Amount: ${fields.goal_amount}`);
                  console.log(`Current Amount: ${fields.current_amount}`);
                  console.log(`Backer Count: ${fields.backer_count}`);
                  console.log(`Creator: ${fields.creator}`);
                  console.log(`Deadline: ${new Date(Number(fields.deadline)).toLocaleString()}`);
                  
                  // Check if this campaign exists in database
                  const dbCampaign = await prisma.campaign.findUnique({
                    where: { id: sampleCampaignId },
                    include: {
                      _count: {
                        select: { donations: true }
                      }
                    }
                  });
                  
                  if (dbCampaign) {
                    console.log('\nComparison with database record:');
                    console.log(`DB Name: ${dbCampaign.name}`);
                    console.log(`DB Goal Amount: ${dbCampaign.goalAmount}`);
                    console.log(`DB Current Amount: ${dbCampaign.currentAmount}`);
                    console.log(`DB Backer Count: ${dbCampaign.backerCount}`);
                    console.log(`DB Actual Donation Count: ${dbCampaign._count.donations}`);
                    
                    // Check for discrepancies
                    if (
                      fields.current_amount !== dbCampaign.currentAmount ||
                      fields.backer_count.toString() !== dbCampaign.backerCount.toString()
                    ) {
                      console.log('\n⚠️ DISCREPANCY DETECTED: Campaign stats don\'t match between blockchain and database');
                    } else {
                      console.log('\n✅ Campaign stats match between blockchain and database');
                    }
                  } else {
                    console.log('\n❌ This campaign does not exist in the database');
                  }
                }
              } catch (error) {
                console.error(`Error fetching campaign details: ${error.message}`);
              }
            }
          } else {
            console.log('No campaigns field found in registry object');
          }
        } else {
          console.log('Invalid registry object data');
        }
      } catch (parseError) {
        console.error('Error parsing registry JSON:', parseError.message);
        console.log('Raw output saved for manual inspection');
      }
    } catch (error) {
      console.error(`Error accessing registry: ${error.message}`);
    }
    
    // 2. Check Package Info
    console.log('\n--- PACKAGE INFO ---');
    try {
      const packageCmd = `sui client object ${SUI_CONFIG.PACKAGE_ID} --json`;
      console.log(`Executing: ${packageCmd}`);
      
      const packageOutput = execSync(packageCmd).toString();
      fs.writeFileSync(path.join(__dirname, 'package-output.json'), packageOutput);
      console.log(`Package data saved to ${path.join(__dirname, 'package-output.json')}`);
      
      try {
        const packageData = JSON.parse(packageOutput);
        console.log('Package data retrieved successfully');
      } catch (parseError) {
        console.error('Error parsing package JSON:', parseError.message);
      }
    } catch (error) {
      console.error(`Error accessing package: ${error.message}`);
    }
    
    // 3. Check Treasury Info
    console.log('\n--- TREASURY INFO ---');
    try {
      const treasuryCmd = `sui client object ${SUI_CONFIG.TREASURY_ID} --json`;
      console.log(`Executing: ${treasuryCmd}`);
      
      const treasuryOutput = execSync(treasuryCmd).toString();
      fs.writeFileSync(path.join(__dirname, 'treasury-output.json'), treasuryOutput);
      console.log(`Treasury data saved to ${path.join(__dirname, 'treasury-output.json')}`);
      
      try {
        const treasuryData = JSON.parse(treasuryOutput);
        console.log('Treasury data retrieved successfully');
      } catch (parseError) {
        console.error('Error parsing treasury JSON:', parseError.message);
      }
    } catch (error) {
      console.error(`Error accessing treasury: ${error.message}`);
    }
    
    // 4. Check Events for a sample campaign (if we have one)
    console.log('\n--- DONATION EVENTS ---');
    try {
      // Get campaign IDs from file if it exists
      let campaignIds = [];
      try {
        if (fs.existsSync(path.join(__dirname, 'campaign-ids.json'))) {
          campaignIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'campaign-ids.json')));
        }
      } catch (fileError) {
        console.error('Error reading campaign IDs file:', fileError.message);
      }
      
      if (campaignIds.length > 0) {
        const sampleCampaignId = campaignIds[0];
        console.log(`Checking donation events for campaign ${sampleCampaignId}`);
        
        const eventsCmd = `sui client events --module crowdfunding --package ${SUI_CONFIG.PACKAGE_ID} --json`;
        console.log(`Executing: ${eventsCmd}`);
        
        const eventsOutput = execSync(eventsCmd).toString();
        fs.writeFileSync(path.join(__dirname, 'donation-events.json'), eventsOutput);
        console.log(`Donation events saved to ${path.join(__dirname, 'donation-events.json')}`);
        
        try {
          const events = JSON.parse(eventsOutput);
          if (Array.isArray(events) && events.length > 0) {
            console.log(`Found ${events.length} events`);
            
            // Filter for donation events
            const donationEvents = events.filter(event => 
              event.type && event.type.includes('::crowdfunding::DonationEvent')
            );
            
            console.log(`Found ${donationEvents.length} donation events`);
            
            if (donationEvents.length > 0) {
              console.log('\nSample donation events:');
              donationEvents.slice(0, 3).forEach((event, i) => {
                console.log(`\nEvent ${i+1}:`);
                console.log(`Transaction ID: ${event.id.txDigest}`);
                if (event.parsedJson) {
                  console.log(`Campaign ID: ${event.parsedJson.campaign_id}`);
                  console.log(`Donor: ${event.parsedJson.donor}`);
                  console.log(`Amount: ${event.parsedJson.amount}`);
                  console.log(`Message: ${event.parsedJson.message || '(no message)'}`);
                  console.log(`Anonymous: ${event.parsedJson.is_anonymous}`);
                }
              });
              
              // Check if these donations exist in the database
              if (donationEvents.length > 0 && donationEvents[0].parsedJson) {
                const sampleEvent = donationEvents[0];
                const txDigest = sampleEvent.id.txDigest;
                
                console.log(`\nChecking if donation with transaction ID ${txDigest} exists in database...`);
                
                const dbDonation = await prisma.donation.findFirst({
                  where: { transactionId: txDigest }
                });
                
                if (dbDonation) {
                  console.log('✅ Donation found in database');
                } else {
                  console.log('❌ Donation NOT found in database');
                }
              }
            }
          } else {
            console.log('No events found');
          }
        } catch (parseError) {
          console.error('Error parsing events JSON:', parseError.message);
        }
      } else {
        console.log('No campaign IDs available to check events');
      }
    } catch (error) {
      console.error(`Error accessing events: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error inspecting blockchain data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the inspection
inspectBlockchainData()
  .then(() => {
    console.log('\nBlockchain data inspection completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
