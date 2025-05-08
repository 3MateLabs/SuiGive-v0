"use client";

/**
 * Direct wallet fix for SuiGive
 * This provides a solution for the specific wallet integration issue
 */

// Function to directly access the wallet methods
export async function executeDirectTransaction(wallet: any, tx: any) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  // Log the wallet object structure for debugging
  console.log('Wallet object structure:', wallet);
  
  // Check if wallet.currentWallet exists (common pattern in some wallet SDKs)
  const actualWallet = wallet.currentWallet || wallet.wallet || wallet;
  
  // Log available methods for debugging
  console.log('Wallet type:', typeof actualWallet);
  console.log('Is wallet an object?', actualWallet !== null && typeof actualWallet === 'object');
  
  // Try to access the methods on the wallet object
  if (actualWallet && typeof actualWallet === 'object') {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(actualWallet))
      .filter(name => typeof actualWallet[name] === 'function');
    console.log('Available methods on wallet prototype:', methods);
    
    // Also log direct properties
    console.log('Direct wallet properties:', Object.keys(actualWallet));
  }

  // Try to access the signAndExecuteTransactionBlock method
  // First check if it's a function property
  if (actualWallet.signAndExecuteTransactionBlock && typeof actualWallet.signAndExecuteTransactionBlock === 'function') {
    console.log('Found signAndExecuteTransactionBlock as a direct method');
    return await actualWallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
  }
  
  // Check if it's inside a nested property like 'wallet.signTransaction'
  if (actualWallet.signTransaction && typeof actualWallet.signTransaction === 'function') {
    console.log('Found signTransaction method');
    return await actualWallet.signTransaction({
      transaction: tx,
    });
  }

  // Check if there's a 'wallet.adapter' property (common in some wallet SDKs)
  if (actualWallet.adapter && typeof actualWallet.adapter === 'object') {
    console.log('Found wallet.adapter property');
    const adapter = actualWallet.adapter;
    
    // Try methods on the adapter
    if (adapter.signAndExecuteTransactionBlock && typeof adapter.signAndExecuteTransactionBlock === 'function') {
      console.log('Using adapter.signAndExecuteTransactionBlock');
      return await adapter.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });
    }
    
    if (adapter.signTransaction && typeof adapter.signTransaction === 'function') {
      console.log('Using adapter.signTransaction');
      return await adapter.signTransaction({
        transaction: tx,
      });
    }
  }

  // Check if there's a 'wallet.features' property
  if (actualWallet.features && Array.isArray(actualWallet.features)) {
    console.log('Found wallet.features array:', actualWallet.features);
    
    // Look for transaction-related features
    const txFeature = actualWallet.features.find((f: any) => 
      f && typeof f === 'object' && 
      (f.signAndExecuteTransactionBlock || f.signTransaction || f.executeTransaction)
    );
    
    if (txFeature) {
      console.log('Found transaction feature:', txFeature);
      
      if (txFeature.signAndExecuteTransactionBlock) {
        return await txFeature.signAndExecuteTransactionBlock({
          transactionBlock: tx,
        });
      }
      
      if (txFeature.signTransaction) {
        return await txFeature.signTransaction({
          transaction: tx,
        });
      }
    }
  }

  // Last resort - check if the wallet is a proxy or has a special access pattern
  console.log('Trying to access wallet methods through special patterns...');
  
  // Try to get the raw wallet instance if it's wrapped
  const possibleWalletProps = ['wallet', 'instance', 'provider', 'connection', 'signer'];
  
  for (const prop of possibleWalletProps) {
    if (actualWallet[prop] && typeof actualWallet[prop] === 'object') {
      console.log(`Found ${prop} property on wallet`);
      const innerWallet = actualWallet[prop];
      
      if (innerWallet.signAndExecuteTransactionBlock && typeof innerWallet.signAndExecuteTransactionBlock === 'function') {
        console.log(`Using ${prop}.signAndExecuteTransactionBlock`);
        return await innerWallet.signAndExecuteTransactionBlock({
          transactionBlock: tx,
        });
      }
      
      if (innerWallet.signTransaction && typeof innerWallet.signTransaction === 'function') {
        console.log(`Using ${prop}.signTransaction`);
        return await innerWallet.signTransaction({
          transaction: tx,
        });
      }
    }
  }

  // If we get here, we need to examine the wallet structure more carefully
  console.error('Detailed wallet structure:', JSON.stringify(actualWallet, (key, value) => {
    if (typeof value === 'function') return 'function';
    return value;
  }, 2));
  
  throw new Error('No compatible wallet method found. Please check the console for detailed wallet structure and contact support.');
}
