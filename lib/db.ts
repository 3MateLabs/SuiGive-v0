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
      isAnonymous: donation.isAnonymous
    });
    
    // Start a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Create the donation record
      const newDonation = await tx.donation.create({
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

      // 2. Update campaign statistics
      const campaign = await tx.campaign.findUnique({
        where: { id: donation.campaignId },
        select: { currentAmount: true, backerCount: true },
      });

      if (campaign) {
        // Update campaign amount and backer count
        const newAmount = (BigInt(campaign.currentAmount) + BigInt(donation.amount)).toString();
        await tx.campaign.update({
          where: { id: donation.campaignId },
          data: {
            currentAmount: newAmount,
            backerCount: campaign.backerCount + 1,
          },
        });
      }

      // 3. Update user statistics if not anonymous
      if (!donation.isAnonymous) {
        const user = await tx.user.findUnique({
          where: { address: donation.donorAddress },
        });

        const now = new Date();

        if (user) {
          // Update existing user
          const newTotal = (BigInt(user.totalDonated) + BigInt(donation.amount)).toString();
          await tx.user.update({
            where: { address: donation.donorAddress },
            data: {
              totalDonated: newTotal,
              donationCount: user.donationCount + 1,
              lastDonation: now,
            },
          });
        } else {
          // Create new user
          await tx.user.create({
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
  } catch (error) {
    console.error('Error saving donation to database:', error);
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
