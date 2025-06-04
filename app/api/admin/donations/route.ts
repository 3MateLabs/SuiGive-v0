import { NextRequest, NextResponse } from 'next/server';
import { prisma, saveDonation } from '@/lib/db';

// GET all donations
export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Fetching all donations');
    
    const donations = await prisma.donation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to most recent 50
    });
    
    console.log(`Admin API: Found ${donations.length} donations`);
    return NextResponse.json({ donations });
  } catch (error) {
    console.error('Admin API Error fetching donations:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}

// POST to create a test donation
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Admin API: Creating test donation:', data);
    
    // Validate required fields
    if (!data.campaignId || !data.donorAddress || !data.amount) {
      return NextResponse.json(
        { error: 'Campaign ID, donor address, and amount are required' },
        { status: 400 }
      );
    }
    
    // Check if campaign exists, create if not
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });
    
    if (!campaign) {
      // Create a placeholder campaign if it doesn't exist
      await prisma.campaign.create({
        data: {
          id: data.campaignId,
          name: `Test Campaign ${data.campaignId.substring(0, 8)}`,
          description: 'Automatically created test campaign',
          imageUrl: 'https://placehold.co/600x400?text=Test+Campaign',
          goalAmount: '10000000000', // 10 SUI
          currentAmount: '0',
          creator: data.donorAddress,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          category: 'Test',
          backerCount: 0,
        },
      });
      console.log('Admin API: Created placeholder campaign:', data.campaignId);
    }
    
    // Use the existing saveDonation function to ensure consistent logic
    const donation = await saveDonation({
      campaignId: data.campaignId,
      donorAddress: data.donorAddress,
      amount: data.amount,
      currency: data.currency || 'SUI',
      message: data.message || '',
      isAnonymous: data.isAnonymous || false,
      transactionId: data.transactionId || `test-${Date.now()}`,
    });
    
    console.log('Admin API: Donation created successfully');
    return NextResponse.json({ donation });
  } catch (error) {
    console.error('Admin API Error creating donation:', error);
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 });
  }
}
