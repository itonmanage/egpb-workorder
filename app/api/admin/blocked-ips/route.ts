import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBlockedIPs, unblockIP, cleanExpiredBlockedIPs } from '@/lib/ip-blocker';

// Admin only roles
const ADMIN_ROLES = ['ADMIN', 'IT_ADMIN'];

/**
 * GET - List all blocked IPs (Admin only)
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getSession(token);
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Clean expired IPs first
        await cleanExpiredBlockedIPs();

        // Get all blocked IPs
        const blockedIPs = await getBlockedIPs();

        return NextResponse.json({
            success: true,
            data: blockedIPs.map(ip => ({
                id: ip.id,
                ipAddress: ip.ipAddress,
                reason: ip.reason,
                blockedAt: ip.blockedAt.toISOString(),
                expiresAt: ip.expiresAt.toISOString(),
                failedCount: ip.failedCount,
                // Calculate time remaining
                timeRemaining: Math.max(0, Math.ceil((ip.expiresAt.getTime() - Date.now()) / 1000)),
            })),
            total: blockedIPs.length,
        });
    } catch (error) {
        console.error('Error getting blocked IPs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Unblock an IP by IP address (Admin only)
 */
export async function DELETE(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getSession(token);
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { ipAddress } = await request.json();

        if (!ipAddress) {
            return NextResponse.json(
                { error: 'IP address is required' },
                { status: 400 }
            );
        }

        const success = await unblockIP(ipAddress);

        if (!success) {
            return NextResponse.json(
                { error: 'IP address not found or already unblocked' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `IP ${ipAddress} has been unblocked`,
        });
    } catch (error) {
        console.error('Error unblocking IP:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
