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
        registry,
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.u64(goalAmount),
        tx.pure.u64(deadline),
        tx.pure.string(category),
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
 * Donate to a campaign using SUI tokens
 */
export async function donate(
  wallet: any,
  campaignId: string,
  amount: number,
  message: string = '',
  isAnonymous: boolean = false,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    // Get the campaign object
    const campaign = tx.object(campaignId);
    
    // Get the treasury cap object
    const treasuryCap = tx.object(SUI_CONFIG.TREASURY_CAP_ID);
    
    // Get the SgSuiTreasury object
    const treasury = tx.object(SUI_CONFIG.TREASURY_ID);
    
    // Create a coin to donate
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        campaign,
        coin,
        tx.pure.string(message),
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
 * Donate to a campaign using sgUSD tokens
 */
export async function donateSgUSD(
  wallet: any,
  campaignId: string,
  coinObjectId: string,
  amount: number,
  message: string = '',
  isAnonymous: boolean = false,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    // Get the campaign object
    const campaign = tx.object(campaignId);
    
    // Get the sgUSD coin object
    const sgUSDCoin = tx.object(coinObjectId);
    
    // Set explicit gas budget to avoid automatic budget determination issues
    tx.setGasBudget(10000000);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate_sgusd`,
      arguments: [
        campaign,
        sgUSDCoin,
        tx.pure.string(message),
        tx.pure.bool(isAnonymous),
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    return result;
  } catch (error) {
    console.error("Error donating with sgUSD to campaign:", error);
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
 * Distribute funds from a campaign to a service provider using sgSUI tokens
 */
export async function distributeCampaignFunds(
  wallet: any,
  campaignId: string,
  ownerCapId: string,
  amount: number,
  serviceProviderAddress: string,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    // Get the campaign and owner capability objects
    const campaign = tx.object(campaignId);
    const ownerCap = tx.object(ownerCapId);
    
    // Get the SgSuiTreasury and SgSuiMinterCap objects
    const treasury = tx.object(SUI_CONFIG.TREASURY_ID);
    const minterCap = tx.object(SUI_CONFIG.SGSUI_MINTER_CAP_ID);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::distribute_funds`,
      arguments: [
        campaign,
        ownerCap,
        treasury,
        minterCap,
        tx.pure.u64(amount),
        tx.pure.address(serviceProviderAddress),
      ],
    });
    
    // Set explicit gas budget to avoid automatic budget determination issues
    tx.setGasBudget(10000000);
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    return result;
  } catch (error) {
    console.error("Error distributing campaign funds:", error);
    throw error;
  }
}

/**
 * Initialize the Registry object
 * This should be called once after contract deployment
 */
