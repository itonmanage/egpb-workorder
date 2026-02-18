import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'ADMIN' },
                    { role: 'ENGINEER_ADMIN' },
                    { role: 'IT_ADMIN' }
                ]
            },
            select: {
                id: true,
                username: true,
                role: true,
            },
        });

        console.log('👥 Admin Users:');
        console.log('═'.repeat(60));
        users.forEach(user => {
            console.log(`   ${user.username.padEnd(20)} | ${user.role.padEnd(15)} | ${user.id}`);
        });
        console.log('═'.repeat(60));
        console.log('');
        console.log('💡 Copy the ID of the user you want to use for import');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findUsers();
