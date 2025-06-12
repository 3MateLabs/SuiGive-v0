"use client";

import { SUI_CONFIG } from './sui-config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { requestMonitor, monitoredApiCall } from './request-monitor';
import { executeDappKitTransaction } from './dapp-kit-adapter';

// Simple request limiter to prevent too many concurrent requests
class RequestLimiter {
  private queue: Array<() => Promise<void>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 20) { // Maximized from 10 to 20 for optimal performance
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

// Create a global request limiter with optimized concurrency
// Using 3 as a balance between performance and avoiding rate limits
const requestLimiter = new RequestLimiter(3);

// Define campaign interface
export interface Campaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  goalAmount: string; // Using string for large numbers
  currentAmount: string; // SUI amount
  currentAmountSgUSD: string; // sgUSD amount
  raisedSUI?: string; // Alias for currentAmount for chart component
  raisedSgUSD?: string; // Alias for currentAmountSgUSD for chart component
  backerCount?: number; // Changed to number for chart component
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
    
    // Get the campaign manager object
    const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
    
    // Create zero SUI coin for creation fee (if no fee is set)
    const creationFeeCoin = tx.splitCoins(tx.gas, [0]);
    
    // Create empty beneficial parties vector since the contract now requires it
    const emptyBeneficialPartiesVector = tx.makeMoveVec({
      elements: []
    });
    
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
        emptyBeneficialPartiesVector,
        creationFeeCoin,
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    // Extract campaign ID from the transaction result
    let campaignId = null;
    try {
      // Look for the created campaign object in the transaction effects
      if (result.effects?.created) {
        // Find the created object that has the Campaign type
        const campaignObj = result.effects.created.find((obj: any) => 
          obj.owner?.AddressOwner === wallet.address && 
          obj.type?.includes('::crowdfunding::Campaign')
        );
        
        if (campaignObj) {
          campaignId = campaignObj.reference.objectId;
          
          // Save campaign to database
          try {
            // Import dynamically to avoid circular dependencies
            const { saveCampaign } = await import('./db');
            
            // Get the creator address from the wallet
            const creatorAddress = wallet.address || wallet.currentAccount?.address;
            
            if (creatorAddress) {
              // Convert Unix timestamp to ISO date string
              const deadlineDate = new Date(deadline * 1000).toISOString();
              const createdAt = new Date().toISOString();
              
              // Save campaign to database
              await saveCampaign({
                id: campaignId,
                name,
                description,
                imageUrl,
                goalAmount: goalAmount.toString(),
                creator: creatorAddress,
                deadline: deadlineDate,
                category,
                createdAt,
              });
              
              console.log('Campaign saved to database');
            }
          } catch (dbError) {
            // Log database error but don't fail the transaction
            console.error('Error saving campaign to database:', dbError);
            // The blockchain transaction was still successful
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing campaign ID from result:', parseError);
      // Don't throw here, we still want to return the transaction result
    }
    
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
      typeArguments: ['0x2::sui::SUI'],
      arguments: [
        campaign,
        coin,
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(message))),
        tx.pure.bool(isAnonymous),
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    // Save donation to database for history tracking
    try {
      // Import dynamically to avoid circular dependencies
      const { prisma, saveDonation } = await import('./db');
      
      // Get the donor address from the wallet
      const donorAddress = wallet.address || wallet.currentAccount?.address;
      
      if (donorAddress && result.effects?.status?.status === 'success') {
        // Extract transaction ID
        const transactionId = result.digest;
        
        console.log('Blockchain transaction successful, preparing to save donation to database');
        
        // First, ensure the user exists in the database before attempting to save the donation
        // This helps prevent foreign key constraint errors
        try {
          // Check if user exists
          const user = await prisma.user.findUnique({
            where: { address: donorAddress },
          });
          
          const now = new Date();
          
          // If user doesn't exist, create them first
          if (!user && !isAnonymous) {
            console.log('Creating new user in database:', donorAddress);
            await prisma.user.create({
              data: {
                address: donorAddress,
                totalDonated: '0', // Will be updated by saveDonation
                donationCount: 0,  // Will be updated by saveDonation
                firstDonation: now,
                lastDonation: now,
              },
            });
            console.log('User created successfully');
          }
          
          // Check if campaign exists
          const campaignExists = await prisma.campaign.findUnique({
            where: { id: campaignId },
          });
          
          // If campaign doesn't exist in database, create a placeholder
          if (!campaignExists) {
            console.log('Creating placeholder campaign in database:', campaignId);
            await prisma.campaign.create({
              data: {
                id: campaignId,
                name: `Campaign ${campaignId.substring(0, 8)}`,
                description: 'Automatically created campaign',
                imageUrl: 'https://placehold.co/600x400?text=Campaign',
                goalAmount: '10000000000', // 10 SUI
                currentAmount: '0',
                creator: donorAddress,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                category: 'Other',
                backerCount: 0,
              },
            });
            console.log('Campaign placeholder created successfully');
          }
          
          // Now save the donation with confidence that foreign keys exist
          console.log('Saving donation to database');
          await saveDonation({
            campaignId,
            donorAddress,
            amount: amount.toString(),
            currency: 'SUI',
            message,
            isAnonymous,
            transactionId,
          });
          
          console.log('Donation saved to database successfully');
        } catch (userError) {
          console.error('Error ensuring user/campaign exists:', userError);
          throw userError; // Re-throw to be caught by outer try-catch
        }
      } else {
        console.warn('Cannot save donation: missing donor address or transaction failed');
      }
    } catch (dbError) {
      // Log database error but don't fail the transaction
      console.error('Error saving donation to database:', dbError);
      // The blockchain transaction was still successful
    }
    
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
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate`,
      typeArguments: [`${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD`],
      arguments: [
        campaign,
        sgUSDCoin,
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(message))),
        tx.pure.bool(isAnonymous),
      ],
    });
    
    // Sign and execute the transaction using our dapp-kit adapter
    const result = await executeDappKitTransaction(wallet, tx, client);
    
    // Save donation to database for history tracking
    try {
      // Import dynamically to avoid circular dependencies
      const { saveDonation } = await import('./db');
      
      // Get the donor address from the wallet
      const donorAddress = wallet.address || wallet.currentAccount?.address;
      
      if (donorAddress && result.effects?.status?.status === 'success') {
        // Extract transaction ID
        const transactionId = result.digest;
        
        // Save donation to database
        await saveDonation({
          campaignId,
          donorAddress,
          amount: amount.toString(),
          currency: 'sgUSD',
          message,
          isAnonymous,
          transactionId,
        });
        
        console.log('sgUSD donation saved to database');
      }
    } catch (dbError) {
      // Log database error but don't fail the transaction
      console.error('Error saving sgUSD donation to database:', dbError);
      // The blockchain transaction was still successful
    }
    
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
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_remaining`,
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
        
        // First, get the registry object with timeout and monitoring
        // Use a shorter cache time (30 seconds) optimized for performance while maintaining freshness
        const fetchRegistryPromise = monitoredApiCall(
          'getObject/registry',
          () => client.getObject({
            id: SUI_CONFIG.REGISTRY_ID,
            options: { showContent: true, showDisplay: true, showOwner: true }
          }),
          0, // No retries yet at this point
          30000 // 30 second cache time - optimized for performance
        );
        
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
        
        // Fetch details for each campaign with increased concurrency limit for faster loading
        const concurrencyLimit = 8; // Increased from 2 to 8 for faster loading
        const results: Campaign[] = [];
        
        // Process campaigns in larger batches
        for (let i = 0; i < campaignIds.length; i += concurrencyLimit) {
          const batch = campaignIds.slice(i, i + concurrencyLimit);
          console.log(`Processing batch of ${batch.length} campaigns (${i+1}-${Math.min(i+concurrencyLimit, campaignIds.length)} of ${campaignIds.length})`);
          
          const batchResults = await Promise.all(
            batch.map(async (id: string) => {
              try {
                // Use monitored API call with minimal cache time for individual campaign objects
                const campaignObj = await monitoredApiCall(
                  `getObject/campaign/${id.substring(0, 8)}...`,
                  () => client.getObject({
                    id,
                    options: { showContent: true, showDisplay: true }
                  }),
                  0, // No retries at this point
                  15000 // 15 second cache time - optimized for maximum performance
                );
                
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
                  currentAmountSgUSD: ['current_amount_sgusd', 'currentAmountSgUSD', 'raised_sgusd', 'raisedSgUSD', 'sgUSDRaised'],
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
                const currentAmount = getFieldValue(fieldMap.currentAmount)?.toString() || '0';
                const currentAmountSgUSD = getFieldValue(fieldMap.currentAmountSgUSD)?.toString() || '0';
                
                return {
                  id,
                  name: getFieldValue(fieldMap.name) || 'Unnamed Campaign',
                  description: getFieldValue(fieldMap.description) || 'No description provided',
                  imageUrl: getFieldValue(fieldMap.imageUrl) || '',
                  goalAmount: getFieldValue(fieldMap.goalAmount)?.toString() || '0',
                  currentAmount,
                  currentAmountSgUSD,
                  // Add aliases for chart components
                  raisedSUI: currentAmount,
                  raisedSgUSD: currentAmountSgUSD,
                  deadline: getFieldValue(fieldMap.deadline)?.toString() || '0',
                  category: getFieldValue(fieldMap.category) || 'Uncategorized',
                  creator: getFieldValue(fieldMap.creator) || 'Unknown',
                  createdAt: getFieldValue(fieldMap.createdAt)?.toString() || Date.now().toString(),
                  backerCount: 0 // Default value, will be updated later if available
                };
              } catch (error) {
                console.error(`Error fetching campaign ${id}:`, error);
                return null;
              }
            })
          );
          
          // Add valid campaigns from this batch to results
          results.push(...batchResults.filter(Boolean) as Campaign[]);
          
          // Add absolute minimal delay between batches - just enough to prevent rate limiting
          // Prioritize maximum performance
          if (i + concurrencyLimit < campaignIds.length) {
            console.log('Adding micro delay between batches...');
            await new Promise(resolve => setTimeout(resolve, 50)); // Minimized to 50ms for maximum performance
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
    let lastError: Error | null = null;
    
    while (retries <= maxRetries) {
      try {
        // Only add delay for actual retries, not for first attempt
        if (retries > 0) {
          // Use a more gradual backoff strategy with jitter to prevent thundering herd
          const baseDelay = Math.min(Math.pow(2, retries) * 500, 5000); // 500ms, 1s, 2s, 4s, max 5s
          const jitter = Math.random() * 300; // Add up to 300ms of random jitter
          const delay = baseDelay + jitter;
          console.log(`Retry ${retries}/${maxRetries} for campaign ${campaignId}, waiting ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Use monitored API call with shorter cache time (20 seconds) optimized for performance
        const campaign = await monitoredApiCall(
          `getObject/${campaignId.substring(0, 8)}...`,
          () => client.getObject({
            id: campaignId,
            options: { showContent: true }
          }),
          retries, // Pass the retry count for monitoring
          20000 // 20 second cache time - optimized for maximum performance
        );
        
        const campaignData = campaign.data?.content as any;
        if (!campaignData || !campaignData.fields) {
          return null;
        }
        
        // Extract sgUSD balance - handle different possible structures
        let raisedSgUSDRaw = '0';
        if (typeof campaignData.fields.raised_sgusd === 'string') {
          raisedSgUSDRaw = campaignData.fields.raised_sgusd;
        } else if (typeof campaignData.fields.raised_sgusd === 'object') {
          if (campaignData.fields.raised_sgusd?.fields?.value) {
            raisedSgUSDRaw = campaignData.fields.raised_sgusd.fields.value;
          } else if (campaignData.fields.raised_sgusd?.value) {
            raisedSgUSDRaw = campaignData.fields.raised_sgusd.value;
          }
        }
        
        // Extract SUI balance - handle different possible structures
        let raisedSUIRaw = '0';
        if (typeof campaignData.fields.raised === 'string') {
          raisedSUIRaw = campaignData.fields.raised;
        } else if (typeof campaignData.fields.raised === 'object') {
          if (campaignData.fields.raised?.fields?.value) {
            raisedSUIRaw = campaignData.fields.raised.fields.value;
          } else if (campaignData.fields.raised?.value) {
            raisedSUIRaw = campaignData.fields.raised.value;
          }
        }
        
        // Log the raw image URL from the campaign data
        console.log('Raw image URL from campaign:', campaignData.fields.image_url);
        
        // Process the image URL - ensure it's a valid URL or use a placeholder
        let imageUrl = campaignData.fields.image_url;
        
        // If image URL is empty or null, use placeholder
        if (!imageUrl) {
          imageUrl = '/placeholder.svg';
        }
        // If it's not a full URL (doesn't start with http/https), and not a local path (doesn't start with /)
        // then add a leading slash to make it a valid path
        else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = '/' + imageUrl;
        }
        
        console.log('Processed image URL:', imageUrl);
        
        return {
          id: campaignId,
          name: campaignData.fields.name,
          description: campaignData.fields.description,
          imageUrl: imageUrl,
          goalAmount: campaignData.fields.goal_amount,
          currentAmount: campaignData.fields.current_amount || raisedSUIRaw,
          currentAmountSgUSD: raisedSgUSDRaw,
          backerCount: campaignData.fields.backer_count || '0',
          deadline: campaignData.fields.deadline,
          category: campaignData.fields.category,
          creator: campaignData.fields.creator,
          createdAt: campaignData.fields.created_at
        };
        
        // Create a variable for the campaign result before caching
        const campaignResult = {
          id: campaignId,
          name: campaignData.fields.name,
          description: campaignData.fields.description,
          imageUrl: imageUrl,
          goalAmount: campaignData.fields.goal_amount,
          currentAmount: raisedSUIRaw,
          currentAmountSgUSD: raisedSgUSDRaw,
          backerCount: campaignData.fields.backer_count || '0',
          deadline: campaignData.fields.deadline,
          category: campaignData.fields.category,
          creator: campaignData.fields.creator,
          createdAt: campaignData.fields.created_at
        };
        
        // Cache the successful result in local storage
        try {
          if (typeof window !== 'undefined') {
            // Store with a timestamp for cache invalidation
            const cacheData = {
              campaign: campaignResult,
              timestamp: Date.now()
            };
            localStorage.setItem(`campaign_${campaignId}`, JSON.stringify(cacheData));
          }
        } catch (cacheError) {
          console.warn('Failed to cache campaign data:', cacheError);
        }
        
        return campaignResult;
      } catch (error: any) {
        lastError = error;
        
        // Categorize the error for better handling
        const errorMessage = error.message || 'Unknown error';
        
        // Check if it's a network error (Failed to fetch)
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError') || 
            errorMessage.includes('Network request failed')) {
          console.warn(`Network error (attempt ${retries + 1}/${maxRetries + 1}) for campaign ${campaignId}:`, errorMessage);
          retries++;
          
          // If we've reached max retries, check if we have cached data
          if (retries > maxRetries) {
            console.error('Max retries reached for network error:', campaignId);
            // Try to get from local storage cache if available
            try {
              if (typeof window !== 'undefined') {
                const cachedDataString = localStorage.getItem(`campaign_${campaignId}`);
                if (cachedDataString) {
                  const cachedData = JSON.parse(cachedDataString);
                  // Check if cache is still valid (less than 30 minutes old)
                  const cacheAge = Date.now() - cachedData.timestamp;
                  if (cacheAge < 30 * 60 * 1000) { // 30 minutes in milliseconds
                    console.log('Using cached campaign data for:', campaignId);
                    return cachedData.campaign;
                  } else {
                    console.log('Cached campaign data expired for:', campaignId);
                    localStorage.removeItem(`campaign_${campaignId}`);
                  }
                }
              }
            } catch (cacheError) {
              console.error('Error accessing cache:', cacheError);
            }
            return null;
          }
          continue;
        }
        
        // Check if it's a rate limiting error (429)
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          console.warn(`Rate limiting error (attempt ${retries + 1}/${maxRetries + 1}):`, errorMessage);
          retries++;
          
          // Use a longer delay for rate limit errors
          const rateLimit429Delay = 2000 + (retries * 1000);
          await new Promise(resolve => setTimeout(resolve, rateLimit429Delay));
          
          if (retries > maxRetries) {
            console.error('Max retries reached for rate limit:', campaignId);
            return null;
          }
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
