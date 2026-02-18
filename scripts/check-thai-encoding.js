// Check Thai Characters in Database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkThaiCharacters() {
    try {
        console.log('\n=== Checking Thai Characters in Database ===\n');

        // Check Engineer Tickets with Thai characters
        const thaiTickets = await prisma.engineerTicket.findMany({
            where: {
                ticketNumber: {
                    gte: 'EGPB-EN25-00560',
                    lte: 'EGPB-EN25-00565'
                }
            },
            select: {
                ticketNumber: true,
                title: true,
                description: true
            },
            orderBy: { ticketNumber: 'asc' }
        });

        console.log('Sample Engineer Tickets with Thai text:\n');
        thaiTickets.forEach(ticket => {
            console.log(`Ticket: ${ticket.ticketNumber}`);
            console.log(`Title: ${ticket.title}`);
            console.log(`Description: ${ticket.description || 'N/A'}`);
            console.log('---');
        });

        console.log('\n=== Verification ===');
        console.log('If you see Thai characters correctly above, the database is fine!');
        console.log('If you see garbled text, there might be an encoding issue.');
        console.log('\nNote: PowerShell/CMD may not display Thai correctly,');
        console.log('but the data in the database is still correct.');
        console.log('\nTo view Thai text properly:');
        console.log('1. Open Prisma Studio: npx prisma studio');
        console.log('2. Visit: http://localhost:5555');
        console.log('3. Browse the engineer_tickets table');
        console.log('');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkThaiCharacters();
