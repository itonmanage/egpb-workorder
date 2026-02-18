import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllData() {
    try {
        // Count all data
        const ticketCount = await prisma.ticket.count();
        const engineerTicketCount = await prisma.engineerTicket.count();
        const userCount = await prisma.user.count();
        const imageCount = await prisma.ticketImage.count();
        const commentCount = await prisma.ticketComment.count();

        console.log('📊 Complete Database Status:');
        console.log('═'.repeat(60));
        console.log(`   IT Tickets:          ${ticketCount}`);
        console.log(`   Engineer Tickets:    ${engineerTicketCount}`);
        console.log(`   Users:               ${userCount}`);
        console.log(`   Ticket Images:       ${imageCount}`);
        console.log(`   Ticket Comments:     ${commentCount}`);
        console.log('═'.repeat(60));

        if (ticketCount > 0) {
            console.log('\n📋 All IT Tickets:');
            const allTickets = await prisma.ticket.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    ticketNumber: true,
                    title: true,
                    department: true,
                    status: true,
                    createdAt: true,
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            });

            allTickets.forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.ticketNumber} - ${t.title || 'No title'}`);
                console.log(`      Department: ${t.department || 'N/A'} | Status: ${t.status}`);
                console.log(`      Created: ${new Date(t.createdAt).toLocaleString('th-TH')} by ${t.user.username}`);
                console.log('');
            });
        }

        if (engineerTicketCount > 0) {
            console.log('\n🔧 All Engineer Tickets:');
            const allEngTickets = await prisma.engineerTicket.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    ticketNumber: true,
                    title: true,
                    department: true,
                    status: true,
                    createdAt: true,
                },
            });

            allEngTickets.forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.ticketNumber} - ${t.title || 'No title'}`);
                console.log(`      Department: ${t.department || 'N/A'} | Status: ${t.status}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllData();
