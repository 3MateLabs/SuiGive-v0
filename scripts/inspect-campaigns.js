// Script to inspect campaign IDs and details from both blockchain and database
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

async function inspectCampaigns() {
  try {
    console.log('Inspecting campaigns in database and blockchain...');
    
    // 1. Get campaigns from database
    console.log('\n=== DATABASE CAMPAIGNS ===');
    const dbCampaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: { donations: true }
        }
      }
    });
    
    console.log(`Found ${dbCampaigns.length} campaigns in database:`);
    
    for (const campaign of dbCampaigns) {
      console.log(`\nCampaign ID: ${campaign.id}`);
      console.log(`Name: ${campaign.name}`);
      console.log(`Description: ${campaign.description}`);
      console.log(`Goal Amount: ${campaign.goalAmount}`);
      console.log(`Current Amount: ${campaign.currentAmount}`);
      console.log(`Backer Count: ${campaign.backerCount}`);
      console.log(`Database Donation Count: ${campaign._count.donations}`);
      console.log(`Creator: ${campaign.creator}`);
      console.log(`Category: ${campaign.category}`);
      console.log(`Deadline: ${campaign.deadline}`);
      
      // Get donations for this campaign
      const donations = await prisma.donation.findMany({
        where: { campaignId: campaign.id },
        orderBy: { createdAt: 'desc' },
        take: 5 // Limit to 5 most recent donations
      });
      
      if (donations.length > 0) {
        console.log(`\nRecent donations for campaign ${campaign.id}:`);
        donations.forEach((donation, i) => {
          console.log(`  ${i+1}. ${donation.amount} ${donation.currency} from ${donation.donorAddress.substring(0, 10)}... (${donation.isAnonymous ? 'Anonymous' : 'Public'})`);
          console.log(`     Transaction: ${donation.transactionId}`);
          console.log(`     Date: ${donation.createdAt}`);
        });
      } else {
        console.log(`No donations found for this campaign in database.`);
      }
    }
    
    // 2. Try to get campaigns from blockchain
    console.log('\n=== BLOCKCHAIN CAMPAIGNS ===');
    try {
      // Use sui CLI to get registry object
      console.log(`Fetching registry object ${SUI_CONFIG.REGISTRY_ID} from blockchain...`);
      const registryCmd = `sui client object ${SUI_CONFIG.REGISTRY_ID} --json`;
      const registryResult = execSync(registryCmd).toString();
      const registry = JSON.parse(registryResult);
      
      if (registry && registry.data && registry.data.content) {
        const content = registry.data.content;
        if (content.fields && content.fields.campaigns) {
          const campaignIds = content.fields.campaigns;
          console.log(`Found ${campaignIds.length} campaign IDs in registry:`);
          
          // Print campaign IDs
          campaignIds.forEach((id, index) => {
            console.log(`${index+1}. ${id}`);
          });
          
          // Check if these campaigns exist in our database
          console.log('\nChecking if blockchain campaigns exist in database:');
          for (const campaignId of campaignIds) {
            const dbCampaign = dbCampaigns.find(c => c.id === campaignId);
            if (dbCampaign) {
              console.log(`✅ Campaign ${campaignId} exists in database as "${dbCampaign.name}"`);
            } else {
              console.log(`❌ Campaign ${campaignId} NOT found in database`);
            }
          }
          
          // Fetch details for first campaign as example
          if (campaignIds.length > 0) {
            const sampleCampaignId = campaignIds[0];
            console.log(`\nFetching details for sample campaign ${sampleCampaignId}...`);
            
            try {
              const campaignCmd = `sui client object ${sampleCampaignId} --json`;
              const campaignResult = execSync(campaignCmd).toString();
              const campaign = JSON.parse(campaignResult);
              
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
    } catch (error) {
      console.error(`Error accessing blockchain: ${error.message}`);
      console.log('Continuing with database inspection only...');
    }
    
    // 3. Check for discrepancies in campaign statistics
    console.log('\n=== CAMPAIGN STATISTICS VERIFICATION ===');
    for (const campaign of dbCampaigns) {
      // Count actual donations and sum amounts
      const donations = await prisma.donation.findMany({
        where: { campaignId: campaign.id }
      });
      
      let totalDonated = BigInt(0);
      donations.forEach(d => {
        totalDonated += BigInt(d.amount);
      });
      
      console.log(`\nCampaign: ${campaign.name} (${campaign.id})`);
      console.log(`Recorded donation count: ${campaign.backerCount}`);
      console.log(`Actual donation count: ${donations.length}`);
      console.log(`Recorded total amount: ${campaign.currentAmount}`);
      console.log(`Calculated total amount: ${totalDonated.toString()}`);
      
      if (campaign.backerCount !== donations.length || campaign.currentAmount !== totalDonated.toString()) {
        console.log('⚠️ DISCREPANCY DETECTED: Campaign stats don\'t match donation records');
        
        // Fix the discrepancy
        console.log('Fixing campaign statistics...');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            backerCount: donations.length,
            currentAmount: totalDonated.toString()
          }
        });
        console.log('Campaign statistics fixed.');
      } else {
        console.log('✅ Campaign stats match donation records');
      }
    }
    
  } catch (error) {
    console.error('Error inspecting campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the inspection
inspectCampaigns()
  .then(() => {
    console.log('\nCampaign inspection completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
