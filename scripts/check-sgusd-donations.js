// Script to check for sgUSD donations in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSgUSDDonations() {
  try {
    console.log('Checking for sgUSD donations in the database...');
    
    // Get all donations with currency sgUSD
    const sgUSDDonations = await prisma.donation.findMany({
      where: {
        currency: 'sgUSD'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        campaign: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${sgUSDDonations.length} sgUSD donations.`);
    
    if (sgUSDDonations.length > 0) {
      console.log('\nsgUSD donations:');
      sgUSDDonations.forEach((donation, index) => {
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
    
    // Check all donations in the last hour
    console.log('\nChecking for recent donations (last hour)...');
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentDonations = await prisma.donation.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        campaign: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${recentDonations.length} donations in the last hour.`);
    
    if (recentDonations.length > 0) {
      console.log('\nRecent donations (last hour):');
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
    
    // Check for any non-test transaction IDs
    console.log('\nChecking for real blockchain transactions...');
    const realTransactions = await prisma.donation.findMany({
      where: {
        NOT: {
          transactionId: {
            startsWith: 'test-'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        campaign: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${realTransactions.length} donations with real blockchain transaction IDs.`);
    
    if (realTransactions.length > 0) {
      console.log('\nDonations with real transaction IDs:');
      realTransactions.forEach((donation, index) => {
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
    
    // Check for donations to real blockchain campaigns (not the test campaign)
    console.log('\nChecking for donations to real blockchain campaigns...');
    const realCampaignDonations = await prisma.donation.findMany({
      where: {
        NOT: {
          campaignId: 'sacasc'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        campaign: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${realCampaignDonations.length} donations to real blockchain campaigns.`);
    
    if (realCampaignDonations.length > 0) {
      console.log('\nDonations to real blockchain campaigns:');
      realCampaignDonations.forEach((donation, index) => {
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
    
    console.log('\nCheck complete.');
  } catch (error) {
    console.error('Error checking sgUSD donations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSgUSDDonations()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
