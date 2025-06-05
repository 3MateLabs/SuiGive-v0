/**
 * Donation Importer Utility
 * 
 * This utility provides functions for importing donations from blockchain data
 * into the database and updating related statistics.
 */

import { PrismaClient } from '@prisma/client';

// Create a Prisma client instance
const prisma = new PrismaClient();

/**
 * Import a donation from blockchain data into the database
 * This is a JavaScript wrapper for the TypeScript saveDonation function
 * @param {Object} donationData - Donation data from blockchain
 * @param {Object} profileData - Optional user profile data to update
 */
async function importDonation(donationData, profileData = {}) {
  try {
    console.log(`Importing donation: ${donationData.transactionId}`);
    
    // First check if this donation already exists
    const existingDonation = await prisma.donation.findFirst({
      where: { transactionId: donationData.transactionId }
    });
    
    if (existingDonation) {
      console.log(`Donation ${donationData.transactionId} already exists in database, skipping`);
      return false;
    }
    
    // Check if campaign exists, create it if not
    const campaign = await prisma.campaign.findUnique({
      where: { id: donationData.campaignId }
    });
    
    if (!campaign) {
      console.log(`Campaign ${donationData.campaignId} not found in database, skipping donation import`);
      return false;
    }
    
    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        campaignId: donationData.campaignId,
        donorAddress: donationData.donorAddress,
        amount: donationData.amount,
        currency: donationData.currency || 'SUI',
        message: donationData.message || '',
        isAnonymous: donationData.isAnonymous || false,
        transactionId: donationData.transactionId,
      }
    });
    
    console.log(`Created donation record: ${donation.id}`);
    
    // Update campaign statistics
    await updateCampaignStats(donationData.campaignId);
    
    // Always update user profile in database, even for anonymous donations
    // This ensures we track all user activity while respecting display preferences
    await updateUserStats(donationData.donorAddress, profileData);
    
    return true;
  } catch (error) {
    console.error(`Error importing donation:`, error);
    return false;
  }
}

/**
 * Update campaign statistics based on donation records
 */
async function updateCampaignStats(campaignId) {
  try {
    // Get all donations for this campaign
    const donations = await prisma.donation.findMany({
      where: { campaignId }
    });
    
    // Calculate total amount
    let totalAmount = BigInt(0);
    for (const donation of donations) {
      totalAmount += BigInt(donation.amount);
    }
    
    // Get unique donor count
    const uniqueDonors = new Set(donations.map(d => d.donorAddress)).size;
    
    // Update campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        currentAmount: totalAmount.toString(),
        backerCount: uniqueDonors
      }
    });
    
    console.log(`Updated stats for campaign ${campaignId}: amount=${totalAmount.toString()}, backers=${uniqueDonors}`);
  } catch (error) {
    console.error(`Error updating campaign stats for ${campaignId}:`, error);
  }
}

/**
 * Update user statistics based on donation records
 * @param {string} userAddress - The wallet address of the user
 * @param {Object} profileData - Optional profile data to update
 */
async function updateUserStats(userAddress, profileData = {}) {
  try {
    // Get all donations for this user
    const donations = await prisma.donation.findMany({
      where: { donorAddress: userAddress }
    });
    
    // Calculate total amount
    let totalAmount = BigInt(0);
    for (const donation of donations) {
      totalAmount += BigInt(donation.amount);
    }
    
    // Find first and last donation dates
    let firstDonation = null;
    let lastDonation = null;
    
    if (donations.length > 0) {
      // Sort donations by date
      const sortedDonations = [...donations].sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      
      firstDonation = sortedDonations[0].createdAt;
      lastDonation = sortedDonations[sortedDonations.length - 1].createdAt;
    }
    
    // Get campaigns created by this user
    const createdCampaigns = await prisma.campaign.findMany({
      where: { creator: userAddress }
    });
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { address: userAddress }
    });
    
    // Prepare badges based on activity
    const badges = [];
    if (donations.length >= 10) badges.push('frequent_donor');
    if (totalAmount >= BigInt(100000000)) badges.push('generous_donor'); // 100 SUI
    if (createdCampaigns.length > 0) badges.push('campaign_creator');
    
    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { address: userAddress },
        data: {
          totalDonated: totalAmount.toString(),
          donationCount: donations.length,
          firstDonation: firstDonation || existingUser.firstDonation,
          lastDonation: lastDonation || existingUser.lastDonation,
          // Update profile fields if provided
          ...(profileData.displayName && { displayName: profileData.displayName }),
          ...(profileData.profileImage && { profileImage: profileData.profileImage }),
          ...(profileData.bio && { bio: profileData.bio }),
          ...(profileData.email && { email: profileData.email }),
          ...(profileData.website && { website: profileData.website }),
          ...(profileData.twitter && { twitter: profileData.twitter }),
          ...(profileData.discord && { discord: profileData.discord }),
          // Update badges if we have new ones
          ...(badges.length > 0 && { badges: JSON.stringify([...badges]) })
        }
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          address: userAddress,
          totalDonated: totalAmount.toString(),
          donationCount: donations.length,
          firstDonation: firstDonation || new Date(),
          lastDonation: lastDonation || new Date(),
          // Add any profile data provided
          ...profileData,
          // Add badges if earned
          ...(badges.length > 0 && { badges: JSON.stringify(badges) })
        }
      });
    }
    
    console.log(`Updated stats for user ${userAddress}: amount=${totalAmount.toString()}, count=${donations.length}`);
    return true;
  } catch (error) {
    console.error(`Error updating user stats for ${userAddress}:`, error);
    return false;
  }
}

// Export functions for use in ES modules
export {
  importDonation,
  updateCampaignStats,
  updateUserStats
};
