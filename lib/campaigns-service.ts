"use client";

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CONFIG } from './sui-config';

// Import RPC provider from @mysten/sui.js
import { JsonRpcProvider, Connection } from '@mysten/sui.js';

// Initialize Sui client with the configured network
const connection = new Connection({
  fullnode: SUI_CONFIG.FULLNODE_URL
});
const provider = new JsonRpcProvider(connection);

export interface Campaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  goalAmount: string; // Using string for large numbers
  currentAmount: string;
  deadline: string;
  category: string;
  creator: string;
  createdAt: string;
}

/**
 * Create a new crowdfunding campaign
 */
export async function createCampaign(
  wallet: any,
  name: string,
  description: string,
  imageUrl: string,
  goalAmount: number,
  deadline: number,
  category: string
) {
  try {
    const tx = new TransactionBlock();
    
    // Get the registry object
    const registry = tx.object(SUI_CONFIG.REGISTRY_ID);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_campaign`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.u64(goalAmount),
        tx.pure.u64(deadline),
        tx.pure.string(category),
        registry,
      ],
    });
    
    // Sign and execute the transaction using the wallet adapter
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
    
    return result;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
}

/**
 * Donate to a campaign
 */
export async function donate(
  wallet: any,
  campaignId: string,
  amount: number,
  isAnonymous: boolean = false
) {
  try {
    const tx = new TransactionBlock();
    
    // Get the campaign object
    const campaign = tx.object(campaignId);
    
    // Create a coin to donate
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        campaign,
        coin,
        tx.pure.bool(isAnonymous),
      ],
    });
    
    // Sign and execute the transaction using the wallet adapter
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
    
    return result;
  } catch (error) {
    console.error("Error donating to campaign:", error);
    throw error;
  }
}

/**
 * Withdraw funds from a campaign
 */
export async function withdrawFunds(
  wallet: any,
  campaignId: string,
  capabilityId: string
) {
  try {
    const tx = new TransactionBlock();
    
    // Get the campaign and capability objects
    const campaign = tx.object(campaignId);
    const capability = tx.object(capabilityId);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_funds`,
      arguments: [
        campaign,
        capability,
      ],
    });
    
    // Sign and execute the transaction using the wallet adapter
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
    
    return result;
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    throw error;
  }
}

/**
 * Get all campaigns from the registry
 */
export async function getAllCampaigns(): Promise<Campaign[]> {
  try {
    // First, get the registry object
    const registry = await provider.getObject({
      id: SUI_CONFIG.REGISTRY_ID,
      options: { showContent: true }
    });
    
    // Extract campaign IDs from registry
    const registryData = registry.data?.content as any;
    if (!registryData || !registryData.fields || !registryData.fields.campaigns) {
      return [];
    }
    
    // Access the campaigns table
    const campaignIds = registryData.fields.campaigns.fields?.items || [];
    
    if (campaignIds.length === 0) {
      return [];
    }
    
    // Fetch details for each campaign
    const campaigns = await Promise.all(
      campaignIds.map(async (id: string) => {
        try {
          const campaignObj = await provider.getObject({
            id,
            options: { showContent: true }
          });
          
          const campaignData = campaignObj.data?.content as any;
          if (!campaignData || !campaignData.fields) {
            return null;
          }
          
          return {
            id,
            name: campaignData.fields.name,
            description: campaignData.fields.description,
            imageUrl: campaignData.fields.image_url,
            goalAmount: campaignData.fields.goal_amount,
            currentAmount: campaignData.fields.current_amount,
            deadline: campaignData.fields.deadline,
            category: campaignData.fields.category,
            creator: campaignData.fields.creator,
            createdAt: campaignData.fields.created_at
          };
        } catch (error) {
          console.error(`Error fetching campaign ${id}:`, error);
          return null;
        }
      })
    );
    
    return campaigns.filter(Boolean) as Campaign[];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(campaignId: string): Promise<Campaign | null> {
  try {
    const campaign = await provider.getObject({
      id: campaignId,
      options: { showContent: true }
    });
    
    const campaignData = campaign.data?.content as any;
    if (!campaignData || !campaignData.fields) {
      return null;
    }
    
    return {
      id: campaignId,
      name: campaignData.fields.name,
      description: campaignData.fields.description,
      imageUrl: campaignData.fields.image_url,
      goalAmount: campaignData.fields.goal_amount,
      currentAmount: campaignData.fields.current_amount,
      deadline: campaignData.fields.deadline,
      category: campaignData.fields.category,
      creator: campaignData.fields.creator,
      createdAt: campaignData.fields.created_at
    };
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId}:`, error);
    return null;
  }
}

/**
 * Check if a campaign has reached its goal
 */
export async function isGoalReached(campaignId: string): Promise<boolean> {
  try {
    const campaign = await getCampaignDetails(campaignId);
    if (!campaign) return false;
    
    const currentAmount = BigInt(campaign.currentAmount);
    const goalAmount = BigInt(campaign.goalAmount);
    
    return currentAmount >= goalAmount;
  } catch (error) {
    console.error(`Error checking if goal reached for campaign ${campaignId}:`, error);
    return false;
  }
}
