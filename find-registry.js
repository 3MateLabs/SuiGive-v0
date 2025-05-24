const { SuiClient } = require('@mysten/sui/client');

// Configuration
const PACKAGE_ID = '0xbd8a4e3dc8496a6b4cd037976688ce3d54bc156ccd93fd02cffa6ae2ad34c90a';

// Initialize Sui client with explicit URL
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

// Find shared objects of a specific type
async function findSharedObjects(type) {
  try {
    console.log(`Searching for shared objects of type: ${type}`);
    const objects = await client.getOwnedObjects({
      owner: 'Immutable',
      filter: { StructType: type },
      options: { showContent: true }
    });
    return objects.data;
  } catch (e) {
    console.error('Error finding shared objects:', e);
    return [];
  }
}

// Find the Registry object
async function findRegistry() {
  const registryType = `${PACKAGE_ID}::crowdfunding::Registry`;
  console.log(`Looking for Registry with type: ${registryType}`);
  const objects = await findSharedObjects(registryType);
  console.log('Found objects:', objects);
  if (objects.length > 0) {
    return objects[0].data.objectId;
  }
  throw new Error('Registry not found');
}

// Find the SgSuiTreasury object
async function findTreasury() {
  const treasuryType = `${PACKAGE_ID}::sg_sui_token::SgSuiTreasury`;
  console.log(`Looking for Treasury with type: ${treasuryType}`);
  const objects = await findSharedObjects(treasuryType);
  console.log('Found treasury objects:', objects);
  if (objects.length > 0) {
    return objects[0].data.objectId;
  }
  throw new Error('Treasury not found');
}

// Find all shared objects created by the package
async function findSharedObjectsByPackage() {
  try {
    console.log(`Looking for shared objects from package: ${PACKAGE_ID}`);
    
    // Try to find Registry
    const registryType = `${PACKAGE_ID}::crowdfunding::Registry`;
    console.log(`Searching for Registry: ${registryType}`);
    
    // Try to find SgSuiTreasury
    const treasuryType = `${PACKAGE_ID}::sg_sui_token::SgSuiTreasury`;
    console.log(`Searching for Treasury: ${treasuryType}`);
    
    // Get dynamic fields
    console.log('Querying for shared objects...');
    
    // Use queryTransactionBlocks to find transactions related to our package
    const txs = await client.queryTransactionBlocks({
      filter: {
        InputObject: PACKAGE_ID
      },
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true
      },
      limit: 10
    });
    
    console.log(`Found ${txs.data.length} transactions related to the package`);
    
    if (txs.data.length > 0) {
      console.log('Transaction digest:', txs.data[0].digest);
      console.log('Transaction data:', JSON.stringify(txs.data[0], null, 2));
    }
    
    return txs.data;
  } catch (e) {
    console.error('Error finding shared objects:', e);
    return [];
  }
}

// Run the functions
(async () => {
  try {
    console.log('Finding shared objects by package...');
    const txs = await findSharedObjectsByPackage();
    
    if (txs.length > 0) {
      console.log('\nAnalyzing transaction effects to find shared objects...');
      
      // Look for created objects in the transaction effects
      for (const tx of txs) {
        if (tx.effects && tx.effects.created) {
          console.log(`\nFound ${tx.effects.created.length} created objects in transaction ${tx.digest}`);
          
          for (const obj of tx.effects.created) {
            console.log(`Object ID: ${obj.reference.objectId}`);
            console.log(`Object Type: ${obj.objectType}`);
            console.log(`Owner: ${JSON.stringify(obj.owner)}`);
            console.log('---');
          }
        }
      }
    }
    
    console.log('\nTrying to find Registry directly...');
    try {
      const registryId = await findRegistry();
      console.log('Registry found:', registryId);
    } catch (e) {
      console.error('Error finding Registry:', e.message);
    }
    
    console.log('\nTrying to find Treasury directly...');
    try {
      const treasuryId = await findTreasury();
      console.log('Treasury found:', treasuryId);
    } catch (e) {
      console.error('Error finding Treasury:', e.message);
    }
  } catch (e) {
    console.error('Error in main function:', e);
  }
})();
