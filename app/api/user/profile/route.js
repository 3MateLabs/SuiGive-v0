/**
 * User Profile API
 * 
 * This API provides endpoints for managing user profiles in the SuiGive platform.
 * It allows fetching, updating, and managing user profiles linked to wallet addresses.
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Import the donation importer functions
let updateUserStats;
try {
  const donationImporter = require(path.join(process.cwd(), 'scripts/donation-importer.js'));
  updateUserStats = donationImporter.updateUserStats;
} catch (error) {
  console.error('Error importing donation-importer:', error);
}

const prisma = new PrismaClient();

/**
 * GET handler - Fetch user profile by wallet address
 */
export async function GET(request) {
  try {
    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }
    
    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        // Include donation count but not actual donations for privacy
        _count: {
          select: { donations: true }
        },
        // Include campaigns created by this user
        createdCampaigns: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            currentAmount: true,
            goalAmount: true,
            backerCount: true,
            category: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // If user profile is private, return limited data
    if (user.isPrivate) {
      return NextResponse.json({
        address: user.address,
        displayName: user.displayName || 'Anonymous',
        profileImage: user.profileImage,
        isPrivate: true
      });
    }
    
    // Prepare response data
    const userData = {
      address: user.address,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bio: user.bio,
      totalDonated: user.totalDonated,
      donationCount: user._count.donations,
      firstDonation: user.firstDonation,
      lastDonation: user.lastDonation,
      createdCampaigns: user.createdCampaigns,
      badges: user.badges ? JSON.parse(user.badges) : [],
      isPrivate: user.isPrivate
    };
    
    // Add optional fields based on privacy settings
    if (user.showEmail && user.email) {
      userData.email = user.email;
    }
    
    if (user.showSocial) {
      if (user.website) userData.website = user.website;
      if (user.twitter) userData.twitter = user.twitter;
      if (user.discord) userData.discord = user.discord;
    }
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

/**
 * POST handler - Create or update user profile
 */
export async function POST(request) {
  try {
    // Get profile data from request body
    const data = await request.json();
    const { address, ...profileData } = data;
    
    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }
    
    // Update user profile
    const success = await updateUserStats(address, profileData);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }
    
    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { address }
    });
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
