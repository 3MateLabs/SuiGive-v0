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
      type: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::BeneficialParty`,
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
 * Get all campaigns using CampaignCreated events (most reliable approach)
 */
export async function getAllCampaigns(client: SuiClient): Promise<Campaign[]> {
  // Use the request limiter to prevent too many concurrent requests
  return requestLimiter.add(async () => {
    if (!client) {
      console.error('SuiClient is not initialized');
      throw new Error('SuiClient is not initialized');
    }

    // Validate package ID
    if (!SUI_CONFIG.PACKAGE_ID) {
      console.error('Package ID is not configured');
      throw new Error('Package ID is not configured');
    }

    console.log('Fetching campaigns using events approach...');
    
    try {
      // Get CampaignCreated events to find all campaigns
      const events = await client.queryEvents({
        query: { 
          MoveEventType: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::CampaignCreated`
        },
        order: 'descending',
        limit: 50 // Get up to 50 most recent campaigns
      });
      
      console.log(`Found ${events.data.length} CampaignCreated events`);
      
      if (events.data.length === 0) {
        console.log('No campaigns found');
        return [];
      }
      
      // Extract campaign IDs from events and fetch campaign objects
      const campaigns: Campaign[] = [];
      
      for (const event of events.data) {
        const campaignId = (event.parsedJson as any)?.campaign_id;
        if (!campaignId) continue;
        
        try {
          // Fetch the campaign object
          const campaignObj = await client.getObject({
            id: campaignId,
            options: { showContent: true, showDisplay: true }
          });
          
          const content = campaignObj.data?.content as any;
          if (!content?.fields) {
            console.warn(`Campaign ${campaignId} has no content`);
            continue;
          }
          
          const fields = content.fields;
          
          // Create campaign object with proper field mapping
          const campaign: Campaign = {
            id: campaignId,
            name: fields.name || 'Unknown Campaign',
            description: fields.description || '',
            imageUrl: fields.image_url || '/placeholder.svg',
            goalAmount: fields.goal_amount?.toString() || '0',
            currentAmount: fields.total_raised?.toString() || '0',
            currentAmountSgUSD: fields.total_raised?.toString() || '0', // Using same value for now
            deadline: fields.deadline?.toString() || '0',
            category: fields.category || 'Other',
            creator: fields.creator || '',
            createdAt: event.timestampMs?.toString() || Date.now().toString(),
            backerCount: parseInt(fields.backer_count?.toString() || '0'),
            // Aliases for chart component compatibility
            raisedSUI: fields.total_raised?.toString() || '0',
            raisedSgUSD: fields.total_raised?.toString() || '0'
          };
          
          campaigns.push(campaign);
          console.log(`✅ Loaded campaign: ${campaign.name}`);
          
        } catch (error) {
          console.error(`Error fetching campaign ${campaignId}:`, error);
          // Continue with other campaigns even if one fails
        }
      }
      
      console.log(`Successfully loaded ${campaigns.length} campaigns`);
      return campaigns;
      
    } catch (error) {
      console.error('Error fetching campaigns via events:', error);
      throw error;
    }
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
