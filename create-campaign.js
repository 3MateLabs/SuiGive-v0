// Script to create a test campaign for SuiGive
const { execSync } = require('child_process');

// Import SUI_CONFIG directly
const SUI_CONFIG = {
  PACKAGE_ID: '0x0a5ab56616536ed12ed716562309fd4ad00248fa36c3f61cdd66e1e418cd20b7',
  REGISTRY_ID: '0xb25f06d3dd1b696516532485c9e472aa81327a2010a4955bbe68420e170d27bb',
  TREASURY_ID: '0x116db38a0513051c5cbe11dbde3bf18cb9ac6ee8f32ae2995d33fe7d4cfe53a9',
  TREASURY_CAP_ID: '0x4c2a1d244b053c46928f6912c6739521184f1d117f47963e0c5f5d7ae3eacba9'
};

// Campaign details
const campaignName = "Test Campaign";
const campaignDescription = "This is a test campaign created to verify NFT display functionality";
const imageUrl = "https://example.com/image.jpg";
const goalAmount = "1000000000"; // 1 SUI
const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
const category = "Test";

// Command to create a campaign
const command = `sui client call \
  --package ${SUI_CONFIG.PACKAGE_ID} \
  --module crowdfunding \
  --function create_campaign \
  --args ${SUI_CONFIG.REGISTRY_ID} "${campaignName}" "${campaignDescription}" "${imageUrl}" ${goalAmount} ${deadline} "${category}" \
  --gas-budget 100000000`;

console.log("Creating campaign with command:", command);

try {
  const output = execSync(command, { encoding: 'utf8' });
  console.log("Campaign created successfully!");
  console.log(output);
  
  // Extract campaign ID from output
  const campaignIdMatch = output.match(/ObjectID: (0x[a-fA-F0-9]+).*Campaign/);
  if (campaignIdMatch && campaignIdMatch[1]) {
    console.log("Campaign ID:", campaignIdMatch[1]);
    console.log("Add this ID to the SUI_CONFIG.CAMPAIGN_ID in lib/sui-config.ts");
  }
} catch (error) {
  console.error("Error creating campaign:", error.message);
}
