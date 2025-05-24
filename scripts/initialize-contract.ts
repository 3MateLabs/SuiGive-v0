import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromB64 } from '@mysten/sui/utils';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SUI_CONFIG_PATH = path.join(__dirname, '..', 'lib', 'sui-config.ts');
const PACKAGE_ID = '0x5c7414d9c80d574eb954fb8b0be1aac9af117bce19866a33f562776438c659cd';
const TREASURY_ID = '0xf4f215afefb15624c0993f8313f2507823cd86a1d11ed90b36034381f9ba0f55';

// Initialize Sui client
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io',
});

async function main() {
  try {
    console.log('Initializing SuiGive enhanced contract...');
    
    // Load private key from environment
    const privateKeyBase64 = process.env.SUI_PRIVATE_KEY;
    if (!privateKeyBase64) {
      throw new Error('SUI_PRIVATE_KEY environment variable is not set');
    }
    
    // Create keypair from private key
    const privateKeyBytes = fromB64(privateKeyBase64);
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`Using address: ${address}`);
    
    // Initialize Registry
    console.log('Creating Registry object...');
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::crowdfunding::init`,
      arguments: [],
    });
    
    const { digest, effects } = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    
    console.log(`Transaction executed with digest: ${digest}`);
    
    // Extract Registry ID from transaction effects
    let registryId = '';
    if (effects?.created) {
      const registryObject = effects.created.find(obj => 
        obj.type && obj.type.includes('::crowdfunding::Registry')
      );
      
      if (registryObject && registryObject.reference) {
        registryId = registryObject.reference.objectId;
        console.log(`Registry created with ID: ${registryId}`);
      }
    }
    
    if (!registryId) {
      console.error('Failed to extract Registry ID from transaction effects');
      return;
    }
    
    // Update sui-config.ts file
    console.log('Updating sui-config.ts...');
    const configContent = fs.readFileSync(SUI_CONFIG_PATH, 'utf8');
    
    // Replace Registry ID
    const updatedConfig = configContent.replace(
      /REGISTRY_ID: '.*'/,
      `REGISTRY_ID: '${registryId}'`
    );
    
    fs.writeFileSync(SUI_CONFIG_PATH, updatedConfig);
    console.log('Configuration updated successfully');
    
    console.log('\nSuiGive enhanced contract initialized successfully!');
    console.log('=================================================');
    console.log(`Package ID: ${PACKAGE_ID}`);
    console.log(`Registry ID: ${registryId}`);
    console.log(`Treasury ID: ${TREASURY_ID}`);
    console.log('=================================================');
    console.log('You can now start using the enhanced SuiGive contract!');
    
  } catch (error) {
    console.error('Error initializing contract:', error);
  }
}

main();