export async function initializeRegistry(
  wallet: any,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::init`,
      arguments: [],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    // Extract the registry ID from the transaction result
    // You'll need to parse the transaction result to find the created Registry object
    // This is a simplified example - you may need to adjust based on actual transaction response
    const registryId = extractRegistryIdFromResult(result);
    
    console.log('Registry initialized with ID:', registryId);
    return registryId;
  } catch (error) {
    console.error("Error initializing registry:", error);
    throw error;
  }
}

/**
 * Helper function to extract the Registry ID from transaction result
 */
function extractRegistryIdFromResult(result: any): string {
  try {
    // Look for created objects of type Registry
    const createdObjects = result.effects?.created || [];
    const registryObject = createdObjects.find((obj: any) => 
      obj.type && obj.type.includes('::crowdfunding::Registry')
    );
    
    if (registryObject && registryObject.reference) {
      return registryObject.reference.objectId;
    }
    
    throw new Error('Registry object not found in transaction result');
  } catch (error) {
    console.error('Error extracting Registry ID:', error);
    throw error;
  }
}

/**
 * Process a refund for a donation
 */
export async function processRefund(
  wallet: any,
  campaignId: string,
  receiptId: string,
  capabilityId: string,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    // Get the campaign, receipt, and capability objects
    const campaign = tx.object(campaignId);
    const receipt = tx.object(receiptId);
    const capability = tx.object(capabilityId);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::process_refund`,
      arguments: [
        campaign,
        receipt,
        capability,
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    return result;
  } catch (error) {
    console.error("Error processing refund:", error);
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
          options: { showContent: true, showDisplay: true, showOwner: true }
        });
        
        // Add timeout to the fetch operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Registry fetch timeout')), 20000); // 20 seconds timeout
        });
      
        // Race between fetch and timeout
        const registry = await Promise.race([fetchRegistryPromise, timeoutPromise]) as any;
        
        console.log('Registry response:', JSON.stringify(registry, null, 2));
      
        // Extract campaign IDs from registry - handle different potential structures
        const registryData = registry.data?.content as any;
        if (!registryData) {
          console.warn('Registry data not found:', registry);
          return [];
        }

        // Try to extract campaigns from registry
        let campaignIds: string[] = [];
        
        // Check for different data structures
        if (registryData.fields.campaigns && Array.isArray(registryData.fields.campaigns)) {
          campaignIds = registryData.fields.campaigns;
        } else if (registryData.fields.campaigns?.fields?.items && Array.isArray(registryData.fields.campaigns.fields.items)) {
          campaignIds = registryData.fields.campaigns.fields.items;
        } else if (registryData.fields.campaigns?.fields?.contents && typeof registryData.fields.campaigns.fields.contents === 'object') {
          // Handle table structure where campaigns are stored as key-value pairs
          const contents = registryData.fields.campaigns.fields.contents;
          campaignIds = Object.keys(contents);
        } else {
          // Try to find any array field that might contain campaign IDs
          for (const key in registryData.fields) {
            const field = registryData.fields[key];
            // Check if this is a vector or table of campaign IDs
            if (Array.isArray(field)) {
              campaignIds = field;
              break;
            } else if (field?.fields?.items && Array.isArray(field.fields.items)) {
              campaignIds = field.fields.items;
              break;
            } else if (field?.fields?.contents && typeof field.fields.contents === 'object') {
              // Handle table structure
              campaignIds = Object.keys(field.fields.contents);
              break;
            }
          }
        }
        
        console.log(`Found ${campaignIds.length} campaigns in registry`);
        
        if (campaignIds.length === 0) {
          return [];
        }
        
        // Fetch details for each campaign with reduced concurrency limit to avoid rate limiting
        const concurrencyLimit = 2; // Process only 2 campaigns at a time to avoid rate limits
        const results: Campaign[] = [];
        
        // Process campaigns in batches
        for (let i = 0; i < campaignIds.length; i += concurrencyLimit) {
          const batch = campaignIds.slice(i, i + concurrencyLimit);
          
          const batchResults = await Promise.all(
            batch.map(async (id: string) => {
              try {
                const campaignObj = await client.getObject({
                  id,
                  options: { showContent: true, showDisplay: true }
                });
                
                const campaignData = campaignObj.data?.content as any;
                if (!campaignData) {
                  console.warn(`Campaign ${id} data not found`);  
                  return null;
                }
                
                // Try to extract fields based on different possible structures
                const fields = campaignData.fields || {};
                

                
                // Map field names to account for different naming conventions
                // Include nested fields with dot notation
                const fieldMap: Record<string, string[]> = {
                  name: ['name'],
                  description: ['description', 'desc'],
                  imageUrl: ['image_url', 'imageUrl', 'image'],
                  goalAmount: ['goal_amount', 'goalAmount', 'goal'],
                  currentAmount: ['current_amount', 'currentAmount', 'raised', 'raised.value', 'raised.fields.value'],
                  deadline: ['deadline', 'end_time', 'endTime'],
                  category: ['category', 'type'],
                  creator: ['creator', 'owner'],
                  createdAt: ['created_at', 'createdAt', 'timestamp']
                };
                
                // Helper function to get field value using possible field names
                // This improved version handles deeply nested fields and different data structures
                const getFieldValue = (fieldNames: string[]) => {
                  for (const name of fieldNames) {
                    // Direct field access
                    if (fields[name] !== undefined) {
                      return fields[name];
                    }
                    
                    // Check for nested fields with multiple levels (e.g., raised.fields.value)
                    if (name.includes('.')) {
                      const parts = name.split('.');
                      let current: any = fields;
                      
                      // Navigate through the nested structure
                      for (const part of parts) {
                        if (!current || typeof current !== 'object') {
                          current = null;
                          break;
                        }
                        current = current[part];
                      }
                      
                      if (current !== undefined && current !== null) {
                        return current;
                      }
                    }
                    
                    // Check for fields in 'fields' property (common in Sui objects)
                    if (fields.fields && fields.fields[name] !== undefined) {
                      return fields.fields[name];
                    }
                  }
                  return null;
                };
                
                // Extract campaign data with better error handling
                return {
                  id,
                  name: getFieldValue(fieldMap.name) || 'Unnamed Campaign',
                  description: getFieldValue(fieldMap.description) || 'No description provided',
                  imageUrl: getFieldValue(fieldMap.imageUrl) || '',
                  goalAmount: getFieldValue(fieldMap.goalAmount)?.toString() || '0',
                  currentAmount: getFieldValue(fieldMap.currentAmount)?.toString() || '0',
                  deadline: getFieldValue(fieldMap.deadline)?.toString() || '0',
                  category: getFieldValue(fieldMap.category) || 'Uncategorized',
                  creator: getFieldValue(fieldMap.creator) || 'Unknown',
                  createdAt: getFieldValue(fieldMap.createdAt)?.toString() || Date.now().toString()
                };
              } catch (error) {
                console.error(`Error fetching campaign ${id}:`, error);
                return null;
              }
            })
          );
          
          // Add valid campaigns from this batch to results
          results.push(...batchResults.filter(Boolean) as Campaign[]);
          
          // Increased delay between batches to avoid rate limiting
          if (i + concurrencyLimit < campaignIds.length) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay
          }
        }
        
        console.log(`Successfully fetched ${results.length} campaigns`);
        return results;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || 'Unknown error';
        console.error(`Error fetching campaigns (attempt ${attempt + 1}/${maxRetries}):`, errorMessage);
        
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
 * Get campaign details with retry logic
 */
