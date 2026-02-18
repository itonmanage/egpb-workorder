/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix tickets that have year 1482 in createdAt or updatedAt
 * Convert to year 2025 (add 543 years)
 */
async function fixYear1482() {
    try {
        console.log('=== Starting Year Conversion (1482 → 2025) ===\n');

        const YEAR_DIFF = 543; // 2025 - 1482 = 543

        // Fix IT Tickets
        console.log('Checking IT Tickets...');
        const itTicketsToFix = await prisma.ticket.findMany({
            where: {
                OR: [
                    { createdAt: { lt: new Date('2000-01-01') } },
                    { updatedAt: { lt: new Date('2000-01-01') } }
                ]
            },
            select: {
                id: true,
                ticketNumber: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log(`Found ${itTicketsToFix.length} IT tickets with year < 2000`);

        if (itTicketsToFix.length > 0) {
            console.log('Converting IT tickets...');
            for (const ticket of itTicketsToFix) {
                const newCreatedAt = new Date(ticket.createdAt);
                newCreatedAt.setFullYear(newCreatedAt.getFullYear() + YEAR_DIFF);

                const newUpdatedAt = new Date(ticket.updatedAt);
                newUpdatedAt.setFullYear(newUpdatedAt.getFullYear() + YEAR_DIFF);

                await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        createdAt: newCreatedAt,
                        updatedAt: newUpdatedAt,
                    }
                });
                console.log(`  ✓ ${ticket.ticketNumber}: ${ticket.createdAt.getFullYear()} → ${newCreatedAt.getFullYear()}`);
            }
            console.log(`✓ Converted ${itTicketsToFix.length} IT tickets\n`);
        } else {
            console.log('No IT tickets to convert\n');
        }

        // Fix Engineer Tickets
        console.log('Checking Engineer Tickets...');
        const engineerTicketsToFix = await prisma.engineerTicket.findMany({
            where: {
                OR: [
                    { createdAt: { lt: new Date('2000-01-01') } },
                    { updatedAt: { lt: new Date('2000-01-01') } }
                ]
            },
            select: {
                id: true,
                ticketNumber: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log(`Found ${engineerTicketsToFix.length} Engineer tickets with year < 2000`);

        if (engineerTicketsToFix.length > 0) {
            console.log('Converting Engineer tickets...');
            for (const ticket of engineerTicketsToFix) {
                const newCreatedAt = new Date(ticket.createdAt);
                newCreatedAt.setFullYear(newCreatedAt.getFullYear() + YEAR_DIFF);

                const newUpdatedAt = new Date(ticket.updatedAt);
                newUpdatedAt.setFullYear(newUpdatedAt.getFullYear() + YEAR_DIFF);

                await prisma.engineerTicket.update({
                    where: { id: ticket.id },
                    data: {
                        createdAt: newCreatedAt,
                        updatedAt: newUpdatedAt,
                    }
                });
                console.log(`  ✓ ${ticket.ticketNumber}: ${ticket.createdAt.getFullYear()} → ${newCreatedAt.getFullYear()}`);
            }
            console.log(`✓ Converted ${engineerTicketsToFix.length} Engineer tickets\n`);
        } else {
            console.log('No Engineer tickets to convert\n');
        }

        // Verify the fix
        console.log('=== Verification ===');
        const itCountOld = await prisma.ticket.count({
            where: { createdAt: { lt: new Date('2000-01-01') } }
        });

        const engCountOld = await prisma.engineerTicket.count({
            where: { createdAt: { lt: new Date('2000-01-01') } }
        });

        const itCount2025 = await prisma.ticket.count({
            where: {
                createdAt: {
                    gte: new Date('2025-01-01'),
                    lt: new Date('2026-01-01'),
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

        console.log(`IT Tickets with year < 2000: ${itCountOld}`);
        console.log(`Engineer Tickets with year < 2000: ${engCountOld}`);
        console.log(`IT Tickets in 2025: ${itCount2025}`);
        console.log(`Engineer Tickets in 2025: ${engCount2025}`);

        if (itCountOld === 0 && engCountOld === 0) {
            console.log('\n✓ All tickets successfully converted to year 2025!');
        } else {
            console.log('\n⚠ Warning: Some tickets still have old years');
        }

    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixYear1482()
    .then(() => {
        console.log('\n=== Conversion Complete ===');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to convert years:', error);
        process.exit(1);
    });
