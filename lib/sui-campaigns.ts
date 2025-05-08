"use client";

import { SUI_CONFIG } from './sui-config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { executeDappKitTransaction } from './dapp-kit-adapter';

// Simple request limiter to prevent too many concurrent requests
class RequestLimiter {
  private queue: Array<() => Promise<void>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processNext();
        }
      });

      this.processNext();
    });
  }

  private processNext(): void {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// Create a global request limiter
const requestLimiter = new RequestLimiter(2);

// Define campaign interface
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
  category: string,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
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
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
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
  isAnonymous: boolean = false,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
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
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
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
  capabilityId: string,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
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
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    return result;
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    throw error;
  }
}

/**
 * Get all campaigns from the registry
 */
export async function getAllCampaigns(client: SuiClient): Promise<Campaign[]> {
  // Use the request limiter to prevent too many concurrent requests
  return requestLimiter.add(async () => {
  if (!client) {
    console.error('SuiClient is not initialized');
    throw new Error('SuiClient is not initialized');
  }

  // Validate registry ID
  if (!SUI_CONFIG.REGISTRY_ID) {
    console.error('Registry ID is not configured');
    throw new Error('Registry ID is not configured');
  }

  // Retry configuration
  const maxRetries = 3;
  const retryDelay = 3000; // 3 seconds
  const initialBackoff = 1000; // 1 second
  
  let lastError: Error | null = null;
  
  // Retry loop
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Calculate exponential backoff delay if this is a retry
      if (attempt > 0) {
        const backoffTime = initialBackoff * Math.pow(2, attempt - 1);
        console.log(`Applying exponential backoff: waiting ${backoffTime/1000} seconds before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }

      console.log(`Fetching registry object (attempt ${attempt + 1}/${maxRetries}):`, SUI_CONFIG.REGISTRY_ID);
      
      // First, get the registry object with timeout
      const fetchRegistryPromise = client.getObject({
        id: SUI_CONFIG.REGISTRY_ID,
        options: { showContent: true }
      });
      
      // Add timeout to the fetch operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Registry fetch timeout')), 20000); // 20 seconds timeout
      });
    
      // Race between fetch and timeout
      const registry = await Promise.race([fetchRegistryPromise, timeoutPromise]) as any;
    
    // Extract campaign IDs from registry
    const registryData = registry.data?.content as any;
    if (!registryData || !registryData.fields || !registryData.fields.campaigns) {
      console.warn('Registry data structure is not as expected:', registryData);
      return [];
    }
    
    // Access the campaigns table
    const campaignIds = registryData.fields.campaigns.fields?.items || [];
    console.log(`Found ${campaignIds.length} campaigns in registry`);
    
    if (campaignIds.length === 0) {
      return [];
    }
    
    // Fetch details for each campaign with concurrency limit
    const concurrencyLimit = 5; // Process 5 campaigns at a time to avoid rate limits
    const results: Campaign[] = [];
    
    // Process campaigns in batches
    for (let i = 0; i < campaignIds.length; i += concurrencyLimit) {
      const batch = campaignIds.slice(i, i + concurrencyLimit);
      
      const batchResults = await Promise.all(
        batch.map(async (id: string) => {
          try {
            console.log(`Fetching campaign ${id}`);
            const campaignObj = await client.getObject({
              id,
              options: { showContent: true }
            });
            
            const campaignData = campaignObj.data?.content as any;
            if (!campaignData || !campaignData.fields) {
              console.warn(`Campaign ${id} data structure is not as expected`);
              return null;
            }
            
            return {
              id,
              name: campaignData.fields.name || 'Unnamed Campaign',
              description: campaignData.fields.description || 'No description provided',
              imageUrl: campaignData.fields.image_url || '',
              goalAmount: campaignData.fields.goal_amount || '0',
              currentAmount: campaignData.fields.current_amount || '0',
              deadline: campaignData.fields.deadline || '0',
              category: campaignData.fields.category || 'Uncategorized',
              creator: campaignData.fields.creator || 'Unknown',
              createdAt: campaignData.fields.created_at || Date.now().toString()
            };
          } catch (error) {
            console.error(`Error fetching campaign ${id}:`, error);
            return null;
          }
        })
      );
      
      // Add valid campaigns from this batch to results
      results.push(...batchResults.filter(Boolean) as Campaign[]);
      
      // Small delay between batches to avoid rate limiting
      if (i + concurrencyLimit < campaignIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
      console.log(`Successfully fetched ${results.length} campaigns`);
      return results;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || 'Unknown error';
      console.error(`Error fetching campaigns (attempt ${attempt + 1}/${maxRetries}):`, errorMessage);
      
      // No need to wait here as we're already using exponential backoff at the beginning of the loop
      // Just log the error and continue to the next iteration
      if (attempt < maxRetries - 1) {
        console.log(`Will retry with exponential backoff...`);
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  const errorMessage = lastError?.message || 'Unknown error';
  const errorDetails = {
    message: errorMessage,
    stack: lastError?.stack,
    name: lastError?.name,
    registryId: SUI_CONFIG.REGISTRY_ID
  };
  console.error('All retry attempts failed. Error details:', errorDetails);
  throw new Error(`Failed to fetch campaigns after ${maxRetries} attempts: ${errorMessage}`);
  });
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(client: SuiClient, campaignId: string): Promise<Campaign | null> {
  // Use the request limiter to prevent too many concurrent requests
  return requestLimiter.add(async () => {
  try {
    const campaign = await client.getObject({
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
    console.error('Error fetching campaign details:', error);
    return null;
  }
  });
}

/**
 * Check if a campaign has reached its goal
 */
export async function isGoalReached(client: SuiClient, campaignId: string): Promise<boolean> {
  try {
    const campaign = await getCampaignDetails(client, campaignId);
    if (!campaign) return false;
    
    const currentAmount = BigInt(campaign.currentAmount);
    const goalAmount = BigInt(campaign.goalAmount);
    
    return currentAmount >= goalAmount;
  } catch (error) {
    console.error(`Error checking if goal reached for campaign ${campaignId}:`, error);
    return false;
  }
}
