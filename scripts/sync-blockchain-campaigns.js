// Script to sync blockchain campaigns with the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const fs = require('fs');
const path = require('path');

// Read SUI_CONFIG directly from the file
const suiConfigPath = path.join(__dirname, '../lib/sui-config.ts');
const suiConfigContent = fs.readFileSync(suiConfigPath, 'utf8');

// Extract the configuration values using regex
const PACKAGE_ID_MATCH = suiConfigContent.match(/PACKAGE_ID:\s*['"]([\\\/\w]+)['"]/);
const REGISTRY_ID_MATCH = suiConfigContent.match(/REGISTRY_ID:\s*['"]([\\\/\w]+)['"]/);

const SUI_CONFIG = {
  PACKAGE_ID: PACKAGE_ID_MATCH ? PACKAGE_ID_MATCH[1] : '',
  REGISTRY_ID: REGISTRY_ID_MATCH ? REGISTRY_ID_MATCH[1] : '',
};

async function syncBlockchainCampaigns() {
  try {
    console.log('Syncing blockchain campaigns with database...');
    console.log(`Package ID: ${SUI_CONFIG.PACKAGE_ID}`);
    console.log(`Registry ID: ${SUI_CONFIG.REGISTRY_ID}`);
    
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    // Get all campaign creation events
    console.log('\nFetching campaign creation events...');
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::CampaignCreated`
      },
      limit: 50
    });
    
    console.log(`Found ${events.data.length} campaign creation events.`);
    
    // Extract campaign IDs and details
    const blockchainCampaigns = [];
    for (const event of events.data) {
      const parsedJson = event.parsedJson;
      if (parsedJson && parsedJson.campaign_id) {
        // Get more details from the campaign object
        try {
          const campaignObject = await client.getObject({
            id: parsedJson.campaign_id,
            options: { showContent: true }
          });
          
          let goalAmount = '0';
          let currentAmount = '0';
          let backerCount = 0;
          
          if (campaignObject.data && campaignObject.data.content && campaignObject.data.content.fields) {
            const fields = campaignObject.data.content.fields;
            goalAmount = fields.goal_amount || '0';
            currentAmount = fields.current_amount || '0';
            backerCount = parseInt(fields.backer_count || '0');
          }
          
          blockchainCampaigns.push({
            id: parsedJson.campaign_id,
            name: parsedJson.name || 'Unknown Campaign',
            description: parsedJson.description || '',
            imageUrl: parsedJson.image_url || '',
            goalAmount: goalAmount,
            currentAmount: currentAmount,
            creator: parsedJson.creator || '',
            deadline: new Date(Number(parsedJson.deadline) * 1000).toISOString(),
            category: parsedJson.category || 'Other',
            backerCount: backerCount,
            createdAt: new Date(Number(event.timestampMs)).toISOString()
          });
        } catch (error) {
          console.error(`Error fetching details for campaign ${parsedJson.campaign_id}:`, error);
        }
      }
    }
    
    console.log(`\nProcessed ${blockchainCampaigns.length} blockchain campaigns.`);
    
    // Get all campaigns from database
    const dbCampaigns = await prisma.campaign.findMany();
    console.log(`Found ${dbCampaigns.length} campaigns in database.`);
    
    // Find campaigns that exist on blockchain but not in database
    const dbCampaignIds = dbCampaigns.map(c => c.id);
    const missingCampaigns = blockchainCampaigns.filter(c => !dbCampaignIds.includes(c.id));
    
    console.log(`\nFound ${missingCampaigns.length} campaigns missing from database.`);
    
    // Create missing campaigns in database
    if (missingCampaigns.length > 0) {
      console.log('\nCreating missing campaigns in database:');
      
      for (const campaign of missingCampaigns) {
        try {
          await prisma.campaign.create({
            data: {
              id: campaign.id,
              name: campaign.name,
              description: campaign.description,
              imageUrl: campaign.imageUrl,
              goalAmount: campaign.goalAmount,
              currentAmount: campaign.currentAmount,
              creator: campaign.creator,
              deadline: new Date(campaign.deadline),
              category: campaign.category,
              backerCount: campaign.backerCount,
              createdAt: new Date(campaign.createdAt)
            }
          });
          
          console.log(`✅ Created campaign "${campaign.name}" (${campaign.id}) in database.`);
        } catch (error) {
          console.error(`❌ Error creating campaign ${campaign.id}:`, error);
        }
      }
    }
    
    // Update existing campaigns with blockchain data
    const existingCampaigns = blockchainCampaigns.filter(c => dbCampaignIds.includes(c.id));
    
    if (existingCampaigns.length > 0) {
      console.log('\nUpdating existing campaigns in database:');
      
      for (const campaign of existingCampaigns) {
        try {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              name: campaign.name,
              description: campaign.description,
              imageUrl: campaign.imageUrl,
              goalAmount: campaign.goalAmount,
              currentAmount: campaign.currentAmount,
              backerCount: campaign.backerCount
            }
          });
          
          console.log(`✅ Updated campaign "${campaign.name}" (${campaign.id}) in database.`);
        } catch (error) {
          console.error(`❌ Error updating campaign ${campaign.id}:`, error);
        }
      }
    }
    
    // Find campaigns in database that don't exist on blockchain
    const blockchainCampaignIds = blockchainCampaigns.map(c => c.id);
    const invalidCampaigns = dbCampaigns.filter(c => !blockchainCampaignIds.includes(c.id));
    
    if (invalidCampaigns.length > 0) {
      console.log('\nWARNING: Found campaigns in database that do not exist on blockchain:');
      
      for (const campaign of invalidCampaigns) {
        console.log(`- "${campaign.name}" (${campaign.id})`);
        
        // Count donations to this invalid campaign
        const donationCount = await prisma.donation.count({
          where: { campaignId: campaign.id }
        });
        
        console.log(`  This campaign has ${donationCount} donations in the database.`);
      }
    }
    
    console.log('\nSync complete.');
  } catch (error) {
    console.error('Error syncing blockchain campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync function
syncBlockchainCampaigns()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
