// Script to test the frontend connection to the contract
const fs = require('fs');
const path = require('path');

// Read the sui-config.ts file directly
const configPath = path.join(__dirname, 'lib', 'sui-config.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract the values using regex
const packageIdMatch = configContent.match(/PACKAGE_ID: '([^']+)'/); 
const registryIdMatch = configContent.match(/REGISTRY_ID: '([^']+)'/); 
const treasuryIdMatch = configContent.match(/TREASURY_ID: '([^']+)'/); 
const treasuryCapIdMatch = configContent.match(/TREASURY_CAP_ID: '([^']+)'/); 

const SUI_CONFIG = {
  PACKAGE_ID: packageIdMatch ? packageIdMatch[1] : 'Not found',
  REGISTRY_ID: registryIdMatch ? registryIdMatch[1] : 'Not found',
  TREASURY_ID: treasuryIdMatch ? treasuryIdMatch[1] : 'Not found',
  TREASURY_CAP_ID: treasuryCapIdMatch ? treasuryCapIdMatch[1] : 'Not found'
};

console.log("Current SUI_CONFIG:");
console.log("PACKAGE_ID:", SUI_CONFIG.PACKAGE_ID);
console.log("REGISTRY_ID:", SUI_CONFIG.REGISTRY_ID);
console.log("TREASURY_ID:", SUI_CONFIG.TREASURY_ID);
console.log("TREASURY_CAP_ID:", SUI_CONFIG.TREASURY_CAP_ID);
