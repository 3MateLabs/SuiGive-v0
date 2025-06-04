import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTopCampaigns } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const top = searchParams.get('top');
    
    // Get a specific campaign with its donation history
    if (id) {
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          donations: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Limit to most recent 10 donations
            select: {
              id: true,
              amount: true,
              currency: true,
              message: true,
              isAnonymous: true,
              createdAt: true,
              donorAddress: true,
              donor: {
                select: {
                  displayName: true,
                  profileImage: true,
                }
              }
            }
          }
        }
      });
      
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      
      return NextResponse.json({ campaign });
    }
    
    // Get top campaigns
    if (top) {
      const limit = parseInt(top) || 10;
      const topCampaigns = await getTopCampaigns(limit);
      return NextResponse.json({ campaigns: topCampaigns });
    }
    
    // Get campaigns by category
    if (category) {
      const campaigns = await prisma.campaign.findMany({
        where: { category },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          goalAmount: true,
          currentAmount: true,
          backerCount: true,
          deadline: true,
          category: true,
          creator: true,
        }
      });
      
      return NextResponse.json({ campaigns });
    }
    
    // Get all campaigns (with pagination)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          goalAmount: true,
          currentAmount: true,
          backerCount: true,
          deadline: true,
          category: true,
          creator: true,
        }
      }),
      prisma.campaign.count()
    ]);
    
    return NextResponse.json({
      campaigns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in campaigns API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
