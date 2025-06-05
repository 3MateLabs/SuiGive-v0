import { NextRequest, NextResponse } from 'next/server';
import { saveDonation } from '@/lib/db';
import { SuiClient } from '@mysten/sui/client';
import { SUI_CONFIG } from '@/lib/sui-config';

// Initialize Sui client
const client = new SuiClient({ 
  url: SUI_CONFIG.NETWORK === 'mainnet' 
    ? 'https://fullnode.mainnet.sui.io' 
    : 'https://fullnode.testnet.sui.io'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionDigest } = body;
    
    if (!transactionDigest) {
      return NextResponse.json(
        { error: 'Transaction digest is required' },
        { status: 400 }
      );
    }
    
    console.log('Syncing donation from transaction:', transactionDigest);
    
    // Fetch transaction details from blockchain
    const txn = await client.getTransactionBlock({
      digest: transactionDigest,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true
      }
    });
    
    // Look for donation events in the transaction
    const donationEvent = txn.events?.find(event => 
      event.type.includes('crowdfunding::DonationReceived')
    );
    
    if (!donationEvent) {
      console.log('No donation event found in transaction');
      return NextResponse.json({ 
        success: false, 
        message: 'No donation event found' 
      });
    }
    
    // Extract donation details from event
    const { campaign_id, donor, amount, currency, message, is_anonymous } = donationEvent.parsedJson as any;
    
    // Save to database
    const donation = await saveDonation({
      campaignId: campaign_id,
      donorAddress: donor,
      amount: amount,
      currency: currency || 'sgUSD',
      message: message || '',
      isAnonymous: is_anonymous || false,
      transactionId: transactionDigest
    });
    
    console.log('Donation synced successfully:', donation.id);
    
    return NextResponse.json({ 
      success: true, 
      donation 
    });
    
  } catch (error) {
    console.error('Error syncing donation:', error);
    return NextResponse.json(
      { error: 'Failed to sync donation' },
      { status: 500 }
    );
  }
}