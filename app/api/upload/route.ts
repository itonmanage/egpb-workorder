import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveImage, deleteImage } from '@/lib/fileStorage';


export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const formData = await request.formData();
    const ticketId = formData.get('ticketId')?.toString();
    const type = (formData.get('type')?.toString() || 'ticket').toLowerCase();
    const isAdminUpload = formData.get('isAdminUpload') === 'true';

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    const files = [
      ...formData.getAll('file'),
      ...formData.getAll('files'),
    ].filter((file): file is File => file instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const images = [];
    const folder = type === 'engineer' ? 'engineer-tickets' : 'tickets';

    for (const file of files) {
      try {
        console.log(`[Upload] Processing file: ${file.name}, type: ${type}, ticketId: ${ticketId}`);

        // Use the centralized saveImage function which handles:
        // 1. Validation
        // 2. Optimization (sharp)
        // 3. Persistent storage (UPLOAD_DIR)
        // 4. Correct URL generation (/api/images/...)
        const url = await saveImage(file, folder);
        console.log(`[Upload] File saved to: ${url}`);

        if (type === 'engineer') {
          console.log(`[Upload] Creating EngineerTicketImage record...`);
          const image = await prisma.engineerTicketImage.create({
            data: {
              ticketId,
              imageUrl: url,
              uploadedBy: user.id,
              isCompletion: isAdminUpload,
            },
          });
          console.log(`[Upload] EngineerTicketImage created: ${image.id}`);

          images.push({
            id: image.id,
            url: image.imageUrl,
            originalName: file.name,
            isCompletion: image.isCompletion,
            ticketId: image.ticketId,
          });
        } else {
          console.log(`[Upload] Creating TicketImage record...`);
          const image = await prisma.ticketImage.create({
            data: {
              ticketId,
              imageUrl: url,
              uploadedBy: user.id,
              isCompletion: isAdminUpload,
            },
          });
          console.log(`[Upload] TicketImage created: ${image.id}`);

          images.push({
            id: image.id,
            url: image.imageUrl,
            originalName: file.name,
            isCompletion: image.isCompletion,
            ticketId: image.ticketId,
          });
        }
      } catch (error) {
        console.error(`[Upload] Failed to save file ${file.name}:`, error);
        console.error(`[Upload] Error details:`, {
          type,
          ticketId,
          userId: user.id,
          isAdminUpload,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        // Continue with other files or throw? 
        // For now, we log and continue, but maybe we should return partial success.
      }
    }

    return NextResponse.json({
      success: true,
      data: { images },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const filePath = searchParams.get('filePath');
    const type = (searchParams.get('type') || 'ticket').toLowerCase();

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required' }, { status: 400 });
    }

    if (type === 'engineer') {
      await prisma.engineerTicketImage.delete({
        where: { id: imageId },
      });
    } else {
      await prisma.ticketImage.delete({
        where: { id: imageId },
      });
    }

    if (filePath) {
      await deleteImage(filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

