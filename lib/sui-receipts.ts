"use client";

import { SUI_CONFIG } from './sui-config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { executeDappKitTransaction } from './dapp-kit-adapter';

// Define donation receipt interface
export interface DonationReceipt {
  id: string;
  campaignId: string;
  donor: string;
  amount: string;
  timestamp: string;
  message: string;
  isAnonymous: boolean;
  // Display properties for wallet visibility
  name?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
}

/**
 * Get all donation receipts for a user
 */
export async function getUserDonationReceipts(
  client: SuiClient, 
  userAddress: string
): Promise<DonationReceipt[]> {
  try {
    // Query objects owned by the user that are donation receipts
    const objects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${SUI_CONFIG.PACKAGE_ID}::donation_receipt::DonationReceipt`
      },
      options: { showContent: true }
    });

    // Map the objects to our interface
    const receipts = objects.data
      .filter(obj => obj.data && obj.data.content)
      .map(obj => {
        const content = obj.data!.content as any;
        
        // Use the IPFS-hosted image for all donation NFTs
        const campaignId = content.fields.campaign_id;
        const amount = content.fields.amount;
        const timestamp = content.fields.timestamp;
        const imageUrl = 'https://ipfs.io/ipfs/bafkreiap7rugqtnfnw5nlui4aavtrj6zrqbxzzanq44sxnztktm3kzdufi'; // IPFS-hosted image
        
        return {
          id: obj.data!.objectId,
          campaignId: content.fields.campaign_id,
          donor: content.fields.donor,
          amount: content.fields.amount,
          timestamp: content.fields.timestamp,
          message: content.fields.message,
          isAnonymous: content.fields.is_anonymous,
          // Display properties for wallet visibility
          name: content.fields.name || 'SuiGive Donation Receipt',
          description: content.fields.description || `Donation of ${amount} SUI to campaign ${campaignId}`,
          url: content.fields.url || '',
          imageUrl: imageUrl
        };
      });

    return receipts;
  } catch (error) {
    console.error("Error fetching user donation receipts:", error);
    return [];
  }
}

/**
 * Get donation receipt details
 */
export async function getDonationReceiptDetails(
  client: SuiClient, 
  receiptId: string
): Promise<DonationReceipt | null> {
  try {
    const receipt = await client.getObject({
      id: receiptId,
      options: { showContent: true }
    });
    
    const receiptData = receipt.data?.content as any;
    if (!receiptData || !receiptData.fields) {
      return null;
    }
    
    return {
      id: receiptId,
      campaignId: receiptData.fields.campaign_id,
      donor: receiptData.fields.donor,
      amount: receiptData.fields.amount,
      timestamp: receiptData.fields.timestamp,
      message: receiptData.fields.message,
      isAnonymous: receiptData.fields.is_anonymous
    };
  } catch (error) {
    console.error('Error fetching donation receipt details:', error);
    return null;
  }
}

/**
 * Get all donation receipts for a campaign
 */
export async function getCampaignDonationReceipts(
  client: SuiClient, 
  campaignId: string
): Promise<DonationReceipt[]> {
  try {
    // This is a simplified approach. In a production environment,
    // you would need to implement a more sophisticated query mechanism
    // such as indexing events or using a dynamic field query if available
    
    // For now, we'll use events to find donation receipts for a campaign
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${SUI_CONFIG.PACKAGE_ID}::donation_receipt::DonationReceiptCreated`
      },
      limit: 50 // Adjust as needed
    });
    
    // Filter events for the specific campaign
    const campaignEvents = events.data.filter(event => {
      const parsedJson = event.parsedJson as any;
      return parsedJson && parsedJson.campaign_id === campaignId;
    });
    
    // Map events to receipt objects
    // Note: This only gives us the event data, not the actual objects
    // In a real implementation, you'd want to fetch the actual objects
    const receipts = campaignEvents.map(event => {
      const parsedJson = event.parsedJson as any;
      return {
        id: parsedJson.receipt_id,
        campaignId: parsedJson.campaign_id,
        donor: parsedJson.donor,
        amount: parsedJson.amount,
        timestamp: parsedJson.timestamp,
        message: parsedJson.message || '',
        isAnonymous: parsedJson.is_anonymous
      };
    });
    
    return receipts;
  } catch (error) {
    console.error("Error fetching campaign donation receipts:", error);
    return [];
  }
}
