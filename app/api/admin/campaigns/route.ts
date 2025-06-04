import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all campaigns
export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Fetching all campaigns');
    
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Admin API: Found ${campaigns.length} campaigns`);
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Admin API Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST to create a test campaign
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Admin API: Creating test campaign:', data);
    
    // Validate required fields
    if (!data.id || !data.name || !data.goalAmount || !data.creator) {
      return NextResponse.json(
        { error: 'ID, name, goalAmount, and creator are required' },
        { status: 400 }
      );
    }
    
    // Create or update campaign
    const campaign = await prisma.campaign.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        description: data.description || 'Test campaign description',
        imageUrl: data.imageUrl || 'https://placehold.co/600x400?text=Test+Campaign',
        goalAmount: data.goalAmount,
        currentAmount: data.currentAmount || '0',
        creator: data.creator,
        deadline: data.deadline ? new Date(data.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: data.category || 'Test',
        backerCount: data.backerCount || 0,
        updatedAt: new Date(),
      },
      create: {
        id: data.id,
        name: data.name,
        description: data.description || 'Test campaign description',
        imageUrl: data.imageUrl || 'https://placehold.co/600x400?text=Test+Campaign',
        goalAmount: data.goalAmount,
        currentAmount: data.currentAmount || '0',
        creator: data.creator,
        deadline: data.deadline ? new Date(data.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: data.category || 'Test',
        backerCount: data.backerCount || 0,
      },
    });
    
    console.log('Admin API: Campaign created/updated successfully:', campaign.id);
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Admin API Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
