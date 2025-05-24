"use client";

import { Transaction } from '@mysten/sui/transactions';

/**
 * Wallet compatibility layer for handling different wallet API versions
 * This ensures our app works with different wallet implementations
 */

/**
 * Execute a transaction with the wallet, handling different wallet API versions
 */
export async function executeWalletTransaction(wallet: any, tx: Transaction) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  console.log('Wallet methods available:', Object.keys(wallet).filter(k => typeof wallet[k] === 'function'));

  // Try different methods based on what's available in the wallet
  if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
    console.log('Using signAndExecuteTransactionBlock method');
    return wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
  } 
  
  if (typeof wallet.signAndExecuteTransaction === 'function') {
    console.log('Using signAndExecuteTransaction method');
    return wallet.signAndExecuteTransaction({
      transaction: tx,
    });
  }

  if (typeof wallet.executeMoveCall === 'function') {
    console.log('Using executeMoveCall method');
    return wallet.executeMoveCall(tx);
  }

  if (typeof wallet.signTransaction === 'function') {
    console.log('Using signTransaction method');
    return wallet.signTransaction({
      transaction: tx,
    });
  }

  // Last resort - look for any method that might work
  const possibleMethods = [
    'executeTransaction',
    'execute',
    'sendTransaction',
    'signAndSend'
  ];

  for (const method of possibleMethods) {
    if (typeof wallet[method] === 'function') {
      console.log(`Using ${method} method`);
      try {
        return await wallet[method]({
          transaction: tx,
          transactionBlock: tx,
        });
      } catch (err) {
        console.error(`Error with ${method}:`, err);
        // Continue trying other methods
      }
    }
  }

  // If we get here, we couldn't find a compatible method
  throw new Error('No compatible wallet transaction method found. Please check your wallet connection.');
}
