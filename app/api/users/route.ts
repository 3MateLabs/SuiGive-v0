import { NextRequest, NextResponse } from 'next/server';
import { prisma, getUserStats, getTopDonors } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const top = searchParams.get('top');
    
    // Get top donors
    if (top) {
      const limit = parseInt(top) || 10;
      const topDonors = await getTopDonors(limit);
      return NextResponse.json({ users: topDonors });
    }
    
    // Get specific user with their donation history
    if (address) {
      const [user, donations] = await Promise.all([
        getUserStats(address),
        prisma.donation.findMany({
          where: { donorAddress: address },
          orderBy: { createdAt: 'desc' },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: true,
              }
            }
          }
        })
      ]);
      
      if (!user) {
        return NextResponse.json({ 
          user: { 
            address,
            totalDonated: "0",
            donationCount: 0
          }, 
          donations: [] 
        });
      }
      
      return NextResponse.json({ user, donations });
    }
    
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
