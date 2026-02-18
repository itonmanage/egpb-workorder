// Check if there are tickets with numbers 00001-00100
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMissingTickets() {
    try {
        console.log('\n=== Checking for Missing Ticket Numbers ===\n');

        // Check IT tickets 00001-00100
        const itLow = await prisma.ticket.findMany({
            where: {
                ticketNumber: {
                    gte: 'EGPB-IT25-00001',
                    lte: 'EGPB-IT25-00100'
                }
            },
            select: {
                ticketNumber: true,
                title: true,
                createdAt: true
            },
            orderBy: { ticketNumber: 'asc' }
        });

        console.log(`IT Tickets (00001-00100): ${itLow.length} found`);
        if (itLow.length > 0) {
            console.log('First few:');
            itLow.slice(0, 5).forEach(t => {
                console.log(`  - ${t.ticketNumber} | ${t.title || 'No title'} | ${t.createdAt.toISOString()}`);
            });
        } else {
            console.log('  ❌ NO TICKETS FOUND in range 00001-00100');
        }

        console.log('');

        // Check Engineer tickets 00001-00562
        const engLow = await prisma.engineerTicket.findMany({
            where: {
                ticketNumber: {
                    gte: 'EGPB-EN25-00001',
                    lte: 'EGPB-EN25-00562'
                }
            },
            select: {
                ticketNumber: true,
                title: true,
                createdAt: true
            },
            orderBy: { ticketNumber: 'asc' }
        });

        console.log(`Engineer Tickets (00001-00562): ${engLow.length} found`);
        if (engLow.length > 0) {
            console.log('First few:');
            engLow.slice(0, 5).forEach(t => {
                console.log(`  - ${t.ticketNumber} | ${t.title || 'No title'} | ${t.createdAt.toISOString()}`);
            });
        } else {
            console.log('  ❌ NO TICKETS FOUND in range 00001-00562');
        }

        console.log('\n=== Conclusion ===');
        if (itLow.length === 0 && engLow.length === 0) {
            console.log('🚨 TICKETS WITH LOW NUMBERS ARE MISSING!');
            console.log('   This explains why the count is lower.');
            console.log('   These tickets exist in backups but not in current database.');
        } else {
            console.log('✅ Tickets with low numbers exist in database.');
        }
        console.log('');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMissingTickets();
