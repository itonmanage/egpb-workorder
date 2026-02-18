import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTickets() {
    try {
        console.log('=== Checking Database Tickets ===\n');

        // Count IT Tickets
        const itTicketCount = await prisma.ticket.count();
        console.log(`IT Tickets: ${itTicketCount}`);

        // Count Engineer Tickets
        const engineerTicketCount = await prisma.engineerTicket.count();
        console.log(`Engineer Tickets: ${engineerTicketCount}`);

        console.log('\n=== Recent IT Tickets ===');
        const recentItTickets = await prisma.ticket.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                ticketNumber: true,
                title: true,
                status: true,
                createdAt: true,
                department: true
            }
        });

        if (recentItTickets.length > 0) {
            recentItTickets.forEach(ticket => {
                console.log(`- ${ticket.ticketNumber} | ${ticket.title || 'No title'} | ${ticket.status} | ${ticket.createdAt.toISOString()}`);
            });
        } else {
            console.log('No IT tickets found');
        }

        console.log('\n=== Recent Engineer Tickets ===');
        const recentEngTickets = await prisma.engineerTicket.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                ticketNumber: true,
                title: true,
                status: true,
                createdAt: true,
                department: true
            }
        });

        if (recentEngTickets.length > 0) {
            recentEngTickets.forEach(ticket => {
                console.log(`- ${ticket.ticketNumber} | ${ticket.title || 'No title'} | ${ticket.status} | ${ticket.createdAt.toISOString()}`);
            });
        } else {
            console.log('No Engineer tickets found');
        }

        // Check oldest tickets
        console.log('\n=== Oldest IT Tickets ===');
        const oldestItTickets = await prisma.ticket.findMany({
            take: 5,
            orderBy: { createdAt: 'asc' },
            select: {
                ticketNumber: true,
                title: true,
                createdAt: true
            }
        });

        if (oldestItTickets.length > 0) {
            oldestItTickets.forEach(ticket => {
                console.log(`- ${ticket.ticketNumber} | ${ticket.title || 'No title'} | ${ticket.createdAt.toISOString()}`);
            });
        }

        console.log('\n=== Oldest Engineer Tickets ===');
        const oldestEngTickets = await prisma.engineerTicket.findMany({
            take: 5,
            orderBy: { createdAt: 'asc' },
            select: {
                ticketNumber: true,
                title: true,
                createdAt: true
            }
        });

        if (oldestEngTickets.length > 0) {
            oldestEngTickets.forEach(ticket => {
                console.log(`- ${ticket.ticketNumber} | ${ticket.title || 'No title'} | ${ticket.createdAt.toISOString()}`);
            });
        }

    } catch (error) {
        console.error('Error checking tickets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTickets();
