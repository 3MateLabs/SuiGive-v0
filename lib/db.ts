import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Campaign database functions
export async function saveCampaign(campaign: {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  goalAmount: string;
  creator: string;
  deadline: string;
  category: string;
  createdAt: string;
}) {
  try {
    // Convert deadline string to Date object
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
  } catch (error) {
    console.error('Error saving campaign to database:', error);
    throw error;
  }
}

// Donation database functions
export async function saveDonation(donation: {
  campaignId: string;
  donorAddress: string;
  amount: string;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  transactionId: string;
}) {
  try {
    console.log('Saving donation to database:', {
      campaignId: donation.campaignId,
      donorAddress: donation.donorAddress,
      amount: donation.amount,
      currency: donation.currency,
      isAnonymous: donation.isAnonymous,
      transactionId: donation.transactionId
    });
    
    // First check if this transaction has already been processed
    const existingDonation = await prisma.donation.findFirst({
      where: { 
        transactionId: donation.transactionId,
        // Only consider blockchain transactions (non-test transactions)
        AND: {
          transactionId: {
            startsWith: '0x'
          }
        }
      }
    });
    
    if (existingDonation) {
      console.log(`Transaction ${donation.transactionId} has already been processed. Skipping.`);
      return existingDonation;
    }
    
    // Start a transaction to ensure data consistency
    return await prisma.$transaction(async (prismaClient) => {
      // 0. Verify prerequisites exist
      console.log('Verifying campaign and user exist in database');
      
      // Check if campaign exists
      const existingCampaign = await prismaClient.campaign.findUnique({
        where: { id: donation.campaignId },
      });
      
      if (!existingCampaign) {
        console.warn(`Campaign ${donation.campaignId} not found in database, creating placeholder`);
        
        // Try to fetch campaign data from blockchain before creating placeholder
        try {
          // This would be replaced with actual blockchain query in production
          console.log(`Attempting to fetch campaign ${donation.campaignId} data from blockchain`);
          
          // Create a placeholder campaign with blockchain data if possible
          await prismaClient.campaign.create({
            data: {
              id: donation.campaignId,
              name: `Campaign ${donation.campaignId.substring(0, 8)}`,
              description: 'Imported from blockchain',
              imageUrl: 'https://placehold.co/600x400?text=Campaign',
              goalAmount: '10000000000', // 10 SUI
              currentAmount: '0',
              creator: donation.donorAddress,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              category: 'Other',
              backerCount: 0,
            },
          });
          console.log(`Created placeholder campaign ${donation.campaignId}`);
        } catch (error) {
          console.error(`Failed to create campaign ${donation.campaignId}:`, error);
          throw new Error(`Campaign ${donation.campaignId} does not exist and could not be created`);
        }
      }
      
      // Check if user exists (for non-anonymous donations)
      if (!donation.isAnonymous) {
        const existingUser = await prismaClient.user.findUnique({
          where: { address: donation.donorAddress },
        });
        
        if (!existingUser) {
          console.warn(`User ${donation.donorAddress} not found in database, creating new user`);
          const now = new Date();
          // Create the user if they don't exist
          await prismaClient.user.create({
            data: {
              address: donation.donorAddress,
              totalDonated: '0', // Will be updated below
              donationCount: 0,  // Will be updated below
              firstDonation: now,
              lastDonation: now,
            },
          });
          console.log(`Created new user ${donation.donorAddress}`);
        }
      }
      
      // 1. Create the donation record
      console.log('Creating donation record');
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
      console.log(`Created donation record with ID: ${newDonation.id}`);

      // 2. Update campaign statistics
      console.log('Updating campaign statistics');
      const campaign = await prismaClient.campaign.findUnique({
        where: { id: donation.campaignId },
        select: { currentAmount: true, backerCount: true },
      });

      if (campaign) {
        // Only count sgUSD donations towards the campaign total
        let newAmount = BigInt(campaign.currentAmount || '0');
        if (donation.currency === 'sgUSD') {
          newAmount = newAmount + BigInt(donation.amount);
        }
        
        // Check if this donor has already donated to this campaign
        const previousDonations = await prismaClient.donation.findMany({
          where: {
            campaignId: donation.campaignId,
            donorAddress: donation.donorAddress,
            id: { not: newDonation.id }, // Exclude the donation we just created
          },
        });
        
        // Only increment backer count if this is the first donation from this donor
        const backerCountIncrement = previousDonations.length === 0 ? 1 : 0;
        
        await prismaClient.campaign.update({
          where: { id: donation.campaignId },
          data: {
            currentAmount: newAmount.toString(),
            backerCount: campaign.backerCount + backerCountIncrement,
          },
        });
        console.log(`Updated campaign statistics: currentAmount=${newAmount.toString()} (sgUSD only), backerCount=${campaign.backerCount + backerCountIncrement}`);
      }

      // 3. Update user statistics (if not anonymous)
      if (!donation.isAnonymous) {
        console.log('Updating user statistics');
        const user = await prismaClient.user.findUnique({
          where: { address: donation.donorAddress },
          select: { totalDonated: true, donationCount: true, firstDonation: true },
        });

        if (user) {
          // Only count sgUSD donations towards user total
          let newTotal = BigInt(user.totalDonated || '0');
          if (donation.currency === 'sgUSD') {
            newTotal = newTotal + BigInt(donation.amount);
          }
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
          console.log(`Updated user statistics: totalDonated=${newTotal.toString()}, donationCount=${(user.donationCount || 0) + 1}`);
        }
      }

      console.log('Donation transaction completed successfully');
      return newDonation;
    });
  } catch (error) {
    console.error('Error saving donation:', error);
    // Log more detailed error information
    if (error && typeof error === 'object' && 'code' in error) {
      console.error(`Database error code: ${(error as any).code}`);
      if ('meta' in error && (error as any).meta) {
        console.error('Error metadata:', (error as any).meta);
      }
    }
    throw error;
  }
}

// Query functions
export async function getCampaignDonations(campaignId: string) {
  try {
    return await prisma.donation.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: {
            address: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    throw error;
  }
}

export async function getUserDonations(userAddress: string) {
  try {
    return await prisma.donation.findMany({
      where: { donorAddress: userAddress },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    throw error;
  }
}

export async function getUserStats(userAddress: string) {
  try {
    return await prisma.user.findUnique({
      where: { address: userAddress },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

// Function to get top donors
export async function getTopDonors(limit: number = 10) {
  try {
    // First log to debug database connection
    console.log('Fetching top donors from database...');
    
    const users = await prisma.user.findMany({
      orderBy: {
        // Sort by total donated amount instead of count
        totalDonated: 'desc',
      },
      take: limit,
      select: {
        address: true,
        displayName: true,
        profileImage: true,
        totalDonated: true,
        donationCount: true,
      },
    });
    
    console.log(`Found ${users.length} users in database`);
    return users;
  } catch (error) {
    console.error('Error fetching top donors:', error);
    throw error;
  }
}

// Function to get campaigns with the most donations
export async function getTopCampaigns(limit: number = 10) {
  try {
    return await prisma.campaign.findMany({
      orderBy: {
        backerCount: 'desc',
      },
      take: limit,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        currentAmount: true,
        goalAmount: true,
        backerCount: true,
        category: true,
      },
    });
  } catch (error) {
    console.error('Error fetching top campaigns:', error);
    throw error;
  }
}
