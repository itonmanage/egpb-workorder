import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface ExcelRow {
    'Ticket Number'?: string;
    'Location'?: string;
    'Description'?: string;
    'Department'?: string;
    'Area'?: string;
    'Type of Damage'?: string;
    'Status'?: string;
    'Admin Notes'?: string;
    'Assign To'?: string;
    'Information By'?: string;
    'Created At'?: string;
    'Last Updated'?: string;
    'Reporter'?: string;
    [key: string]: string | number | undefined;
}

// Status mapping
const statusMap: Record<string, string> = {
    'New': 'NEW',
    'On Process': 'IN_PROGRESS',
    'On Hold': 'ON_HOLD',
    'Done': 'DONE',
    'Cancel': 'CANCEL',
    'NEW': 'NEW',
    'IN_PROGRESS': 'IN_PROGRESS',
    'ON_HOLD': 'ON_HOLD',
    'DONE': 'DONE',
    'CANCEL': 'CANCEL',
};

async function importFromExcel(filePath: string, defaultUserId: string) {
    console.log('🔄 Starting Excel import...');
    console.log(`📁 File: ${filePath}`);
    console.log('');

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Found ${data.length} rows in Excel`);
        console.log(`📄 Sheet: ${sheetName}`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let maxTicketNumber = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Skip if no ticket number
            if (!row['Ticket Number']) {
                console.log(`⏭️  Row ${i + 2}: Skipped (no ticket number)`);
                skippedCount++;
                continue;
            }

            try {
                const ticketNumber = row['Ticket Number'].toString().trim();

                // Extract ticket number for tracking
                const ticketNumMatch = ticketNumber.match(/(\d+)$/);
                if (ticketNumMatch) {
                    const num = parseInt(ticketNumMatch[1]);
                    if (num > maxTicketNumber) {
                        maxTicketNumber = num;
                    }
                }

                // Map status
                const statusRaw = row['Status']?.toString() || 'NEW';
                const status = statusMap[statusRaw] || 'NEW';

                // Parse dates
                let createdAt = new Date();
                let updatedAt = new Date();

                if (row['Created At']) {
                    try {
                        // Handle Excel date format
                        if (typeof row['Created At'] === 'number') {
                            createdAt = XLSX.SSF.parse_date_code(row['Created At']);
                        } else {
                            createdAt = new Date(row['Created At']);
                        }
                        if (isNaN(createdAt.getTime())) {
                            createdAt = new Date();
                        }
                    } catch {
                        console.log(`⚠️  Row ${i + 2}: Invalid Created At date, using current date`);
                        createdAt = new Date(); // Ensure createdAt is a valid date
                    }
                }

                if (row['Last Updated']) {
                    try {
                        if (typeof row['Last Updated'] === 'number') {
                            updatedAt = XLSX.SSF.parse_date_code(row['Last Updated']);
                        } else {
                            updatedAt = new Date(row['Last Updated']);
                        }
                        if (isNaN(updatedAt.getTime())) {
                            updatedAt = createdAt;
                        }
                    } catch {
                        updatedAt = createdAt;
                    }
                } else {
                    updatedAt = createdAt;
                }

                // Create ticket
                await prisma.engineerTicket.create({
                    data: {
                        ticketNumber: ticketNumber,
                        title: row['Location']?.toString() || null,
                        description: row['Description']?.toString() || null,
                        department: row['Department']?.toString() || null,
                        location: row['Area']?.toString() || null,
                        typeOfDamage: row['Type of Damage']?.toString() || 'Other',
                        status: status as 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCEL',
                        adminNotes: row['Admin Notes']?.toString() || null,
                        assignTo: row['Assign To']?.toString() || null,
                        informationBy: row['Information By']?.toString() || null,
                        userId: defaultUserId,
                        createdAt: createdAt,
                        updatedAt: updatedAt,
                    },
                });

                console.log(`✅ Row ${i + 2}: ${ticketNumber} - ${status}`);
                successCount++;
            } catch (error: unknown) {
                console.error(`❌ Row ${i + 2}: Failed -`, error instanceof Error ? error.message : String(error));
                errorCount++;
            }
        }

        console.log('');
        console.log('═'.repeat(60));
        console.log('📊 Import Summary:');
        console.log('═'.repeat(60));
        console.log(`   ✅ Successfully imported: ${successCount} tickets`);
        console.log(`   ⏭️  Skipped: ${skippedCount} rows`);
        console.log(`   ❌ Failed: ${errorCount} rows`);
        console.log(`   🔢 Highest ticket number: ${maxTicketNumber}`);
        console.log('═'.repeat(60));
        console.log('');
        console.log('💡 Next ticket will be numbered from:', maxTicketNumber + 1);
        console.log('');
        console.log('✅ Import completed!');

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get arguments
const excelFile = process.argv[2];
const userId = process.argv[3];

if (!excelFile || !userId) {
    console.error('❌ Missing required arguments');
    console.log('');
    console.log('Usage: npm run import:engineer-excel <excel-file> <user-id>');
    console.log('');
    console.log('Example:');
    console.log('  npm run import:engineer-excel "D:\\EGPB-Backups\\tickets.xlsx" "user-id-here"');
    console.log('');
    console.log('To find user ID, run: npm run prisma:studio');
    process.exit(1);
}

importFromExcel(excelFile, userId);
