"use client";

/**
 * Universal wallet adapter for SuiGive
 * This file provides a compatibility layer for different wallet implementations
 */

// Function to execute a transaction with any wallet implementation
export async function executeWalletTransaction(wallet: any, tx: any) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  console.log('Available wallet methods:', Object.keys(wallet).filter(k => typeof wallet[k] === 'function'));

  try {
    // Try different methods based on what's available in the wallet
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      console.log('Using signAndExecuteTransactionBlock method');
      return await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });
    } 
    
    if (typeof wallet.signAndExecuteTransaction === 'function') {
      console.log('Using signAndExecuteTransaction method');
      return await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
    }

    if (typeof wallet.executeMoveCall === 'function') {
      console.log('Using executeMoveCall method');
      return await wallet.executeMoveCall(tx);
    }

    if (typeof wallet.signTransaction === 'function') {
      console.log('Using signTransaction method');
      return await wallet.signTransaction({
        transaction: tx,
      });
    }

    // Try to find any method that might work with "execute" or "transaction" in the name
    const possibleMethods = Object.keys(wallet).filter(key => 
      typeof wallet[key] === 'function' && 
      (key.toLowerCase().includes('execute') || 
       key.toLowerCase().includes('transaction') ||
       key.toLowerCase().includes('sign'))
    );

    if (possibleMethods.length > 0) {
      const method = possibleMethods[0];
      console.log(`Trying wallet method: ${method}`);
      
      // Try with different parameter formats
      try {
        return await wallet[method]({
          transaction: tx,
        });
      } catch (err) {
        console.log(`Error with ${method} using transaction parameter:`, err);
        try {
          return await wallet[method]({
            transactionBlock: tx,
          });
        } catch (err2) {
          console.log(`Error with ${method} using transactionBlock parameter:`, err2);
          try {
            return await wallet[method](tx);
          } catch (err3) {
            console.log(`Error with ${method} using direct tx parameter:`, err3);
            throw new Error(`Failed to execute transaction with ${method}`);
          }
        }
      }
    }

    // If we get here, we couldn't find a compatible method
    throw new Error('No compatible wallet transaction method found. Please check your wallet connection.');
  } catch (error) {
    console.error('Error executing wallet transaction:', error);
    throw error;
  }
}
