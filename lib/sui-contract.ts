import { SUI_CONFIG } from './sui-config';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { executeTransaction } from './wallet-adapter';

// Initialize Sui client (use testnet by default)
const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

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
      tx.pure.u64(Date.now()),
    ],
  });
  
  return wallet.signAndExecuteTransactionBlock({
    transactionBlock: tx,
  });
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
  
  return wallet.signAndExecuteTransactionBlock({
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
  
  return wallet.signAndExecuteTransactionBlock({
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
    
    return await client.devInspectTransactionBlock({
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      transactionBlock: new TransactionBlock()
        .moveCall({
          target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::is_goal_reached`,
          arguments: [
            new TransactionBlock().object(campaignId)
          ],
        })
        .finish()
    }).then(result => {
      // Parse the result to determine if goal was reached
      if (result.effects?.status.status === 'success') {
        return result.results?.[0]?.returnValues?.[0] === '1';
      }
      return false;
    });
  } catch (error) {
    console.error(`Error checking if goal reached for campaign ${campaignId}:`, error);
    return false;
  }
}
