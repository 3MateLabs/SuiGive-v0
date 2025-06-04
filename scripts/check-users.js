// Script to check existing users
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Existing users:', users.length);
    
    if (users.length > 0) {
      users.forEach(u => console.log('User Address:', u.address));
    } else {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
