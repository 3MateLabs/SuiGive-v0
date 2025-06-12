const { Transaction } = require('@mysten/sui/transactions');
const { SuiClient } = require('@mysten/sui/client');

const PACKAGE_ID = '0x69ef98c5a266ac2c109e764379b1ab2ea3a786c2a543277c2bef7a619a2308ff';
const CAMPAIGN_MANAGER_ID = '0xc6bd218faaccd0195918a301677c5a1066ac6316e0367cb397ee947546e17c48';

async function testTransaction() {
  try {
    const tx = new Transaction();
    
    // Get the campaign manager object
    const campaignManager = tx.object(CAMPAIGN_MANAGER_ID);
    
    // Create zero SUI coin for creation fee
    const creationFeeCoin = tx.splitCoins(tx.gas, [0]);
    
    // Create empty beneficial parties vector
    const emptyBeneficialPartiesVector = tx.makeMoveVec({
      elements: []
    });
    
    console.log('Building transaction...');
    
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::create_campaign`,
      typeArguments: ['0x2::sui::SUI'],
      arguments: [
        campaignManager,
        tx.pure.string('Test Campaign'),
        tx.pure.string('Test Description'),
        tx.pure.string('https://example.com/image.jpg'),
        tx.pure.string('Test'),
        tx.pure.u64(1000000000),
        tx.pure.u64(1800000000),
        emptyBeneficialPartiesVector,
        creationFeeCoin,
      ],
    });
    
    // Serialize to check if transaction builds correctly
    const bytes = await tx.build();
    console.log('Transaction built successfully\!');
    console.log('Transaction size:', bytes.length, 'bytes');
    
  } catch (error) {
    console.error('Error building transaction:', error);
  }
}

testTransaction();
EOF < /dev/null