// Script to check recent donations in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentDonations() {
  try {
    console.log('Checking recent donations in the database...');
    
    // Get the 10 most recent donations
    const recentDonations = await prisma.donation.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        campaign: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${recentDonations.length} recent donations.`);
    
    if (recentDonations.length > 0) {
      console.log('\nRecent donations:');
      recentDonations.forEach((donation, index) => {
        console.log(`\n${index + 1}. Donation ID: ${donation.id}`);
        console.log(`   Campaign: ${donation.campaign?.name || 'Unknown'} (${donation.campaignId})`);
        console.log(`   From: ${donation.donorAddress}`);
        console.log(`   Amount: ${donation.amount} ${donation.currency}`);
        console.log(`   Transaction ID: ${donation.transactionId}`);
        console.log(`   Created At: ${donation.createdAt}`);
        console.log(`   Anonymous: ${donation.isAnonymous}`);
        if (donation.message) console.log(`   Message: ${donation.message}`);
      });
    }
    
    // Check user statistics
    console.log('\nChecking user statistics...');
    const users = await prisma.user.findMany({
      orderBy: {
        lastDonation: 'desc'
      },
      take: 5
    });
    
    console.log(`Found ${users.length} users.`);
    
    if (users.length > 0) {
      console.log('\nRecent user activity:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User: ${user.address}`);
        console.log(`   Total Donated: ${user.totalDonated} (${parseInt(user.totalDonated) / 1_000_000_000} SUI)`);
        console.log(`   Donation Count: ${user.donationCount}`);
        console.log(`   First Donation: ${user.firstDonation}`);
        console.log(`   Last Donation: ${user.lastDonation}`);
      });
    }
    
    // Check campaign statistics for recently updated campaigns
    console.log('\nChecking campaign statistics...');
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });
    
    console.log(`Found ${campaigns.length} recently updated campaigns.`);
    
    if (campaigns.length > 0) {
      console.log('\nRecent campaign activity:');
      campaigns.forEach((campaign, index) => {
        console.log(`\n${index + 1}. Campaign: ${campaign.name} (${campaign.id})`);
        console.log(`   Current Amount: ${campaign.currentAmount} (${parseInt(campaign.currentAmount) / 1_000_000_000} SUI)`);
        console.log(`   Goal Amount: ${campaign.goalAmount} (${parseInt(campaign.goalAmount) / 1_000_000_000} SUI)`);
        console.log(`   Backer Count: ${campaign.backerCount}`);
        console.log(`   Updated At: ${campaign.updatedAt}`);
      });
    }
    
    console.log('\nCheck complete.');
  } catch (error) {
    console.error('Error checking recent donations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRecentDonations()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
