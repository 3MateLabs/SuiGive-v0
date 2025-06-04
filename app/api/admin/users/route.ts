import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all users
export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Fetching all users');
    
    const users = await prisma.user.findMany({
      orderBy: {
        totalDonated: 'desc',
      },
    });
    
    console.log(`Admin API: Found ${users.length} users`);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin API Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST to create a test user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Admin API: Creating test user:', data);
    
    // Validate required fields
    if (!data.address || !data.totalDonated) {
      return NextResponse.json(
        { error: 'Address and totalDonated are required' },
        { status: 400 }
      );
    }
    
    // Create or update user
    const user = await prisma.user.upsert({
      where: { address: data.address },
      update: {
        displayName: data.displayName || null,
        totalDonated: data.totalDonated,
        donationCount: data.donationCount || 1,
        lastDonation: new Date(),
      },
      create: {
        address: data.address,
        displayName: data.displayName || null,
        totalDonated: data.totalDonated,
        donationCount: data.donationCount || 1,
        firstDonation: new Date(),
        lastDonation: new Date(),
      },
    });
    
    console.log('Admin API: User created/updated successfully:', user.address);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin API Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
