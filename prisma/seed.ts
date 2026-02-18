import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const engineerPassword = await bcrypt.hash('engineer123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin:', admin.username);

  // Create IT Admin User
  const itAdmin = await prisma.user.upsert({
    where: { username: 'itadmin' },
    update: {},
    create: {
      username: 'itadmin',
      password: engineerPassword,
      role: 'IT_ADMIN',
    },
  });
  console.log('✅ Created IT Admin:', itAdmin.username);

  // Create Engineer Admin User
  const engineerAdmin = await prisma.user.upsert({
    where: { username: 'engineer1' },
    update: {},
    create: {
      username: 'engineer1',
      password: engineerPassword,
      role: 'ENGINEER_ADMIN',
    },
  });
  console.log('✅ Created Engineer Admin:', engineerAdmin.username);

  // Create Regular User
  const user = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log('✅ Created user:', user.username);

  // Create Sample Ticket (skip if exists)
  const existingTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'EGPB-IT25-00001' },
  });

  if (existingTicket) {
    console.log('⏭️  Sample ticket already exists: EGPB-IT25-00001');
  } else {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: 'EGPB-IT25-00001',
        title: 'ทดสอบระบบ Ticket',
        description: 'นี่คือ ticket ตัวอย่างสำหรับทดสอบระบบ',
        department: 'IT',
        location: 'อาคาร A ชั้น 1',
        typeOfDamage: 'Hardware',
        status: 'NEW',
        userId: user.id,
      },
    });
    console.log('✅ Created sample ticket:', ticket.ticketNumber);
  }

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Test Users:');
  console.log('┌──────────────┬──────────────┬─────────────────┐');
  console.log('│ Username     │ Password     │ Role            │');
  console.log('├──────────────┼──────────────┼─────────────────┤');
  console.log('│ admin        │ admin123     │ ADMIN           │');
  console.log('│ itadmin      │ engineer123  │ IT_ADMIN        │');
  console.log('│ engineer1    │ engineer123  │ ENGINEER_ADMIN  │');
  console.log('│ user1        │ user123      │ USER            │');
  console.log('└──────────────┴──────────────┴─────────────────┘');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

