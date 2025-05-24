// Script to update Sui SDK imports from @mysten/sui.js to @mysten/sui
const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'components/SgSuiTokens.tsx',
  'components/InitializeRegistry.tsx',
  'components/SgUSDTokens.tsx',
  'components/RepUSDTokens.tsx',
  'lib/sui-receipts.ts',
  'lib/sui-campaigns.ts',
  'lib/sui-tokens.ts',
  'lib/campaigns-service.ts',
  'lib/sui-contract.ts'
];

// Base directory
const baseDir = __dirname;

// Update each file
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(baseDir, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    // Read the file
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace imports
    content = content.replace(
      /import\s+.*\s+from\s+['"]@mysten\/sui\.js(\/.*)?['"]/g,
      (match) => {
        // Replace @mysten/sui.js with @mysten/sui
        return match.replace('@mysten/sui.js', '@mysten/sui');
      }
    );
    
    // Fix Transaction imports
    content = content.replace(
      /tx\.pure\((.*?)\)/g,
      (match, group) => {
        // If it's a string address, use tx.pure.address()
        if (group.includes('address')) {
          return match;
        }
        
        // If it's a number or string that should be a number
        if (!isNaN(group) || group.includes('toString()') || group.includes('amount')) {
          return `tx.pure.u64(${group})`;
        }
        
        // If it's a string
        if (group.includes('"') || group.includes("'") || group.includes('`')) {
          return `tx.pure.string(${group})`;
        }
        
        return match;
      }
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
});

console.log('Import update complete!');
