import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';


const prisma = new PrismaClient();

// Mapping old role names to new role names
const ROLE_MIGRATION_MAP: Record<string, string> = {
    'F&B': 'FB',
    'Front Office': 'FRONT_OFFICE',
    'Banquet': 'BANQUET',
    'Sales & Marketing / Reservations': 'RSVN_SALE',
    'HR': 'HR',
    'Housekeeping': 'HK',
    'Kitchen': 'KITCHEN',
    'Juristic': 'JURISTIC',
    'Security': 'SEC',
    'Executive & Accounting': 'EXE_AC',
    'ADMIN': 'ADMIN',
    'IT_ADMIN': 'IT_ADMIN',
    'ENGINEER_ADMIN': 'ENGINEER_ADMIN',
    'USER': 'USER',
};

async function restoreUsers(backupFilePath: string) {
    console.log('🔄 Starting user data restore...');

    try {
        // Check if backup file exists
        if (!fs.existsSync(backupFilePath)) {
            console.error(`❌ Backup file not found: ${backupFilePath}`);
            console.log('');
            console.log('Available backup files:');
            const backupDir = path.join(process.cwd(), 'backups');
            if (fs.existsSync(backupDir)) {
                const files = fs.readdirSync(backupDir).filter(f => f.startsWith('users-backup-'));
                files.forEach(file => console.log(`   - ${file}`));
            }
            process.exit(1);
        }

        // Read backup file
        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
        console.log(`📊 Found ${backupData.length} users in backup`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const userData of backupData) {
            try {
                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { username: userData.username },
                });

                if (existingUser) {
                    console.log(`⏭️  Skipping ${userData.username} (already exists)`);
                    skipCount++;
                    continue;
                }

                // Map old role to new role
                const newRole = ROLE_MIGRATION_MAP[userData.role] || userData.role;

                if (!ROLE_MIGRATION_MAP[userData.role]) {
                    console.log(`⚠️  Warning: No mapping found for role "${userData.role}", using as-is`);
                }

                // Create user with new role name
                await prisma.user.create({
                    data: {
                        id: userData.id,
                        username: userData.username,
                        fullName: userData.fullName,
                        position: userData.position,
                        department: userData.department,
                        telephoneExtension: userData.telephoneExtension,
                        password: userData.password, // Already hashed
                        role: newRole,
                        createdAt: new Date(userData.createdAt),
                        updatedAt: new Date(userData.updatedAt),
                    },
                });

                console.log(`✅ Restored user: ${userData.username} (${userData.role} → ${newRole})`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to restore ${userData.username}:`, error);
                errorCount++;
            }
        }

        console.log('');
        console.log('📊 Restore Summary:');
        console.log(`   ✅ Successfully restored: ${successCount} users`);
        console.log(`   ⏭️  Skipped (already exists): ${skipCount} users`);
        console.log(`   ❌ Failed: ${errorCount} users`);
        console.log('');
        console.log('✅ Restore completed!');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
    console.error('❌ Please provide backup file path');
    console.log('');
    console.log('Usage: npm run restore-users <backup-file-path>');
    console.log('Example: npm run restore-users backups/users-backup-2025-12-18T12-30-00-000Z.json');
    process.exit(1);
}

restoreUsers(backupFile);
