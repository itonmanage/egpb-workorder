// Check for any deletion activities
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeletionActivities() {
    try {
        console.log('\n=== Checking for Deletion Activities ===\n');

        // Check if user_activities table exists and has data
        const activityCount = await prisma.userActivity.count();
        console.log(`Total user activities: ${activityCount}`);

        if (activityCount > 0) {
            // Look for any delete-related activities
            const deleteActivities = await prisma.userActivity.findMany({
                where: {
                    OR: [
                        { action: { contains: 'delete', mode: 'insensitive' } },
                        { action: { contains: 'remove', mode: 'insensitive' } },
                        { details: { contains: 'delete', mode: 'insensitive' } },
                        { details: { contains: 'remove', mode: 'insensitive' } }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    user: {
                        select: {
                            username: true,
                            fullName: true,
                            role: true
                        }
                    }
                }
            });

            console.log(`\nFound ${deleteActivities.length} deletion-related activities:\n`);

            deleteActivities.forEach(activity => {
                console.log(`Date: ${activity.createdAt.toISOString()}`);
                console.log(`User: ${activity.user?.username || 'Unknown'} (${activity.user?.fullName || 'N/A'})`);
                console.log(`Action: ${activity.action}`);
                console.log(`Details: ${activity.details || 'N/A'}`);
                console.log('---');
            });
        } else {
            console.log('\nNo user activities found in database.');
            console.log('Activity logging may not be enabled.');
        }

        // Check for any patterns in existing tickets
        console.log('\n=== Analyzing Ticket Number Gaps ===\n');

        const itTickets = await prisma.ticket.findMany({
            select: { ticketNumber: true },
            orderBy: { ticketNumber: 'asc' }
        });

        const engTickets = await prisma.engineerTicket.findMany({
            select: { ticketNumber: true },
            orderBy: { ticketNumber: 'asc' }
        });

        console.log(`IT Tickets range: ${itTickets[0]?.ticketNumber} to ${itTickets[itTickets.length - 1]?.ticketNumber}`);
        console.log(`Total IT tickets: ${itTickets.length}`);

        console.log(`\nEngineer Tickets range: ${engTickets[0]?.ticketNumber} to ${engTickets[engTickets.length - 1]?.ticketNumber}`);
        console.log(`Total Engineer tickets: ${engTickets.length}`);

        // Check for gaps
        const itNumbers = itTickets.map(t => parseInt(t.ticketNumber.split('-')[2]));
        const engNumbers = engTickets.map(t => parseInt(t.ticketNumber.split('-')[2]));

        const itMin = Math.min(...itNumbers);
        const itMax = Math.max(...itNumbers);
        const engMin = Math.min(...engNumbers);
        const engMax = Math.max(...engNumbers);

        console.log(`\nIT Ticket number range: ${itMin} to ${itMax} (expected: ${itMax - itMin + 1}, actual: ${itTickets.length})`);
        console.log(`Missing IT tickets: ${(itMax - itMin + 1) - itTickets.length}`);

        console.log(`\nEngineer Ticket number range: ${engMin} to ${engMax} (expected: ${engMax - engMin + 1}, actual: ${engTickets.length})`);
        console.log(`Missing Engineer tickets: ${(engMax - engMin + 1) - engTickets.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDeletionActivities();
