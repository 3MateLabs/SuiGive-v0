const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSgUSDDonation() {
  try {
    console.log('Creating test sgUSD donation...');
    
    // Create a test sgUSD donation
    const testDonation = {
      campaignId: '0xtest_campaign_123',
      donorAddress: '0xtest_donor_1', // Alice
      amount: '5000000000', // 5 sgUSD
      currency: 'sgUSD',
      message: 'Testing sgUSD donation tracking',
      isAnonymous: false,
      transactionId: '0xtest_sgusd_tx_1'
    };
    
    // Use the saveDonation function from db.ts
    await prisma.$transaction(async (tx) => {
      // Create the donation
      const donation = await tx.donation.create({
        data: testDonation
      });
      
      // Update campaign amount (only sgUSD counts)
      const campaign = await tx.campaign.findUnique({
        where: { id: testDonation.campaignId }
      });
      
      if (campaign) {
        const newAmount = BigInt(campaign.currentAmount) + BigInt(testDonation.amount);
        await tx.campaign.update({
          where: { id: testDonation.campaignId },
          data: { currentAmount: newAmount.toString() }
        });
      }
      
      // Update user stats (only sgUSD counts)
      const user = await tx.user.findUnique({
        where: { address: testDonation.donorAddress }
      });
      
      if (user) {
        const newTotal = BigInt(user.totalDonated) + BigInt(testDonation.amount);
        await tx.user.update({
          where: { address: testDonation.donorAddress },
          data: {
            totalDonated: newTotal.toString(),
            donationCount: user.donationCount + 1
          }
        });
      }
      
      console.log('✅ sgUSD donation created successfully');
    });
    
    // Verify the results
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: '0xtest_campaign_123' }
    });
    
    const updatedUser = await prisma.user.findUnique({
      where: { address: '0xtest_donor_1' }
    });
    
    console.log('\n📊 Updated Statistics:');
    console.log(`Campaign current amount: ${updatedCampaign.currentAmount} (${parseFloat(updatedCampaign.currentAmount) / 1000000000} sgUSD)`);
    console.log(`Campaign goal: ${updatedCampaign.goalAmount} (${parseFloat(updatedCampaign.goalAmount) / 1000000000} sgUSD)`);
    console.log(`Progress: ${(parseFloat(updatedCampaign.currentAmount) / parseFloat(updatedCampaign.goalAmount) * 100).toFixed(1)}%`);
    console.log(`\nUser total donated: ${updatedUser.totalDonated} (${parseFloat(updatedUser.totalDonated) / 1000000000} sgUSD)`);
    console.log(`User donation count: ${updatedUser.donationCount}`);
    
  } catch (error) {
    console.error('❌ Error creating test sgUSD donation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testSgUSDDonation();
}

module.exports = { testSgUSDDonation };