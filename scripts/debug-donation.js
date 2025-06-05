// Script to debug donation flow and fix database issues
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDonationFlow() {
  try {
    console.log('Debugging donation flow...');
    
    // 1. Check database connection
    console.log('Checking database connection...');
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. Found ${userCount} users.`);
    
    // 2. Check for campaigns
    const campaigns = await prisma.campaign.findMany();
    console.log(`Found ${campaigns.length} campaigns in database.`);
    
    if (campaigns.length > 0) {
      console.log('\nCampaign Details:');
      campaigns.forEach(campaign => {
        console.log(`- ID: ${campaign.id}`);
        console.log(`  Name: ${campaign.name}`);
        console.log(`  Current Amount: ${campaign.currentAmount}`);
        console.log(`  Backer Count: ${campaign.backerCount}`);
      });
    }
    
    // 3. Check for donations
    const donations = await prisma.donation.findMany({
      include: {
        campaign: {
          select: { name: true }
        }
      }
    });
    console.log(`\nFound ${donations.length} donations in database.`);
    
    // 4. Check for users
    const users = await prisma.user.findMany();
    console.log(`\nFound ${users.length} users in database.`);
    
    if (users.length > 0) {
      console.log('\nUser Details:');
      users.forEach(user => {
        console.log(`- Address: ${user.address}`);
        console.log(`  Total Donated: ${user.totalDonated}`);
        console.log(`  Donation Count: ${user.donationCount}`);
      });
    }
    
    // 5. Check for discrepancies between user stats and donations
    console.log('\nChecking for discrepancies...');
    for (const user of users) {
      const userDonations = await prisma.donation.findMany({
        where: {
          donorAddress: user.address,
          isAnonymous: false
        }
      });
      
      let calculatedTotal = BigInt(0);
      userDonations.forEach(d => {
        calculatedTotal += BigInt(d.amount);
      });
      
      if (user.donationCount !== userDonations.length || user.totalDonated !== calculatedTotal.toString()) {
        console.log(`\nDiscrepancy found for user ${user.address}:`);
        console.log(`Recorded donation count: ${user.donationCount}`);
        console.log(`Actual donation count: ${userDonations.length}`);
        console.log(`Recorded total donated: ${user.totalDonated}`);
        console.log(`Calculated total donated: ${calculatedTotal.toString()}`);
        
        // Fix the discrepancy
        console.log('Fixing user statistics...');
        await prisma.user.update({
          where: { address: user.address },
          data: {
            donationCount: userDonations.length,
            totalDonated: calculatedTotal.toString()
          }
        });
        console.log('User statistics fixed.');
      }
    }
    
    // 6. Check for donations without corresponding users
    const orphanedDonations = await prisma.donation.findMany({
      where: {
        isAnonymous: false
      },
      include: {
        user: true
      }
    });
    
    const missingUserDonations = orphanedDonations.filter(d => !d.user);
    
    if (missingUserDonations.length > 0) {
      console.log(`\nFound ${missingUserDonations.length} donations without corresponding users.`);
      console.log('Creating missing users...');
      
      for (const donation of missingUserDonations) {
        const now = new Date();
        await prisma.user.create({
          data: {
            address: donation.donorAddress,
            totalDonated: donation.amount,
            donationCount: 1,
            firstDonation: now,
            lastDonation: now
          }
        });
        console.log(`Created user for address: ${donation.donorAddress}`);
      }
    }
    
    console.log('\nDebugging complete.');
  } catch (error) {
    console.error('Error debugging donation flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug function
debugDonationFlow()
  .then(() => {
    console.log('Debug script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
