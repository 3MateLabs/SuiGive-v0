import { NextRequest, NextResponse } from 'next/server';
import { getCampaignDonations, getUserDonations } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');
    const userAddress = searchParams.get('userAddress');

    // Validate that at least one parameter is provided
    if (!campaignId && !userAddress) {
      return NextResponse.json(
        { error: 'Either campaignId or userAddress parameter is required' },
        { status: 400 }
      );
    }

    // Get donations by campaign ID
    if (campaignId) {
      const donations = await getCampaignDonations(campaignId);
      return NextResponse.json({ donations });
    }

    // Get donations by user address
    if (userAddress) {
      const donations = await getUserDonations(userAddress);
      return NextResponse.json({ donations });
    }
  } catch (error) {
    console.error('Error in donations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
