// Script to check database contents
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database contents...');
    
    // Check users table
    const users = await prisma.user.findMany({
      orderBy: {
        totalDonated: 'desc',
      },
    });
    
    console.log(`\n=== USERS (${users.length}) ===`);
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Address: ${user.address}`);
        console.log(`   Total Donated: ${user.totalDonated}`);
        console.log(`   Donation Count: ${user.donationCount}`);
        console.log(`   Display Name: ${user.displayName || 'N/A'}`);
        console.log('---');
      });
    } else {
      console.log('No users found in database.');
    }
    
    // Check donations table
    const donations = await prisma.donation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    
    console.log(`\n=== RECENT DONATIONS (${donations.length}) ===`);
    if (donations.length > 0) {
      donations.forEach((donation, index) => {
        console.log(`${index + 1}. Campaign: ${donation.campaignId}`);
        console.log(`   Donor: ${donation.donorAddress}`);
        console.log(`   Amount: ${donation.amount} ${donation.currency}`);
        console.log(`   Date: ${donation.createdAt}`);
        console.log(`   Anonymous: ${donation.isAnonymous}`);
        console.log('---');
      });
    } else {
      console.log('No donations found in database.');
    }
    
    // Check campaigns table
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    console.log(`\n=== RECENT CAMPAIGNS (${campaigns.length}) ===`);
    if (campaigns.length > 0) {
      campaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ID: ${campaign.id}`);
        console.log(`   Name: ${campaign.name}`);
        console.log(`   Goal: ${campaign.goalAmount}`);
        console.log(`   Current: ${campaign.currentAmount}`);
        console.log(`   Backers: ${campaign.backerCount}`);
        console.log('---');
      });
    } else {
      console.log('No campaigns found in database.');
    }
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkDatabase();
