const { SuiClient } = require('@mysten/sui/client');
const { TransactionBlock } = require('@mysten/sui/transactions');

// Configuration
const PACKAGE_ID = '0xce8715edf77e5759c997fecc7d2ab96765997123d13349eff064cf20072efb00';
const CAMPAIGN_ID = '0xfc4729db70ce3277f513035e683ef6bd628f8b770616212ec096259b882043d9';
const TREASURY_CAP_ID = '0xe45271faef793f74039dbe963da9a8ab9d7fda8c9169fe3f8566ca5533b8bc79';
const DONATION_AMOUNT = 50000000; // 0.05 SUI

// Initialize Sui client with explicit URL
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

async function donate() {
  try {
    console.log('Creating donation transaction...');
    
    // Create transaction block
    const tx = new TransactionBlock();
    
    // Split a coin for donation
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(DONATION_AMOUNT)]);
    
    // Call the donate function
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        tx.object(CAMPAIGN_ID),
        coin,
        tx.object(TREASURY_CAP_ID),
        tx.pure(false) // not anonymous
      ]
    });
    
    // Get the transaction bytes for signing
    const txBytes = await tx.build({ client });
    
    console.log('Transaction created successfully!');
    console.log('To execute this transaction, run:');
    console.log(`sui client execute-transaction-block --tx-bytes ${txBytes.toString('base64')} --gas-budget 10000000`);
    
    return txBytes.toString('base64');
  } catch (e) {
    console.error('Error creating donation transaction:', e);
    throw e;
  }
}

// Run the function
donate().catch(console.error);
