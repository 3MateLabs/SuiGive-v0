// Script to monitor donation process in real-time
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function monitorDonations() {
  console.log('Starting donation monitoring...');
  console.log('Press Ctrl+C to stop monitoring');
  
  // Initial state
  let lastDonationCount = 0;
  let lastCampaignUpdateTime = {};
  
  // Get initial donation count
  const initialDonations = await prisma.donation.count();
  console.log(`Initial donation count: ${initialDonations}`);
  
  // Get initial campaign update times
  const campaigns = await prisma.campaign.findMany({
    select: {
      id: true,
      name: true,
      updatedAt: true
    }
  });
  
  console.log(`Found ${campaigns.length} campaigns:`);
  campaigns.forEach(campaign => {
    console.log(`- ${campaign.name} (${campaign.id})`);
    lastCampaignUpdateTime[campaign.id] = campaign.updatedAt;
  });
  
  // Start monitoring loop
  const interval = setInterval(async () => {
    try {
      // Check for new donations
      const currentDonationCount = await prisma.donation.count();
      
      if (currentDonationCount > lastDonationCount) {
        console.log(`\n🔔 New donations detected! Count increased from ${lastDonationCount} to ${currentDonationCount}`);
        
        // Get the latest donations
        const newDonations = await prisma.donation.findMany({
          orderBy: {
            createdAt: 'desc'
          },
          take: currentDonationCount - lastDonationCount,
          include: {
            campaign: {
              select: {
                name: true
              }
            }
          }
        });
        
        console.log('New donations:');
        newDonations.forEach(donation => {
          console.log(`- ${donation.amount} ${donation.currency} to ${donation.campaign?.name || 'Unknown'} (${donation.campaignId})`);
          console.log(`  From: ${donation.donorAddress}`);
          console.log(`  Transaction: ${donation.transactionId}`);
          console.log(`  Time: ${donation.createdAt}`);
        });
        
        lastDonationCount = currentDonationCount;
      }
      
      // Check for campaign updates
      const updatedCampaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          currentAmount: true,
          backerCount: true,
          updatedAt: true
        }
      });
      
      updatedCampaigns.forEach(campaign => {
        if (!lastCampaignUpdateTime[campaign.id] || 
            campaign.updatedAt > lastCampaignUpdateTime[campaign.id]) {
          console.log(`\n📊 Campaign updated: ${campaign.name} (${campaign.id})`);
          console.log(`  Current amount: ${campaign.currentAmount} (${parseInt(campaign.currentAmount) / 1_000_000_000} SUI)`);
          console.log(`  Backer count: ${campaign.backerCount}`);
          console.log(`  Updated at: ${campaign.updatedAt}`);
          
          lastCampaignUpdateTime[campaign.id] = campaign.updatedAt;
        }
      });
      
      // Print a heartbeat every 5 seconds
      process.stdout.write('.');
      
    } catch (error) {
      console.error('Error monitoring donations:', error);
    }
  }, 1000); // Check every second
  
  // Handle script termination
  process.on('SIGINT', async () => {
    clearInterval(interval);
    console.log('\nStopping donation monitoring...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Run the monitoring
monitorDonations()
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
