const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateTOsgUSDOnly() {
  try {
    console.log('Starting migration to track only sgUSD donations...');
    
    // 1. Update all campaigns to only count sgUSD donations
    console.log('\n📊 Updating campaign totals to only include sgUSD donations...');
    const campaigns = await prisma.campaign.findMany();
    
    for (const campaign of campaigns) {
      // Get only sgUSD donations for this campaign
      const sgUsdDonations = await prisma.donation.findMany({
        where: {
          campaignId: campaign.id,
          currency: 'sgUSD'
        }
      });
      
      // Calculate total sgUSD amount
      let totalSgUsd = BigInt(0);
      for (const donation of sgUsdDonations) {
        totalSgUsd = totalSgUsd + BigInt(donation.amount);
      }
      
      // Update campaign with sgUSD-only total
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          currentAmount: totalSgUsd.toString()
        }
      });
      
      console.log(`✅ Updated ${campaign.name}: ${totalSgUsd.toString()} sgUSD (${sgUsdDonations.length} sgUSD donations)`);
    }
    
    // 2. Update all user totals to only count sgUSD donations
    console.log('\n👥 Updating user totals to only include sgUSD donations...');
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      // Get only sgUSD donations for this user
      const sgUsdDonations = await prisma.donation.findMany({
        where: {
          donorAddress: user.address,
          currency: 'sgUSD'
        }
      });
      
      // Calculate total sgUSD amount
      let totalSgUsd = BigInt(0);
      for (const donation of sgUsdDonations) {
        totalSgUsd = totalSgUsd + BigInt(donation.amount);
      }
      
      // Update user with sgUSD-only total
      await prisma.user.update({
        where: { address: user.address },
        data: {
          totalDonated: totalSgUsd.toString(),
          donationCount: sgUsdDonations.length
        }
      });
      
      const displayName = user.displayName || user.address.slice(0, 8) + '...';
      console.log(`✅ Updated ${displayName}: ${totalSgUsd.toString()} sgUSD (${sgUsdDonations.length} sgUSD donations)`);
    }
    
    // 3. Show summary of donation types
    console.log('\n📈 Donation Summary:');
    const suiDonations = await prisma.donation.count({
      where: { currency: 'SUI' }
    });
    const sgUsdDonations = await prisma.donation.count({
      where: { currency: 'sgUSD' }
    });
    const totalDonations = await prisma.donation.count();
    
    console.log(`Total donations: ${totalDonations}`);
    console.log(`SUI donations: ${suiDonations} (will NOT be counted in totals)`);
    console.log(`sgUSD donations: ${sgUsdDonations} (ONLY these count towards totals)`);
    
    console.log('\n✅ Migration complete! Platform now tracks only sgUSD donations.');
    console.log('Note: Individual SUI donations are still stored but do not count towards campaign goals or user totals.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  migrateTOsgUSDOnly();
}

module.exports = { migrateTOsgUSDOnly };