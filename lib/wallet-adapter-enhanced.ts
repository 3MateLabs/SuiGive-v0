"use client";

/**
 * Enhanced wallet adapter for SuiGive
 * This provides a robust compatibility layer for different wallet implementations
 */

export async function executeTransaction(wallet: any, tx: any) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  // Log available methods for debugging
  const availableMethods = Object.keys(wallet).filter(k => typeof wallet[k] === 'function');
  console.log('Available wallet methods:', availableMethods);

  // First try the standard method
  if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
    try {
      console.log('Trying signAndExecuteTransactionBlock method');
      return await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });
    } catch (err) {
      console.error('Error with signAndExecuteTransactionBlock:', err);
      // Continue to other methods
    }
  }

  // Try alternative methods
  const methodsToTry = [
    {
      name: 'signAndExecuteTransaction',
      args: { transaction: tx }
    },
    {
      name: 'executeTransaction',
      args: { transaction: tx }
    },
    {
      name: 'executeTransaction',
      args: { transactionBlock: tx }
    },
    {
      name: 'signTransaction',
      args: { transaction: tx }
    },
    {
      name: 'executeMoveCall',
      args: tx
    },
    {
      name: 'execute',
      args: tx
    }
  ];

  // Try each method
  for (const method of methodsToTry) {
    if (typeof wallet[method.name] === 'function') {
      try {
        console.log(`Trying ${method.name} method`);
        return await wallet[method.name](method.args);
      } catch (err) {
        console.error(`Error with ${method.name}:`, err);
        // Continue to next method
      }
    }
  }

  // If we get here, try to find any method that might work
  const potentialMethods = availableMethods.filter(m => 
    m.toLowerCase().includes('transaction') || 
    m.toLowerCase().includes('execute') || 
    m.toLowerCase().includes('sign')
  );

  for (const methodName of potentialMethods) {
    try {
      console.log(`Trying potential method: ${methodName}`);
      // Try with different argument patterns
      try {
        return await wallet[methodName]({ transactionBlock: tx });
      } catch (e1) {
        try {
          return await wallet[methodName]({ transaction: tx });
        } catch (e2) {
          try {
            return await wallet[methodName](tx);
          } catch (e3) {
            // Continue to next method
          }
        }
      }
    } catch (err) {
      console.error(`Error with ${methodName}:`, err);
      // Continue to next method
    }
  }

  // If we get here, we couldn't find a compatible method
  console.error('Wallet object:', wallet);
  throw new Error(`No compatible wallet method found. Available methods: ${availableMethods.join(', ')}`);
}
