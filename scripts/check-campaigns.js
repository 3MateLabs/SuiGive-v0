// Script to check existing campaigns
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCampaigns() {
  try {
    const campaigns = await prisma.campaign.findMany();
    console.log('Existing campaigns:', campaigns.length);
    
    if (campaigns.length > 0) {
      campaigns.forEach(c => console.log('Campaign ID:', c.id));
    } else {
      console.log('No campaigns found in database.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaigns();
