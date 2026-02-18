import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verify-auth';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; imageId: string }> }
) {
    try {
        const { id: ticketId, imageId } = await params;
        console.log('[DELETE Image] Request received:', { ticketId, imageId });

        // Verify authentication
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            console.log('[DELETE Image] Auth failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = authResult.payload;
        console.log('[DELETE Image] User:', user.userId, 'Role:', user.role);

        // Check if user is admin
        if (user.role !== 'ADMIN' && user.role !== 'IT_ADMIN') {
            console.log('[DELETE Image] Not admin');
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Get delete reason from request body
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || 'No reason provided';
        console.log('[DELETE Image] Reason:', reason);

        // Get image details
        const image = await prisma.ticketImage.findUnique({
            where: { id: imageId },
        });

        if (!image) {
            console.log('[DELETE Image] Image not found:', imageId);
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        console.log('[DELETE Image] Found image:', image.id, 'for ticket:', image.ticketId);

        // Verify image belongs to the ticket
        if (image.ticketId !== ticketId) {
            console.log('[DELETE Image] Ticket mismatch:', image.ticketId, '!==', ticketId);
            return NextResponse.json({ error: 'Image does not belong to this ticket' }, { status: 400 });
        }

        // Delete file from filesystem
        try {
            const imagePath = path.join(process.cwd(), 'public', image.imageUrl);
            console.log('[DELETE Image] Deleting file:', imagePath);
            await fs.unlink(imagePath);
        } catch (error) {
            console.error('[DELETE Image] Error deleting file from filesystem:', error);
            // Continue with database deletion even if file deletion fails
        }

        // Delete from database
        await prisma.ticketImage.deleteMany({
            where: { id: imageId },
        });
        console.log('[DELETE Image] Deleted from database');

        // Log activity
        await prisma.ticketActivity.create({
            data: {
                ticketId: ticketId,
                userId: user.userId,
                actionType: 'image_deleted',
                description: `Deleted completion image: ${image.imageUrl.split('/').pop() || 'Unknown'}. Reason: ${reason}`,
            },
        });
        console.log('[DELETE Image] Activity logged');

        return NextResponse.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('[DELETE Image] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete image', details: String(error) },
            { status: 500 }
        );
    }
}
