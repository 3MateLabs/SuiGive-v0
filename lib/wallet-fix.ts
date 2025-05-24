"use client";

/**
 * Wallet compatibility layer for SuiGive
 * This provides a unified interface for different wallet implementations
 */

// Function to execute a transaction with any wallet implementation
export async function executeWalletTransaction(wallet: any, tx: any) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  // Log available methods for debugging
  console.log('Wallet API methods:', Object.keys(wallet).filter(k => typeof wallet[k] === 'function'));
  
  try {
    // Try different methods based on what's available in the wallet
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      console.log('Using signAndExecuteTransactionBlock method');
      return await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });
    } 
    
    if (typeof wallet.signTransaction === 'function') {
      console.log('Using signTransaction method');
      return await wallet.signTransaction({
        transaction: tx,
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

    if (typeof wallet.executeTransaction === 'function') {
      console.log('Using executeTransaction method');
      return await wallet.executeTransaction(tx);
    }

    // Try direct execution as a last resort
    if (typeof wallet.execute === 'function') {
      console.log('Using execute method');
      return await wallet.execute(tx);
    }

    // If we get here, we couldn't find a compatible method
    throw new Error('No compatible wallet transaction method found. Available methods: ' + 
      Object.keys(wallet).filter(k => typeof wallet[k] === 'function').join(', '));
  } catch (error) {
    console.error('Error executing wallet transaction:', error);
    throw error;
  }
}
