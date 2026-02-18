import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetITTickets() {
    console.log('🔄 Starting IT Tickets reset...');
    console.log('');

    try {
        // Delete all IT ticket related data
        console.log('📋 Deleting IT ticket comments...');
        const deletedComments = await prisma.ticketComment.deleteMany({});
        console.log(`   ✅ Deleted ${deletedComments.count} comments`);

        console.log('📋 Deleting IT ticket views...');
        const deletedViews = await prisma.ticketView.deleteMany({});
        console.log(`   ✅ Deleted ${deletedViews.count} views`);

        console.log('📋 Deleting IT ticket activities...');
        const deletedActivities = await prisma.ticketActivity.deleteMany({});
        console.log(`   ✅ Deleted ${deletedActivities.count} activities`);

        console.log('📋 Deleting IT ticket images...');
        const deletedImages = await prisma.ticketImage.deleteMany({});
        console.log(`   ✅ Deleted ${deletedImages.count} images`);

        console.log('📋 Deleting IT tickets...');
        const deletedTickets = await prisma.ticket.deleteMany({});
        console.log(`   ✅ Deleted ${deletedTickets.count} tickets`);

        console.log('');
        console.log('✅ IT Tickets reset completed successfully!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   - Tickets: ${deletedTickets.count}`);
        console.log(`   - Images: ${deletedImages.count}`);
        console.log(`   - Comments: ${deletedComments.count}`);
        console.log(`   - Views: ${deletedViews.count}`);
        console.log(`   - Activities: ${deletedActivities.count}`);
        console.log('');
        console.log('🎯 Ready for import!');

    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetITTickets();
