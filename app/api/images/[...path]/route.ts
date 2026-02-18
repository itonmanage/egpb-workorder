import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import mime from 'mime';

// This should match the UPLOAD_DIR in lib/fileStorage.ts
// We use process.env.UPLOAD_DIR or fallback to a default relative path for dev
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;

        // Join path segments to get the relative file path
        const filePath = pathSegments.join('/');

        // Prevent directory traversal attacks
        if (filePath.includes('..')) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        // Construct full path
        const fullPath = resolve(UPLOAD_DIR, filePath);

        // Verify the path is still within UPLOAD_DIR
        if (!fullPath.startsWith(resolve(UPLOAD_DIR))) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if file exists
        try {
            await stat(fullPath);
        } catch {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read file
        const fileBuffer = await readFile(fullPath);

        // Determine content type
        const contentType = mime.getType(fullPath) || 'application/octet-stream';

        // Return file response
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
