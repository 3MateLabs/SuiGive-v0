"use client";

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

/**
 * Sui Wallet Bridge
 * 
 * This file provides a compatibility layer between the dapp-kit wallet API
 * and the transaction execution functions in our application.
 * 
 * The latest dapp-kit (0.16.2) uses a different pattern for executing transactions:
 * 1. First sign the transaction with wallet.signTransaction
 * 2. Then execute it separately with the SuiClient
 */

// Function to sign and execute a transaction using the current dapp-kit pattern
export async function signAndExecuteTransaction(wallet: any, tx: Transaction, client?: SuiClient) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  // Log wallet object for debugging
  console.log('Wallet object type:', typeof wallet);
  console.log('Wallet keys:', Object.keys(wallet));
  
  try {
    // Check if we're dealing with the wallet object or the currentWallet hook result
    const walletAdapter = wallet.currentWallet || wallet;
    
    if (!walletAdapter) {
      console.error('No wallet adapter found');
      throw new Error('No wallet adapter found. Please connect your wallet and try again.');
    }
    
    console.log('Wallet adapter keys:', Object.keys(walletAdapter));
    
    // Step 1: Sign the transaction
    // The current dapp-kit pattern uses signTransaction instead of signAndExecuteTransactionBlock
    if (typeof walletAdapter.signTransaction === 'function') {
      console.log('Using signTransaction method');
      const signedTx = await walletAdapter.signTransaction({
        transaction: tx,
      });
      
      console.log('Transaction signed successfully');
      
      // Step 2: Execute the transaction using the client
      // If client is provided, use it, otherwise try to get it from the wallet
      const suiClient = client || walletAdapter.client;
      
      if (!suiClient) {
        console.error('No SUI client available for executing the transaction');
        throw new Error('No SUI client available for executing the transaction');
      }
      
      console.log('Executing transaction with client');
      const response = await suiClient.executeTransactionBlock({
        transactionBlock: signedTx.bytes,
        signature: signedTx.signature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      console.log('Transaction executed successfully:', response);
      return response;
    } 
    // Fallback to the old method if available (for backward compatibility)
    else if (typeof walletAdapter.signAndExecuteTransactionBlock === 'function') {
      console.log('Falling back to signAndExecuteTransactionBlock method');
      return await walletAdapter.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });
    }
    else {
      console.error('Available wallet methods:', 
        Object.keys(walletAdapter)
          .filter(key => typeof walletAdapter[key] === 'function')
          .join(', ')
      );
      throw new Error('No compatible wallet method found for signing transactions');
    }
  } catch (error) {
    console.error('Error in signAndExecuteTransaction:', error);
    throw error;
  }
}
