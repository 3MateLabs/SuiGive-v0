import { SUI_CONFIG } from './sui-config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { executeTransaction } from './wallet-adapter';

// Initialize Sui client
const client = new SuiClient({ 
  url: getFullnodeUrl(SUI_CONFIG.NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet')
});

// Types for the enhanced contract
export interface BeneficialParty {
  receiver: string;
  notes: string;
  percentage: number; // Out of 10000 (e.g., 100 = 1%)
  maximum_amount: number; // 0 = no limit
  minimum_amount: number;
}

/**
 * Create a beneficial party for fund distribution
 */
export function createBeneficialParty(
  receiver: string,
  notes: string,
  percentage: number,
  maximumAmount: number = 0,
  minimumAmount: number = 0
): BeneficialParty {
  return {
    receiver,
    notes,
    percentage,
    maximum_amount: maximumAmount,
    minimum_amount: minimumAmount,
  };
}

/**
 * Create a new crowdfunding campaign with beneficial parties
 */
export async function createCampaignEnhanced(
  wallet: any,
  name: string,
  description: string,
  imageUrl: string,
  goalAmount: number,
  deadline: number,
  category: string,
  beneficialParties: BeneficialParty[] = [],
  tokenType: 'SUI' | 'sgUSD' = 'SUI'
) {
  const tx = new Transaction();
  
  // Get the campaign manager object
  const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
  
  // Create beneficial party objects
  const beneficialPartyArgs = beneficialParties.map(party => [
    tx.pure.address(party.receiver),
    tx.pure.string(party.notes),
    tx.pure.u64(party.percentage),
    tx.pure.u64(party.maximum_amount),
    tx.pure.u64(party.minimum_amount),
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

  // Call create_campaign function
  const targetFunction = tokenType === 'SUI' 
    ? `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_campaign<0x2::sui::SUI>`
    : `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_campaign<${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD>`;

  tx.moveCall({
    target: targetFunction,
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
 * Donate to a campaign with the enhanced contract
 */
export async function donateEnhanced(
  wallet: any,
  campaignId: string,
  amount: number,
  message: string = '',
  isAnonymous: boolean = false,
  tokenType: 'SUI' | 'sgUSD' = 'SUI'
) {
  const tx = new Transaction();
  
  // Get the campaign object
  const campaign = tx.object(campaignId);
  
  let donationCoin;
  let targetFunction;
  
  if (tokenType === 'SUI') {
    // Split SUI from gas coin
    donationCoin = tx.splitCoins(tx.gas, [amount]);
    targetFunction = `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate<0x2::sui::SUI>`;
  } else {
    // For sgUSD, we need to get the coin from user's balance
    // This would need to be handled differently in practice
    throw new Error('sgUSD donations not yet implemented in this helper');
  }
  
  tx.moveCall({
    target: targetFunction,
    arguments: [
      campaign,
      donationCoin,
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(message))),
      tx.pure.bool(isAnonymous),
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Withdraw funds for a beneficial party
 */
export async function withdrawForParty(
  wallet: any,
  campaignId: string,
  ownerCapId: string,
  partyIndex: number,
  tokenType: 'SUI' | 'sgUSD' = 'SUI'
) {
  const tx = new Transaction();
  
  const campaign = tx.object(campaignId);
  const ownerCap = tx.object(ownerCapId);
  
  const targetFunction = tokenType === 'SUI' 
    ? `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_for_party<0x2::sui::SUI>`
    : `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_for_party<${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD>`;
  
  tx.moveCall({
    target: targetFunction,
    arguments: [
      campaign,
      ownerCap,
      tx.pure.u64(partyIndex),
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Withdraw remaining funds for campaign creator
 */
export async function withdrawRemaining(
  wallet: any,
  campaignId: string,
  ownerCapId: string,
  tokenType: 'SUI' | 'sgUSD' = 'SUI'
) {
  const tx = new Transaction();
  
  const campaign = tx.object(campaignId);
  const ownerCap = tx.object(ownerCapId);
  
  const targetFunction = tokenType === 'SUI' 
    ? `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_remaining<0x2::sui::SUI>`
    : `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_remaining<${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD>`;
  
  tx.moveCall({
    target: targetFunction,
    arguments: [
      campaign,
      ownerCap,
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Distribute funds using sgSUI tokens
 */
export async function distributeFunds(
  wallet: any,
  campaignId: string,
  ownerCapId: string,
  amount: number,
  recipient: string
) {
  const tx = new Transaction();
  
  const campaign = tx.object(campaignId);
  const ownerCap = tx.object(ownerCapId);
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
      tx.pure.address(recipient),
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(campaignId: string) {
  try {
    const result = await client.getObject({
      id: campaignId,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    throw error;
  }
}

/**
 * Get all campaigns from campaign manager
 */
export async function getAllCampaigns() {
  try {
    const result = await client.getObject({
      id: SUI_CONFIG.CAMPAIGN_MANAGER_ID,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

/**
 * Admin function: Set creation fee
 */
export async function setCreationFee(
  wallet: any,
  fee: number
) {
  const tx = new Transaction();
  
  const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
  
  tx.moveCall({
    target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::set_creation_fee`,
    arguments: [
      campaignManager,
      tx.pure.u64(fee),
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Admin function: Collect accumulated fees
 */
export async function collectFees(
  wallet: any,
  amount: number
) {
  const tx = new Transaction();
  
  const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
  
  tx.moveCall({
    target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::collect_fees`,
    arguments: [
      campaignManager,
      tx.pure.u64(amount),
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Admin function: Add admin
 */
export async function addAdmin(
  wallet: any,
  adminAddress: string
) {
  const tx = new Transaction();
  
  const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
  
  tx.moveCall({
    target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::add_admin`,
    arguments: [
      campaignManager,
      tx.pure.address(adminAddress),
    ],
  });
  
  return executeTransaction(wallet, tx);
}

/**
 * Admin function: Remove admin
 */
export async function removeAdmin(
  wallet: any,
  adminAddress: string
) {
  const tx = new Transaction();
  
  const campaignManager = tx.object(SUI_CONFIG.CAMPAIGN_MANAGER_ID);
  
  tx.moveCall({
    target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::remove_admin`,
    arguments: [
      campaignManager,
      tx.pure.address(adminAddress),
    ],
  });
  
  return executeTransaction(wallet, tx);
}