import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';


const prisma = new PrismaClient();

interface ImportTicket {
    ticketNumber: string;
    title?: string;
    description?: string;
    department?: string;
    location?: string;
    typeOfDamage: string;
    status: string;
    adminNotes?: string;
    assignTo?: string;
    informationBy?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

async function importEngineerTickets(filePath: string) {
    console.log('🔄 Starting Engineer Tickets import...');
    console.log('');

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        // Read import file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const tickets: ImportTicket[] = JSON.parse(fileContent);

        console.log(`📊 Found ${tickets.length} tickets to import`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;
        let maxTicketNumber = 0;

        for (const ticketData of tickets) {
            try {
                // Extract ticket number for tracking
                const ticketNumMatch = ticketData.ticketNumber.match(/(\d+)$/);
                if (ticketNumMatch) {
                    const num = parseInt(ticketNumMatch[1]);
                    if (num > maxTicketNumber) {
                        maxTicketNumber = num;
                    }
                }

                // Create ticket
                await prisma.engineerTicket.create({
                    data: {
                        ticketNumber: ticketData.ticketNumber,
                        title: ticketData.title || null,
                        description: ticketData.description || null,
                        department: ticketData.department || null,
                        location: ticketData.location || null,
                        typeOfDamage: ticketData.typeOfDamage,
                        status: ticketData.status as 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCEL',
                        adminNotes: ticketData.adminNotes || null,
                        assignTo: ticketData.assignTo || null,
                        informationBy: ticketData.informationBy || null,
                        userId: ticketData.userId,
                        createdAt: new Date(ticketData.createdAt),
                        updatedAt: new Date(ticketData.updatedAt),
                    },
                });

                console.log(`✅ Imported: ${ticketData.ticketNumber}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to import ${ticketData.ticketNumber}:`, error);
                errorCount++;
            }
        }

        console.log('');
        console.log('📊 Import Summary:');
        console.log(`   ✅ Successfully imported: ${successCount} tickets`);
        console.log(`   ❌ Failed: ${errorCount} tickets`);
        console.log(`   🔢 Highest ticket number: ${maxTicketNumber}`);
        console.log('');
        console.log('✅ Import completed!');
        console.log('');
        console.log('💡 Next ticket will be numbered from:', maxTicketNumber + 1);

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get import file from command line argument
const importFile = process.argv[2];

if (!importFile) {
    console.error('❌ Please provide import file path');
    console.log('');
    console.log('Usage: npm run import:engineer-tickets <import-file-path>');
    console.log('Example: npm run import:engineer-tickets data/engineer-tickets-import.json');
    process.exit(1);
}

importEngineerTickets(importFile);
