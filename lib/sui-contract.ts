import { SUI_CONFIG } from './sui-config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { executeTransaction } from './wallet-adapter';
import { requestMonitor } from './request-monitor';

// Initialize Sui client with official RPC endpoints
// This uses the network specified in SUI_CONFIG and falls back to testnet
const client = new SuiClient({ 
  url: getFullnodeUrl(SUI_CONFIG.NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet')
});

/**
 * Create a new crowdfunding campaign (Enhanced Version)
 * Uses the new beneficial parties system
 */
export async function createCampaign(
  wallet: any,
  name: string,
  description: string,
  imageUrl: string,
  goalAmount: number,
  deadline: number,
  category: string,
  beneficialParties: Array<{
    receiver: string;
    notes: string;
    percentage: number;
    maximum_amount?: number;
    minimum_amount?: number;
  }> = []
) {
  const tx = new Transaction();
  
  // Get the campaign manager object (replaces registry)
  const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
  
  // Create beneficial party objects
  const beneficialPartyArgs = beneficialParties.map(party => [
    tx.pure.address(party.receiver),
    tx.pure.string(party.notes),
    tx.pure.u64(party.percentage),
    tx.pure.u64(party.maximum_amount || 0),
    tx.pure.u64(party.minimum_amount || 0),
  ]);

  // Create beneficial parties vector
  const beneficialPartiesVector = tx.makeMoveVec({
    elements: beneficialPartyArgs.map(args => 
      tx.moveCall({
        target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_beneficial_party`,
        arguments: args,
      })
    )
  });

  // Create zero SUI coin for creation fee (if no fee is set)
  const creationFeeCoin = tx.splitCoins(tx.gas, [0]);

  // Always use create_campaign with beneficial parties (empty vector if none provided)
  tx.moveCall({
    target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_campaign<0x2::sui::SUI>`,
    arguments: [
      campaignManager,
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(imageUrl),
      tx.pure.string(category),
      tx.pure.u64(goalAmount),
      tx.pure.u64(deadline),
      beneficialPartiesVector,
      creationFeeCoin,
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Donate to a campaign
 */
export async function donate(
  wallet: any,
  campaignId: string,
  amount: number,
  isAnonymous: boolean
) {
  const tx = new Transaction();
  
  // Get the campaign object
  const campaign = tx.object(campaignId);
  
  // Create a coin to donate
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  
  tx.moveCall({
    target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate<0x2::sui::SUI>`,
    arguments: [
      campaign,
      coin,
      tx.pure([], 'vector<u8>'), // Empty message as vector<u8>
      tx.pure.bool(isAnonymous),
    ],
  });
  
  return wallet.signAndExecuteTransaction({
    transactionBlock: tx,
  });
}

/**
 * Withdraw funds from a campaign
 */
export async function withdrawFunds(
  wallet: any,
  campaignId: string,
  capabilityId: string
) {
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
  
  return wallet.signAndExecuteTransaction({
    transactionBlock: tx,
  });
}

/**
 * Get all campaigns from the registry
 */
export async function getAllCampaigns() {
  try {
    // First, get the registry object
    const registry = await client.getObject({
      id: SUI_CONFIG.REGISTRY_ID,
      options: { showContent: true }
    });
    
    // Extract campaign IDs from registry
    const registryData = registry.data?.content as any;
    if (!registryData || !registryData.fields || !registryData.fields.campaigns) {
      return [];
    }
    
    const campaignIds = registryData.fields.campaigns;
    
    // Fetch details for each campaign
    const campaigns = await Promise.all(
      campaignIds.map(async (id: string) => {
        try {
          const campaignObj = await client.getObject({
            id,
            options: { showContent: true }
          });
          
          const campaignData = campaignObj.data?.content as any;
          if (!campaignData || !campaignData.fields) {
            return null;
          }
          
          return {
            id,
            ...campaignData.fields
          };
        } catch (error) {
          console.error(`Error fetching campaign ${id}:`, error);
          return null;
        }
      })
    );
    
    return campaigns.filter(Boolean);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(campaignId: string) {
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
      ...campaignData.fields
    };
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId}:`, error);
    return null;
  }
}

/**
 * Check if a campaign has reached its goal
 */
export async function isGoalReached(campaignId: string) {
  try {
    const campaign = await getCampaignDetails(campaignId);
    if (!campaign) return false;
    
    // Create a transaction for inspection
    const tx = new Transaction();
    // Add the move call to check if goal is reached
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::is_goal_reached`,
      arguments: [tx.object(campaignId)],
    });
    
    // Execute the transaction inspection
    return await client.devInspectTransactionBlock({
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      transactionBlock: tx
    }).then(result => {
      // Parse the result to determine if goal was reached
      if (result.effects?.status.status === 'success') {
        // Parse the return value correctly based on the new API format
        const returnValue = result.results?.[0]?.returnValues?.[0];
        if (!returnValue) return false;
        
        // Handle different possible return value formats using type-safe approach
        // Convert the value to a string for comparison to avoid type issues
        const value = String(returnValue[0]);
        return value === '1' || value === 'true';
      }
      return false;
    });
  } catch (error) {
    console.error(`Error checking if goal reached for campaign ${campaignId}:`, error);
    return false;
  }
}
