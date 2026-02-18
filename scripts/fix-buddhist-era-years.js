/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix tickets that were created with year 2568 (Buddhist Era) instead of 2025
 * This script will convert all dates from 2568 to 2025
 */
async function fixBuddhistEraYears() {
    try {
        console.log('=== Starting Year Conversion (2568 → 2025) ===\n');

        // Calculate the year difference (2568 - 2025 = 543 years)
        const YEAR_DIFF = 543;

        // Fix IT Tickets
        console.log('Checking IT Tickets...');
        const itTicketsToFix = await prisma.ticket.findMany({
            where: {
                createdAt: {
                    gte: new Date('2568-01-01'),
                }
            },
            select: {
                id: true,
                ticketNumber: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log(`Found ${itTicketsToFix.length} IT tickets with year 2568`);

        if (itTicketsToFix.length > 0) {
            console.log('Converting IT tickets...');
            for (const ticket of itTicketsToFix) {
                const newCreatedAt = new Date(ticket.createdAt);
                newCreatedAt.setFullYear(newCreatedAt.getFullYear() - YEAR_DIFF);

                const newUpdatedAt = new Date(ticket.updatedAt);
                newUpdatedAt.setFullYear(newUpdatedAt.getFullYear() - YEAR_DIFF);

                await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        createdAt: newCreatedAt,
                        updatedAt: newUpdatedAt,
                    }
                });
            }
            console.log(`✓ Converted ${itTicketsToFix.length} IT tickets\n`);
        } else {
            console.log('No IT tickets to convert\n');
        }

        // Fix Engineer Tickets
        console.log('Checking Engineer Tickets...');
        const engineerTicketsToFix = await prisma.engineerTicket.findMany({
            where: {
                createdAt: {
                    gte: new Date('2568-01-01'),
                }
            },
            select: {
                id: true,
                ticketNumber: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log(`Found ${engineerTicketsToFix.length} Engineer tickets with year 2568`);

        if (engineerTicketsToFix.length > 0) {
            console.log('Converting Engineer tickets...');
            for (const ticket of engineerTicketsToFix) {
                const newCreatedAt = new Date(ticket.createdAt);
                newCreatedAt.setFullYear(newCreatedAt.getFullYear() - YEAR_DIFF);

                const newUpdatedAt = new Date(ticket.updatedAt);
                newUpdatedAt.setFullYear(newUpdatedAt.getFullYear() - YEAR_DIFF);

                await prisma.engineerTicket.update({
                    where: { id: ticket.id },
                    data: {
                        createdAt: newCreatedAt,
                        updatedAt: newUpdatedAt,
                    }
                });
            }
            console.log(`✓ Converted ${engineerTicketsToFix.length} Engineer tickets\n`);
        } else {
            console.log('No Engineer tickets to convert\n');
        }

        // Verify the fix
        console.log('=== Verification ===');
        const itCount2025 = await prisma.ticket.count({
            where: {
                createdAt: {
                    gte: new Date('2025-01-01'),
                    lt: new Date('2026-01-01'),
                }
            }
        });

        const itCount2568 = await prisma.ticket.count({
            where: {
                createdAt: {
                    gte: new Date('2568-01-01'),
                }
            }
        });

        const engCount2025 = await prisma.engineerTicket.count({
            where: {
                createdAt: {
                    gte: new Date('2025-01-01'),
                    lt: new Date('2026-01-01'),
                }
            }
        });

        const engCount2568 = await prisma.engineerTicket.count({
            where: {
                createdAt: {
                    gte: new Date('2568-01-01'),
                }
            }
        });

        console.log(`IT Tickets in 2025: ${itCount2025}`);
        console.log(`IT Tickets in 2568: ${itCount2568}`);
        console.log(`Engineer Tickets in 2025: ${engCount2025}`);
        console.log(`Engineer Tickets in 2568: ${engCount2568}`);

        if (itCount2568 === 0 && engCount2568 === 0) {
            console.log('\n✓ All tickets successfully converted to year 2025!');
        } else {
            console.log('\n⚠ Warning: Some tickets still have year 2568');
        }

    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixBuddhistEraYears()
    .then(() => {
        console.log('\n=== Conversion Complete ===');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to convert years:', error);
        process.exit(1);
    });
