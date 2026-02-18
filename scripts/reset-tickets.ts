import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script สำหรับลบข้อมูล Tickets ทั้งหมด (IT และ Engineer)
 * ⚠️ คำเตือน: ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้!
 */
async function main() {
  try {
    console.log('🗑️  Starting to delete all tickets...\n');

    // ลบ IT Tickets และข้อมูลที่เกี่ยวข้อง
    console.log('📋 Deleting IT Tickets...');

    const deletedITComments = await prisma.ticketComment.deleteMany({});
    console.log(`  ✓ Deleted ${deletedITComments.count} IT ticket comments`);

    const deletedITViews = await prisma.ticketView.deleteMany({});
    console.log(`  ✓ Deleted ${deletedITViews.count} IT ticket views`);

    const deletedITImages = await prisma.ticketImage.deleteMany({});
    console.log(`  ✓ Deleted ${deletedITImages.count} IT ticket images`);

    const deletedITTickets = await prisma.ticket.deleteMany({});
    console.log(`  ✓ Deleted ${deletedITTickets.count} IT tickets\n`);

    // ลบ Engineer Tickets และข้อมูลที่เกี่ยวข้อง
    console.log('🔧 Deleting Engineer Tickets...');

    const deletedEngComments = await prisma.engineerTicketComment.deleteMany({});
    console.log(`  ✓ Deleted ${deletedEngComments.count} Engineer ticket comments`);

    const deletedEngViews = await prisma.engineerTicketView.deleteMany({});
    console.log(`  ✓ Deleted ${deletedEngViews.count} Engineer ticket views`);

    const deletedEngImages = await prisma.engineerTicketImage.deleteMany({});
    console.log(`  ✓ Deleted ${deletedEngImages.count} Engineer ticket images`);

    const deletedEngTickets = await prisma.engineerTicket.deleteMany({});
    console.log(`  ✓ Deleted ${deletedEngTickets.count} Engineer tickets\n`);

    console.log('✅ All tickets deleted successfully!');
    console.log('📝 Note: Users are preserved. Ticket numbers will restart from 1 for new tickets.');

  } catch (error) {
    console.error('❌ Error deleting tickets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

