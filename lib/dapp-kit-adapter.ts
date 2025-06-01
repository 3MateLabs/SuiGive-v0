"use client";

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { useSignTransaction } from '@mysten/dapp-kit';

/**
 * dapp-kit Adapter for SuiGive
 * 
 * This file provides a compatibility layer for the @mysten/dapp-kit v0.16.2
 * which uses a different pattern for transaction execution:
 * 
 * 1. Sign the transaction with the wallet using useSignTransaction hook
 * 2. Execute the signed transaction with the SuiClient
 */

// Function to directly execute a transaction using the dapp-kit pattern
export async function executeDappKitTransaction(
  wallet: any, 
  transaction: Transaction, 
  client?: SuiClient
) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }
  
  if (!client) {
    throw new Error('SuiClient not available');
  }

  try {
    // Log wallet information for debugging
    console.log('Wallet type:', typeof wallet);
    console.log('Wallet properties:', Object.keys(wallet));

    // Use wallet-standard feature for signing and executing transaction
    const suiFeature = wallet.features?.['sui:signAndExecuteTransactionBlock'];
    if (!suiFeature || typeof suiFeature.signAndExecuteTransactionBlock !== 'function') {
      throw new Error('Connected wallet does not support signAndExecuteTransactionBlock. Please use a compatible Sui wallet.');
    }

    // Call the standard method
    return await suiFeature.signAndExecuteTransactionBlock({
      transactionBlock: transaction,
      // Add any other required parameters here
    });
  } catch (error) {
    console.error('Error in executeDappKitTransaction:', error);
    throw error;
  }
}
