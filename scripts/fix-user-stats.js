// Script to fix user statistics to match actual donation records
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserStats() {
  try {
    console.log('Fixing user statistics...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in database.`);
    
    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user: ${user.address}`);
      
      // Get all non-anonymous donations for this user
      const userDonations = await prisma.donation.findMany({
        where: {
          donorAddress: user.address,
          isAnonymous: false
        }
      });
      
      console.log(`Found ${userDonations.length} donations for this user.`);
      
      // Calculate total donated amount
      let totalDonated = BigInt(0);
      userDonations.forEach(donation => {
        totalDonated += BigInt(donation.amount);
      });
      
      // Get first and last donation dates
      let firstDonation = null;
      let lastDonation = null;
      
      if (userDonations.length > 0) {
        // Sort donations by date
        const sortedDonations = [...userDonations].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        firstDonation = sortedDonations[0].createdAt;
        lastDonation = sortedDonations[sortedDonations.length - 1].createdAt;
      }
      
      // Update user statistics
      await prisma.user.update({
        where: { address: user.address },
        data: {
          donationCount: userDonations.length,
          totalDonated: totalDonated.toString(),
          ...(firstDonation && { firstDonation }),
          ...(lastDonation && { lastDonation })
        }
      });
      
      console.log(`Updated user statistics:`);
      console.log(`- Donation count: ${userDonations.length}`);
      console.log(`- Total donated: ${totalDonated.toString()}`);
      if (firstDonation) console.log(`- First donation: ${firstDonation}`);
      if (lastDonation) console.log(`- Last donation: ${lastDonation}`);
    }
    
    console.log('\nUser statistics fixed successfully.');
  } catch (error) {
    console.error('Error fixing user statistics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixUserStats()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
