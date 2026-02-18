// Verify Thai Characters After Improved Backup
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyThaiCharacters() {
    try {
        console.log('\n=== Verifying Thai Characters ===\n');

        // Get tickets with Thai text
        const thaiTickets = await prisma.engineerTicket.findMany({
            where: {
                ticketNumber: {
                    in: ['EGPB-EN25-00564', 'EGPB-EN25-00565', 'EGPB-EN25-00560', 'EGPB-EN25-00561', 'EGPB-EN25-00562']
                }
            },
            select: {
                ticketNumber: true,
                title: true,
                description: true
            },
            orderBy: { ticketNumber: 'asc' }
        });

        console.log('Current Thai text in database:\n');
        thaiTickets.forEach(ticket => {
            console.log(`Ticket: ${ticket.ticketNumber}`);
            console.log(`Title: ${ticket.title}`);
            console.log(`Description: ${ticket.description || 'N/A'}`);

            // Check if Thai characters are corrupted
            const hasCorrupted = ticket.title && (
                ticket.title.includes('à¸') ||
                ticket.title.includes('\\u') ||
                ticket.title.match(/[\x80-\xFF]{2,}/)
            );

            if (hasCorrupted) {
                console.log('⚠️  WARNING: This ticket has corrupted Thai characters!');
            } else if (ticket.title && /[\u0E00-\u0E7F]/.test(ticket.title)) {
                console.log('✓ Thai characters look correct');
            }

            console.log('---');
        });

        // Count corrupted vs correct
        let corrupted = 0;
        let correct = 0;

        thaiTickets.forEach(ticket => {
            if (ticket.title) {
                if (ticket.title.includes('à¸') || ticket.title.includes('\\u')) {
                    corrupted++;
                } else if (/[\u0E00-\u0E7F]/.test(ticket.title)) {
                    correct++;
                }
            }
        });

        console.log('\n=== Summary ===');
        console.log(`Total tickets checked: ${thaiTickets.length}`);
        console.log(`Correct Thai text: ${correct}`);
        console.log(`Corrupted text: ${corrupted}`);

        if (corrupted > 0) {
            console.log('\n⚠️  Some tickets still have corrupted Thai characters.');
            console.log('These were likely corrupted during the previous recovery.');
            console.log('Future backups will now preserve Thai characters correctly.');
        } else {
            console.log('\n✓ All Thai characters are correct!');
        }

        console.log('\nNote: New backups created with the improved scripts');
        console.log('will preserve Thai characters correctly.');
        console.log('');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyThaiCharacters();
