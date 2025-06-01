"use client";

import { SUI_CONFIG } from './sui-config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { executeDappKitTransaction } from './dapp-kit-adapter';

// Define token interfaces
export interface DonationToken {
  id: string;
  campaignId: string;
  amount: bigint;
  owner: string;
}

export interface SgSuiToken {
  id: string;
  campaignId: string;
  amount: bigint;
  owner: string;
}

/**
 * Get donation tokens for a user
 */
export async function getDonationTokens(client: SuiClient, address: string): Promise<DonationToken[]> {
  try {
    // Query for donation tokens owned by the address
    const response = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${SUI_CONFIG.PACKAGE_ID}::donation_token::DONATION_TOKEN`
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    const tokens: DonationToken[] = [];
    
    for (const obj of response.data) {
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        tokens.push({
          id: obj.data.objectId,
          campaignId: fields.campaign_id || '',
          amount: BigInt(fields.value || 0),
          owner: address,
        });
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Error fetching donation tokens:', error);
    return [];
  }
}

/**
 * Get sgSUI tokens for a user
 */
export async function getSgSuiTokens(client: SuiClient, address: string): Promise<SgSuiToken[]> {
  try {
    // Query for sgSUI tokens owned by the address
    const response = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${SUI_CONFIG.PACKAGE_ID}::sg_sui_token::SG_SUI`
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    const tokens: SgSuiToken[] = [];
    
    for (const obj of response.data) {
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        tokens.push({
          id: obj.data.objectId,
          campaignId: fields.campaign_id || '',
          amount: BigInt(fields.value || 0),
          owner: address,
        });
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Error fetching sgSUI tokens:', error);
    return [];
  }
}

/**
 * Get donation receipts for a user
 */
export async function getDonationReceipts(client: SuiClient, address: string): Promise<any[]> {
  try {
    // Query for donation receipts owned by the address
    const response = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${SUI_CONFIG.PACKAGE_ID}::donation_receipt::DonationReceipt`
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    const receipts: any[] = [];
    
    for (const obj of response.data) {
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        receipts.push({
          id: obj.data.objectId,
          campaignId: fields.campaign_id || '',
          donor: fields.donor || '',
          amount: BigInt(fields.amount || 0),
          timestamp: fields.timestamp || '',
          message: fields.message || '',
          isAnonymous: fields.is_anonymous || false,
        });
      }
    }
    
    return receipts;
  } catch (error) {
    console.error('Error fetching donation receipts:', error);
    return [];
  }
}

/**
 * Mint sgSUI tokens from campaign funds
 */
export async function mintSgSuiTokens(
  wallet: any,
  client: SuiClient,
  campaignId: string,
  ownerCapId: string,
  treasuryId: string,
  minterCapId: string,
  amount: bigint,
  recipient: string
): Promise<boolean> {
  try {
    const tx = new Transaction();
    
    // Get a SUI coin to add to the treasury
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::sg_sui_token::add_funds_and_mint`,
      arguments: [
        tx.object(treasuryId),
        tx.object(minterCapId),
        coin,
        tx.pure.address(recipient),
        tx.pure.address(campaignId)
      ],
    });

    const result = await executeDappKitTransaction(wallet, tx, client);
    return !!result;
  } catch (error) {
    console.error('Error minting sgSUI tokens:', error);
    return false;
  }
}

/**
 * Redeem sgSUI tokens for SUI
 */
export async function redeemSgSuiTokens(
  wallet: any,
  client: SuiClient,
  treasuryId: string,
  tokenId: string,
  campaignId: string
): Promise<boolean> {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::sg_sui_token::redeem_sg_sui`,
      arguments: [
        tx.object(treasuryId),
        tx.object(tokenId),
        tx.pure.address(campaignId)
      ],
    });

    const result = await executeDappKitTransaction(wallet, tx, client);
    return !!result;
  } catch (error) {
    console.error('Error redeeming sgSUI tokens:', error);
    return false;
  }
}

/**
 * Transfer sgSUI tokens to another address
 */
export async function transferSgSuiTokens(
  wallet: any,
  client: SuiClient,
  tokenId: string,
  recipient: string
): Promise<boolean> {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::sg_sui_token::transfer_sg_sui`,
      arguments: [
        tx.object(tokenId),
        tx.pure.address(recipient)
      ],
    });

    const result = await executeDappKitTransaction(wallet, tx, client);
    return !!result;
  } catch (error) {
    console.error('Error transferring sgSUI tokens:', error);
    return false;
  }
}

/**
 * Transfer donation token to another address
 */
export async function transferDonationToken(
  wallet: any,
  client: SuiClient,
  tokenId: string,
  recipient: string
): Promise<boolean> {
  try {
    const tx = new Transaction();
    
    // Set explicit gas budget to avoid automatic budget determination issues
    tx.setGasBudget(10000000);
    
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::donation_token::transfer`,
      arguments: [
        tx.object(tokenId),
        tx.pure.address(recipient)
      ],
    });

    const result = await executeDappKitTransaction(wallet, tx, client);
    return !!result;
  } catch (error) {
    console.error('Error transferring donation token:', error);
    return false;
  }
}
