import { NextRequest, NextResponse } from 'next/server';
import { getCampaignDonations, getUserDonations, saveDonation } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { campaignId, donorAddress, amount, currency, transactionId } = body;
    
    if (!campaignId || !donorAddress || !amount || !currency || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, donorAddress, amount, currency, transactionId' },
        { status: 400 }
      );
    }
    
    // Save the donation to database
    const donation = await saveDonation({
      campaignId,
      donorAddress,
      amount,
      currency,
      message: body.message || '',
      isAnonymous: body.isAnonymous || false,
      transactionId
    });
    
    console.log('Donation saved to database:', {
      id: donation.id,
      campaignId,
      amount,
      currency,
      transactionId
    });
    
    return NextResponse.json({ 
      success: true, 
      donation 
    });
    
  } catch (error) {
    console.error('Error saving donation:', error);
    return NextResponse.json(
      { error: 'Failed to save donation' },
      { status: 500 }
    );
  }
}
