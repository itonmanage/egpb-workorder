import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
    try {
        const totalTickets = await prisma.engineerTicket.count();
        const statusCounts = await prisma.engineerTicket.groupBy({
            by: ['status'],
            _count: true,
        });

        const latestTicket = await prisma.engineerTicket.findFirst({
            orderBy: { ticketNumber: 'desc' },
            select: {
                ticketNumber: true,
                title: true,
                status: true,
                createdAt: true,
            },
        });

        console.log('📊 Import Verification Report');
        console.log('═'.repeat(60));
        console.log(`   Total Tickets: ${totalTickets}`);
        console.log('');
        console.log('   Status Breakdown:');
        statusCounts.forEach(s => {
            console.log(`     ${s.status}: ${s._count}`);
        });
        console.log('');
        console.log(`   Latest Ticket: ${latestTicket?.ticketNumber}`);
        console.log(`   Title: ${latestTicket?.title || 'N/A'}`);
        console.log(`   Status: ${latestTicket?.status}`);
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyImport();