export async function getCampaignDetails(client: SuiClient, campaignId: string): Promise<Campaign | null> {
  // Use the request limiter to prevent too many concurrent requests
  return requestLimiter.add(async () => {
    // Implement retry logic with exponential backoff
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      try {
        // Add delay between retries with exponential backoff
        if (retries > 0) {
          const delay = Math.min(Math.pow(2, retries) * 500, 5000); // 500ms, 1s, 2s, 4s, max 5s
          console.log(`Retry ${retries}/${maxRetries} for campaign ${campaignId}, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
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
      } catch (error: any) {
        // Check if it's a rate limiting error (429)
        if (error.message && (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
          console.warn(`Rate limiting error (attempt ${retries + 1}/${maxRetries + 1}):`, error.message);
          retries++;
          
          // If we've reached max retries, give up and return null
          if (retries > maxRetries) {
            console.error('Max retries reached for campaign fetch:', campaignId);
            return null;
          }
          // Otherwise continue to retry after delay (handled at the start of the loop)
          continue;
        }
        
        // For other errors, log and return null
        console.error('Error fetching campaign details:', error);
        return null;
      }
    }
    
    return null; // Fallback return if loop exits unexpectedly
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

/**
 * Mint sgUSD tokens to a recipient address
 */
export async function mintSgUSD(
  wallet: any,
  amount: number,
  recipientAddress: string,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    // Get the SGUSD_Manager object
    const sgUsdManager = tx.object(SUI_CONFIG.SGUSD_MANAGER_ID);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::mint`,
      arguments: [
        sgUsdManager,
        tx.pure.u64(amount),
        tx.pure.address(recipientAddress),
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    return result;
  } catch (error) {
    console.error("Error minting sgUSD tokens:", error);
    throw error;
  }
}

/**
 * Burn sgUSD tokens
 */
export async function burnSgUSD(
  wallet: any,
  coinObjectId: string,
  client?: SuiClient
) {
  try {
    const tx = new Transaction();
    
    // Get the SGUSD_Manager object and the coin to burn
    const sgUsdManager = tx.object(SUI_CONFIG.SGUSD_MANAGER_ID);
    const coin = tx.object(coinObjectId);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::burn`,
      arguments: [
        sgUsdManager,
        coin,
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    return result;
  } catch (error) {
    console.error("Error burning sgUSD tokens:", error);
    throw error;
  }
}
