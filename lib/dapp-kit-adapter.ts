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
    
    // In dapp-kit 0.16.2, we need to:
    // 1. Get the wallet adapter
    const walletAdapter = wallet.currentWallet || wallet;
    
    if (!walletAdapter) {
      throw new Error('No wallet adapter found');
    }
    
    // 2. Use the signTransaction method if available
    if (typeof walletAdapter.signTransaction === 'function') {
      console.log('Using signTransaction method from wallet adapter');
      
      // Sign the transaction
      const signedTx = await walletAdapter.signTransaction({
        transaction
      });
      
      console.log('Transaction signed successfully');
      
      // Execute the signed transaction
      const response = await client.executeTransactionBlock({
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
    
    // 3. If the wallet has a signAndExecuteTransactionBlock method, use it as fallback
    if (typeof walletAdapter.signAndExecuteTransactionBlock === 'function') {
      console.log('Using signAndExecuteTransactionBlock method');
      return await walletAdapter.signAndExecuteTransactionBlock({
        transactionBlock: transaction,
      });
    }
    
    // 4. Check if there's a wallet standard feature for signing transactions
    if (walletAdapter.features && Array.isArray(walletAdapter.features)) {
      console.log('Checking wallet features:', walletAdapter.features);
      
      // Look for a feature that can sign transactions
      const signFeature = walletAdapter.features.find((f: any) => 
        f && typeof f === 'object' && 
        (f.signTransaction || f.signAndExecuteTransaction)
      );
      
      if (signFeature) {
        console.log('Found sign feature:', signFeature);
        
        if (signFeature.signTransaction) {
          const signedTx = await signFeature.signTransaction({
            transaction
          });
          
          const response = await client.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature,
            options: {
              showEffects: true,
              showEvents: true,
            },
          });
          
          return response;
        }
        
        if (signFeature.signAndExecuteTransaction) {
          return await signFeature.signAndExecuteTransaction({
            transaction
          });
        }
      }
    }
    
    // If we get here, we couldn't find a way to sign and execute the transaction
    throw new Error('No compatible wallet method found for signing transactions. Please make sure you are using a compatible wallet.');
  } catch (error) {
    console.error('Error in executeDappKitTransaction:', error);
    throw error;
  }
}
