import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDepartments() {
    console.log('🔄 Starting department name updates...');

    // Mapping of old names to new names
    const mappings = [
        { old: 'Executive / Accounting', new: 'Executive & Accounting' },
        { old: 'HK', new: 'Housekeeping' },
        { old: 'HR', new: 'Human Resource' },
        { old: 'Reservations / Sales', new: 'Reservations & Sales & Marketing' },
        { old: 'Reservations / Sales & Marketing', new: 'Reservations & Sales & Marketing' },
    ];

    try {
        // 1. Update IT Tickets
        console.log('\n🎫 Updating IT Tickets...');
        for (const map of mappings) {
            const result = await prisma.ticket.updateMany({
                where: { department: map.old },
                data: { department: map.new },
            });
            if (result.count > 0) {
                console.log(`   ✅ Changed "${map.old}" to "${map.new}": ${result.count} records`);
            }
        }

        // 2. Update Engineer Tickets
        console.log('\n🛠️ Updating Engineer Tickets...');
        for (const map of mappings) {
            const result = await prisma.engineerTicket.updateMany({
                where: { department: map.old },
                data: { department: map.new },
            });
            if (result.count > 0) {
                console.log(`   ✅ Changed "${map.old}" to "${map.new}": ${result.count} records`);
            }
        }

        console.log('\n✨ Update completed successfully!');

    } catch (error) {
        console.error('❌ Error updating departments:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateDepartments();
