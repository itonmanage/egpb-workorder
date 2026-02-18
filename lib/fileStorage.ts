import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Prioritize environment variable, fallback to public/uploads for dev
// This ensures we use the persistent storage path in production/deployment
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  return `${randomUUID()}${ext}`;
}

// Save image file from FormData
export async function saveImage(
  file: File,
  folder: 'tickets' | 'engineer-tickets' = 'tickets'
): Promise<string> {
  await ensureUploadDir();

  const folderPath = path.join(UPLOAD_DIR, folder);
  // Ensure subfolder exists
  try {
    await fs.access(folderPath);
  } catch {
    await fs.mkdir(folderPath, { recursive: true });
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate filename
  const filename = generateFilename(file.name);

  // Optimize image with sharp
  const optimizedBuffer = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const filePath = path.join(folderPath, filename);
  await fs.writeFile(filePath, optimizedBuffer);

  // Return URL pointing to the custom image serving route
  // The route is /api/images/[...path]
  return `/api/images/${folder}/${filename}`;
}

// Delete image file
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract relative path from URL
    // URL format: /api/images/folder/filename
    const relativePath = imageUrl.replace('/api/images/', '');

    // Construct absolute path using UPLOAD_DIR
    const filePath = path.join(UPLOAD_DIR, relativePath);

    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

// Validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images are allowed.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit.' };
  }

  return { valid: true };
}

// Upload ticket images
export async function uploadTicketImages(
  files: File[],
  folder: 'tickets' | 'engineer-tickets' = 'tickets'
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    const urls: string[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const imageUrl = await saveImage(file, folder);
      urls.push(imageUrl);
    }

    return { success: true, urls };
  } catch (error) {
    console.error('Error uploading images:', error);
    return { success: false, error: 'Failed to upload images' };
  }
}

