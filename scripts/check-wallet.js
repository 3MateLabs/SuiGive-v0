/**
 * Check if a wallet address exists in the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWallet(address) {
  try {
    console.log(`Checking for wallet address: ${address}`);
    
    const user = await prisma.user.findUnique({
      where: { address },
    });
    
    if (user) {
      console.log('User found in database:');
      console.log(JSON.stringify(user, null, 2));
      return true;
    } else {
      console.log('User not found in database');
      return false;
    }
  } catch (error) {
    console.error('Error checking wallet:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get wallet address from command line arguments
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('Please provide a wallet address as an argument');
  process.exit(1);
}

checkWallet(walletAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
