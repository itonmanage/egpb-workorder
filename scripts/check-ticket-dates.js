/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTicketDates() {
    try {
        console.log('=== Checking IT Tickets ===');

        // Get all IT tickets grouped by month
        const itTickets = await prisma.ticket.findMany({
            select: {
                id: true,
                ticketNumber: true,
                createdAt: true,
                typeOfDamage: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Total IT Tickets: ${itTickets.length}`);

        // Group by month
        const itByMonth = {};
        itTickets.forEach(ticket => {
            const month = ticket.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!itByMonth[month]) {
                itByMonth[month] = [];
            }
            itByMonth[month].push(ticket);
        });

        console.log('\nIT Tickets by Month:');
        Object.keys(itByMonth).sort().forEach(month => {
            console.log(`  ${month}: ${itByMonth[month].length} tickets`);
        });

        // Check December 2025 specifically
        const dec2025Start = new Date(2025, 11, 1); // December 1, 2025
        const dec2025End = new Date(2025, 11, 31, 23, 59, 59, 999); // December 31, 2025

        const itDec2025 = await prisma.ticket.count({
            where: {
                createdAt: {
                    gte: dec2025Start,
                    lte: dec2025End
                }
            }
        });

        console.log(`\nIT Tickets in December 2025 (using date filter): ${itDec2025}`);

        console.log('\n=== Checking Engineer Tickets ===');

        // Get all Engineer tickets grouped by month
        const engineerTickets = await prisma.engineerTicket.findMany({
            select: {
                id: true,
                ticketNumber: true,
                createdAt: true,
                typeOfDamage: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Total Engineer Tickets: ${engineerTickets.length}`);

        // Group by month
        const engByMonth = {};
        engineerTickets.forEach(ticket => {
            const month = ticket.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!engByMonth[month]) {
                engByMonth[month] = [];
            }
            engByMonth[month].push(ticket);
        });

        console.log('\nEngineer Tickets by Month:');
        Object.keys(engByMonth).sort().forEach(month => {
            console.log(`  ${month}: ${engByMonth[month].length} tickets`);
        });

        // Check December 2025 specifically
        const engDec2025 = await prisma.engineerTicket.count({
            where: {
                createdAt: {
                    gte: dec2025Start,
                    lte: dec2025End
                }
            }
        });

        console.log(`\nEngineer Tickets in December 2025 (using date filter): ${engDec2025}`);

        // Check year-to-date (2025)
        const startOfYear = new Date(2025, 0, 1);
        const itYTD = await prisma.ticket.count({
            where: {
                createdAt: { gte: startOfYear }
            }
        });

        const engYTD = await prisma.engineerTicket.count({
            where: {
                createdAt: { gte: startOfYear }
            }
        });

        console.log(`\n=== Year-to-Date 2025 ===`);
        console.log(`IT Tickets YTD: ${itYTD}`);
        console.log(`Engineer Tickets YTD: ${engYTD}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTicketDates();
