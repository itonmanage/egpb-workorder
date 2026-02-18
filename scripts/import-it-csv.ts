import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface CSVRow {
    'Ticket Number'?: string;
    'Location'?: string;
    'Description'?: string;
    'Department'?: string;
    'Area'?: string;
    'Type of Damage'?: string;
    'Status'?: string;
    'Admin Notes'?: string;
    'Assign To'?: string;
    'Created At'?: string;
    'Last Updated'?: string;
    'Reporter'?: string;
    [key: string]: string | undefined;
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

async function importFromCSV(filePath: string, defaultUserId: string) {
    console.log('🔄 Starting IT Tickets CSV import...');
    console.log(`📁 File: ${filePath}`);
    console.log('');

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        // Read CSV file with UTF-8 encoding
        let fileContent = fs.readFileSync(filePath, 'utf-8');

        // Remove BOM if present (helps with Thai characters)
        if (fileContent.charCodeAt(0) === 0xFEFF) {
            fileContent = fileContent.slice(1);
        }

        const records: CSVRow[] = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
            relax_column_count: true,
        });

        console.log(`📊 Found ${records.length} rows in CSV`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let maxTicketNumber = 0;

        for (let i = 0; i < records.length; i++) {
            const row = records[i];

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
                        createdAt = new Date(row['Created At']);
                        if (isNaN(createdAt.getTime())) {
                            createdAt = new Date();
                        }
                    } catch {
                        console.log(`⚠️  Row ${i + 2}: Invalid Created At date, using current date`);
                    }
                }

                if (row['Last Updated']) {
                    try {
                        updatedAt = new Date(row['Last Updated']);
                        if (isNaN(updatedAt.getTime())) {
                            updatedAt = createdAt;
                        }
                    } catch {
                        updatedAt = createdAt;
                    }
                } else {
                    updatedAt = createdAt;
                }

                // Create IT ticket
                await prisma.ticket.create({
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
const csvFile = process.argv[2];
const userId = process.argv[3];

if (!csvFile || !userId) {
    console.error('❌ Missing required arguments');
    console.log('');
    console.log('Usage: npm run import:it-csv <csv-file> <user-id>');
    console.log('');
    console.log('Example:');
    console.log('  npm run import:it-csv "D:\\EGPB-Backups\\it\\tickets.csv" "user-id-here"');
    console.log('');
    console.log('To find user ID, run: npx tsx scripts/find-admin-users.ts');
    process.exit(1);
}

importFromCSV(csvFile, userId);
