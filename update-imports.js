// Script to update imports from sui-config.ts to env-config.ts
const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'app/admin/setup/page.tsx',
  'components/SgSuiTokens.tsx',
  'components/InitializeRegistry.tsx',
  'components/SgUSDTokens.tsx',
  'components/RepUSDTokens.tsx',
  'hooks/useTransactionExecution.ts',
  'lib/sui-receipts.ts',
  'lib/sui-campaigns.ts',
  'lib/mock-wallet.ts',
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
    // Read the file
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace imports
    content = content.replace(
      /import\s+{\s*SUI_CONFIG\s*}\s+from\s+['"](@\/lib|\.\.\/lib|\.\/)\/?sui-config['"];/g,
      (match) => {
        // Preserve the same import style (relative or absolute)
        if (match.includes('@/lib')) {
          return `import { SUI_CONFIG } from '@/lib/env-config';`;
        } else if (match.includes('../lib')) {
          return `import { SUI_CONFIG } from '../lib/env-config';`;
        } else {
          return `import { SUI_CONFIG } from './env-config';`;
        }
      }
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
});

console.log('Import updates completed!');
