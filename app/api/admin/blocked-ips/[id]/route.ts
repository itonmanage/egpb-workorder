import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { unblockIPById } from '@/lib/ip-blocker';

// Admin only roles
const ADMIN_ROLES = ['ADMIN', 'IT_ADMIN'];

/**
 * DELETE - Unblock an IP by ID (Admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const success = await unblockIPById(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Blocked IP not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'IP has been unblocked',
        });
    } catch (error) {
        console.error('Error unblocking IP by ID:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
