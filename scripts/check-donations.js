// Script to check donations in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDonations() {
  try {
    console.log('Checking donations in the database...');
    
    // Get all donations
    const donations = await prisma.donation.findMany({
      include: {
        campaign: {
          select: {
            name: true,
            currentAmount: true
          }
        }
      }
    });
    
    console.log(`Found ${donations.length} donations in the database`);
    
    if (donations.length > 0) {
      console.log('\nDonation Details:');
      console.log('----------------');
      
      donations.forEach((donation, index) => {
        console.log(`\nDonation #${index + 1}:`);
        console.log(`ID: ${donation.id}`);
        console.log(`Campaign ID: ${donation.campaignId}`);
        console.log(`Campaign Name: ${donation.campaign?.name || 'Unknown'}`);
        console.log(`Donor Address: ${donation.donorAddress}`);
        console.log(`Amount: ${donation.amount} ${donation.currency}`);
        console.log(`Message: ${donation.message || 'No message'}`);
        console.log(`Anonymous: ${donation.isAnonymous ? 'Yes' : 'No'}`);
        console.log(`Transaction ID: ${donation.transactionId}`);
        console.log(`Created At: ${donation.createdAt}`);
      });
      
      // Group donations by campaign
      const donationsByCampaign = {};
      donations.forEach(donation => {
        if (!donationsByCampaign[donation.campaignId]) {
          donationsByCampaign[donation.campaignId] = {
            count: 0,
            totalAmount: BigInt(0)
          };
        }
        donationsByCampaign[donation.campaignId].count++;
        donationsByCampaign[donation.campaignId].totalAmount += BigInt(donation.amount);
      });
      
      console.log('\nDonations by Campaign:');
      console.log('--------------------');
      for (const [campaignId, data] of Object.entries(donationsByCampaign)) {
        console.log(`Campaign ${campaignId}: ${data.count} donations, total amount: ${data.totalAmount.toString()}`);
      }
      
      // Group donations by donor
      const donationsByDonor = {};
      donations.forEach(donation => {
        if (donation.isAnonymous) return;
        
        if (!donationsByDonor[donation.donorAddress]) {
          donationsByDonor[donation.donorAddress] = {
            count: 0,
            totalAmount: BigInt(0)
          };
        }
        donationsByDonor[donation.donorAddress].count++;
        donationsByDonor[donation.donorAddress].totalAmount += BigInt(donation.amount);
      });
      
      console.log('\nDonations by Donor:');
      console.log('-----------------');
      for (const [donorAddress, data] of Object.entries(donationsByDonor)) {
        console.log(`Donor ${donorAddress}: ${data.count} donations, total amount: ${data.totalAmount.toString()}`);
      }
    }
    
    // Check user stats to ensure they match donation records
    console.log('\nVerifying user statistics...');
    const users = await prisma.user.findMany({
      where: {
        donationCount: { gt: 0 }
      }
    });
    
    console.log(`Found ${users.length} users with donations`);
    
    if (users.length > 0) {
      for (const user of users) {
        // Count actual donations for this user
        const userDonations = await prisma.donation.findMany({
          where: {
            donorAddress: user.address,
            isAnonymous: false
          }
        });
        
        // Calculate total donated amount
        let totalDonated = BigInt(0);
        userDonations.forEach(d => {
          totalDonated += BigInt(d.amount);
        });
        
        console.log(`\nUser: ${user.address}`);
        console.log(`Recorded donation count: ${user.donationCount}`);
        console.log(`Actual donation count: ${userDonations.length}`);
        console.log(`Recorded total donated: ${user.totalDonated}`);
        console.log(`Calculated total donated: ${totalDonated.toString()}`);
        
        // Check for discrepancies
        if (user.donationCount !== userDonations.length || user.totalDonated !== totalDonated.toString()) {
          console.log('⚠️ DISCREPANCY DETECTED: User stats do not match donation records');
        } else {
          console.log('✅ User stats match donation records');
        }
      }
    }
    
    return donations;
  } catch (error) {
    console.error('Error checking donations:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDonations()
  .then(donations => {
    if (donations.length === 0) {
      console.log('\n❌ No donations found in the database');
      console.log('This could indicate that donations are not being saved properly');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
