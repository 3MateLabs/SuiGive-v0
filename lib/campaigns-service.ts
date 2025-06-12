"use client";

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from './sui-config';

// Import RPC provider from @mysten/sui
import { SuiClient } from '@mysten/sui/client';
import { executeTransaction } from './wallet-adapter';

// Initialize Sui client with the configured network
const provider = new SuiClient({
  url: SUI_CONFIG.FULLNODE_URL
});

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
    const tx = new Transaction();
    
    // Get the registry object
    const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_campaign`,
      typeArguments: ['0x2::sui::SUI'],
      arguments: [
        campaignManager,
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.string(category),
        tx.pure.u64(goalAmount),
        tx.pure.u64(deadline),
        tx.splitCoins(tx.gas, [0]), // creation fee coin
      ],
    });
    
    // Sign and execute the transaction using the wallet adapter
    const result = await wallet.signAndExecuteTransaction({
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
    const tx = new Transaction();
    
    // Get the campaign object
    const campaign = tx.object(campaignId);
    
    // Create a coin to donate
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate`,
      typeArguments: ['0x2::sui::SUI'],
      arguments: [
        campaign,
        coin,
        tx.pure.vector('u8', []), // Empty message as vector<u8>
        tx.pure.bool(isAnonymous),
      ],
    });
    
    // Sign and execute the transaction using the wallet adapter
    const result = await wallet.signAndExecuteTransaction({
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
    const tx = new Transaction();
    
    // Get the campaign and capability objects
    const campaign = tx.object(campaignId);
    const capability = tx.object(capabilityId);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_remaining`,
      arguments: [
        campaign,
        capability,
      ],
    });
    
    // Sign and execute the transaction using the wallet adapter
    const result = await wallet.signAndExecuteTransaction({
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
