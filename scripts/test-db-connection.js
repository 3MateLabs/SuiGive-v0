// Script to test database connection and write operations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by querying users
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. Found ${userCount} users.`);
    
    // Generate test data
    const testAddress = `0xtest${Date.now()}`;
    const testAmount = '1000000000'; // 1 SUI
    const now = new Date();
    
    console.log(`Creating test user with address ${testAddress}...`);
    
    // Try to create a test user
    const user = await prisma.user.create({
      data: {
        address: testAddress,
        displayName: 'Test User',
        totalDonated: testAmount,
        donationCount: 1,
        firstDonation: now,
        lastDonation: now,
      }
    });
    
    console.log('Test user created successfully:', user);
    
    // Clean up test data
    await prisma.user.delete({
      where: { address: testAddress }
    });
    
    console.log('Test user deleted successfully. Database write operations working correctly.');
    
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('✅ Database connection and operations test PASSED');
      process.exit(0);
    } else {
      console.log('❌ Database connection and operations test FAILED');
      process.exit(1);
    }
  });
