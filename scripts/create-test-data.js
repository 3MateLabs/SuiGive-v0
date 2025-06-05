const { PrismaClient } = require('@prisma/client');

// Since lib/db.ts is TypeScript, we'll implement the functions directly here
async function saveCampaign(campaign) {
  const deadlineDate = new Date(campaign.deadline);
  const createdAtDate = new Date(campaign.createdAt);
  
  return await prisma.campaign.upsert({
    where: { id: campaign.id },
    update: {
      name: campaign.name,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      goalAmount: campaign.goalAmount,
      creator: campaign.creator,
      deadline: deadlineDate,
      category: campaign.category,
      updatedAt: new Date(),
    },
    create: {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      goalAmount: campaign.goalAmount,
      creator: campaign.creator,
      deadline: deadlineDate,
      category: campaign.category,
      createdAt: createdAtDate,
      currentAmount: '0',
      backerCount: 0,
    },
  });
}

async function saveDonation(donation) {
  return await prisma.$transaction(async (prismaClient) => {
    // Create the donation record
    const newDonation = await prismaClient.donation.create({
      data: {
        campaignId: donation.campaignId,
        donorAddress: donation.donorAddress,
        amount: donation.amount,
        currency: donation.currency,
        message: donation.message || '',
        isAnonymous: donation.isAnonymous,
        transactionId: donation.transactionId,
      },
    });

    // Update campaign statistics
    const campaign = await prismaClient.campaign.findUnique({
      where: { id: donation.campaignId },
      select: { currentAmount: true, backerCount: true },
    });

    if (campaign) {
      const newAmount = BigInt(campaign.currentAmount || '0') + BigInt(donation.amount);
      
      // Check if this donor has already donated to this campaign
      const previousDonations = await prismaClient.donation.findMany({
        where: {
          campaignId: donation.campaignId,
          donorAddress: donation.donorAddress,
          id: { not: newDonation.id },
        },
      });
      
      const backerCountIncrement = previousDonations.length === 0 ? 1 : 0;
      
      await prismaClient.campaign.update({
        where: { id: donation.campaignId },
        data: {
          currentAmount: newAmount.toString(),
          backerCount: campaign.backerCount + backerCountIncrement,
        },
      });
    }

    // Update user statistics (if not anonymous)
    if (!donation.isAnonymous) {
      const user = await prismaClient.user.findUnique({
        where: { address: donation.donorAddress },
        select: { totalDonated: true, donationCount: true, firstDonation: true },
      });

      if (user) {
        const newTotal = BigInt(user.totalDonated || '0') + BigInt(donation.amount);
        const now = new Date();
        
        await prismaClient.user.update({
          where: { address: donation.donorAddress },
          data: {
            totalDonated: newTotal.toString(),
            donationCount: { increment: 1 },
            firstDonation: user.firstDonation || now,
            lastDonation: now,
          },
        });
      } else {
        // Create user if doesn't exist
        const now = new Date();
        await prismaClient.user.create({
          data: {
            address: donation.donorAddress,
            totalDonated: donation.amount,
            donationCount: 1,
            firstDonation: now,
            lastDonation: now,
          },
        });
      }
    }

    return newDonation;
  });
}

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test campaign and donations...');
    
    // First, create the campaign creator user
    await prisma.user.upsert({
      where: { address: '0xtest_creator_address' },
      update: {
        displayName: 'Campaign Creator',
        bio: 'Creating campaigns for good causes'
      },
      create: {
        address: '0xtest_creator_address',
        displayName: 'Campaign Creator',
        bio: 'Creating campaigns for good causes',
        totalDonated: '0',
        donationCount: 0
      }
    });
    console.log('✅ Campaign creator user created');
    
    // Create a test campaign
    const testCampaign = {
      id: '0xtest_campaign_123',
      name: 'Test Clean Water Project',
      description: 'Providing clean water access to rural communities. This is a test campaign to verify database integration.',
      imageUrl: 'https://via.placeholder.com/600x400?text=Clean+Water+Project',
      goalAmount: '10000000000', // 10 SUI in MIST
      creator: '0xtest_creator_address',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      category: 'Health',
      createdAt: new Date().toISOString()
    };
    
    const campaign = await saveCampaign(testCampaign);
    console.log('✅ Test campaign created:', campaign.name);
    
    // Create test donor users first
    const testDonorUsers = [
      {
        address: '0xtest_donor_1',
        displayName: 'Alice Supporter',
        bio: 'Passionate about clean water initiatives'
      },
      {
        address: '0xtest_donor_2',
        displayName: 'Bob Philanthropist',
        bio: 'Supporting communities worldwide'
      },
      {
        address: '0xtest_donor_3',
        displayName: 'Anonymous Donor',
        bio: 'Supporting causes anonymously'
      }
    ];
    
    for (const user of testDonorUsers) {
      await prisma.user.upsert({
        where: { address: user.address },
        update: user,
        create: {
          ...user,
          totalDonated: '0',
          donationCount: 0
        }
      });
    }
    console.log('✅ Test donor users created');
    
    // Create test donations
    const testDonations = [
      {
        campaignId: testCampaign.id,
        donorAddress: '0xtest_donor_1',
        amount: '2000000000', // 2 SUI
        currency: 'SUI',
        message: 'Great cause! Keep up the good work.',
        isAnonymous: false,
        transactionId: '0xtest_tx_1'
      },
      {
        campaignId: testCampaign.id,
        donorAddress: '0xtest_donor_2',
        amount: '1500000000', // 1.5 SUI
        currency: 'SUI',
        message: 'Happy to support this project.',
        isAnonymous: false,
        transactionId: '0xtest_tx_2'
      },
      {
        campaignId: testCampaign.id,
        donorAddress: '0xtest_donor_3',
        amount: '3000000000', // 3 SUI
        currency: 'SUI',
        message: '',
        isAnonymous: true,
        transactionId: '0xtest_tx_3'
      }
    ];
    
    for (const donation of testDonations) {
      const result = await saveDonation(donation);
      console.log(`✅ Test donation created: ${donation.amount} MIST from ${donation.donorAddress}`);
    }
    
    console.log('✅ Test donations and user statistics updated');
    
    // Verify the data was created correctly
    console.log('\n📊 Test Data Summary:');
    const campaigns = await prisma.campaign.count();
    const donations = await prisma.donation.count();
    const users = await prisma.user.count();
    
    console.log(`Campaigns: ${campaigns}`);
    console.log(`Donations: ${donations}`);
    console.log(`Users: ${users}`);
    
    // Show campaign with updated stats
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: testCampaign.id },
      include: {
        donations: {
          include: {
            donor: {
              select: {
                displayName: true,
                address: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n📈 Campaign Statistics:');
    console.log(`Current Amount: ${updatedCampaign.currentAmount} MIST (${parseFloat(updatedCampaign.currentAmount) / 1000000000} SUI)`);
    console.log(`Goal Amount: ${updatedCampaign.goalAmount} MIST (${parseFloat(updatedCampaign.goalAmount) / 1000000000} SUI)`);
    console.log(`Backer Count: ${updatedCampaign.backerCount}`);
    console.log(`Total Donations: ${updatedCampaign.donations.length}`);
    
    console.log('\n✅ Test data created successfully! Database integration is working.');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };