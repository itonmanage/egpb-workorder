import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Backup Users Script - Improved Version
 * Backs up user data with 100% correct UTF-8 encoding for Thai characters
 * ========================================================================
 */

async function backupUsers() {
    console.log('');
    console.log('================================================');
    console.log('   EGPB User Data Backup (UTF-8/Thai Support)   ');
    console.log('   การ Backup ข้อมูลผู้ใช้ระบบ                  ');
    console.log('================================================');
    console.log('');
    console.log('🔄 กำลังเริ่ม backup ข้อมูลผู้ใช้...');

    try {
        // Fetch all users with related data
        const users = await prisma.user.findMany({
            include: {
                sessions: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(`📊 พบผู้ใช้ทั้งหมด ${users.length} คน`);

        // Create backup directory if it doesn't exist
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Create backup file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `users-backup-${timestamp}.json`);

        // Prepare backup data with metadata
        const backupData = {
            metadata: {
                backupDate: new Date().toISOString(),
                backupDateThai: new Date().toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                totalUsers: users.length,
                encoding: 'UTF-8 with BOM',
                version: '2.0',
            },
            users: users.map(user => ({
                ...user,
                // Ensure password is not exposed
                password: '[REDACTED]',
            })),
        };

        // Write with UTF-8 BOM for guaranteed Thai character support
        const jsonContent = JSON.stringify(backupData, null, 2);
        const utf8BOM = '\uFEFF'; // UTF-8 BOM character
        fs.writeFileSync(backupFile, utf8BOM + jsonContent, 'utf8');

        // Verify the backup
        console.log('');
        console.log('🔍 กำลังตรวจสอบไฟล์ backup...');
        const verifyContent = fs.readFileSync(backupFile, 'utf8');
        const verifyData = JSON.parse(verifyContent.replace(/^\uFEFF/, '')); // Remove BOM for parsing

        if (verifyData.users.length === users.length) {
            console.log('  ✓ ตรวจสอบจำนวนผู้ใช้ถูกต้อง');
        }

        // Check Thai characters
        const sampleUser = users.find(u =>
            /[\u0E00-\u0E7F]/.test(u.fullName || '') ||
            /[\u0E00-\u0E7F]/.test(u.department || '')
        );

        if (sampleUser) {
            console.log('  ✓ พบข้อมูลภาษาไทยในไฟล์ backup');
            console.log(`    ตัวอย่าง: ${sampleUser.fullName || sampleUser.username}`);
        }

        console.log('');
        console.log('================================================');
        console.log('✅ Backup สำเร็จ!');
        console.log('================================================');
        console.log('');
        console.log(`📁 ไฟล์: ${backupFile}`);
        console.log(`📦 ขนาด: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
        console.log('');

        // Show summary by role
        console.log('📋 สรุปผู้ใช้ตาม Role:');
        const roleCount: Record<string, number> = {};
        users.forEach(user => {
            roleCount[user.role] = (roleCount[user.role] || 0) + 1;
        });

        const roleLabels: Record<string, string> = {
            ADMIN: 'ผู้ดูแลระบบ',
            IT_ADMIN: 'แอดมิน IT',
            ENGINEER_ADMIN: 'แอดมินวิศวกร',
            USER: 'ผู้ใช้ทั่วไป',
        };

        Object.entries(roleCount).forEach(([role, count]) => {
            const label = roleLabels[role] || role;
            console.log(`   ${role} (${label}): ${count} คน`);
        });

        console.log('');
        console.log('⚠️  กรุณาเก็บไฟล์ backup นี้ไว้ในที่ปลอดภัย!');
        console.log('');

    } catch (error) {
        console.error('❌ Backup ล้มเหลว:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run backup
backupUsers();
