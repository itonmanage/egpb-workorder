import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetEngineerTickets() {
    console.log('🔄 Starting Engineer Tickets reset...');
    console.log('');

    try {
        // Delete all engineer ticket related data
        console.log('📋 Deleting engineer ticket comments...');
        const deletedComments = await prisma.engineerTicketComment.deleteMany({});
        console.log(`   ✅ Deleted ${deletedComments.count} comments`);

        console.log('📋 Deleting engineer ticket views...');
        const deletedViews = await prisma.engineerTicketView.deleteMany({});
        console.log(`   ✅ Deleted ${deletedViews.count} views`);

        console.log('📋 Deleting engineer ticket activities...');
        const deletedActivities = await prisma.engineerTicketActivity.deleteMany({});
        console.log(`   ✅ Deleted ${deletedActivities.count} activities`);

        console.log('📋 Deleting engineer ticket images...');
        const deletedImages = await prisma.engineerTicketImage.deleteMany({});
        console.log(`   ✅ Deleted ${deletedImages.count} images`);

        console.log('📋 Deleting engineer tickets...');
        const deletedTickets = await prisma.engineerTicket.deleteMany({});
        console.log(`   ✅ Deleted ${deletedTickets.count} tickets`);

        console.log('');
        console.log('✅ Engineer Tickets reset completed successfully!');
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

resetEngineerTickets();
