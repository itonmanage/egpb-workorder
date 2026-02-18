import { createHash } from 'crypto';

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// Magic numbers (hex signatures) for common file types
const MAGIC_NUMBERS: Record<string, string[]> = {
    'jpg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
    'jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
    'png': ['89504e47'],
    'pdf': ['25504446'],
};

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    error?: string;
    sanitizedFilename?: string;
}

// ============================================================================
// Security Functions
// ============================================================================

/**
 * Sanitize filename to prevent directory traversal and special character issues
 * Strategies:
 * 1. Remove directory traversal sequences (../)
 * 2. Remove dangerous characters
 * 3. Limit length
 * 4. Generate unique name (UUID) + original extension (safest)
 */
export function sanitizeFilename(filename: string): string {
    // Remove non-alphanumeric chars except dots, dashes, and underscores
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    // Prevent multiple dots (which could hide extensions)
    const cleanName = safeName.replace(/\.{2,}/g, '.');

    // Ensure we don't start with a dot
    return cleanName.replace(/^\.+/, '');
}

/**
 * Generate a secure, unique filename based on content hash or UUID
 */
export function generateSecureFilename(filename: string, content?: Buffer): string {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

    if (content) {
        const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
        return `${hash}${ext}`;
    }

    // Fallback to random string if no content
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    return `${timestamp}-${random}${ext}`;
}

/**
 * Validate file content using magic numbers (file signature)
 * This prevents users from renaming .exe to .jpg
 */
export async function validateFileSignature(file: File | Blob): Promise<boolean> {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Convert to hex string
    const header = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

    // Get extension from name if possible, or try all allowed types
    // Ideally we need the filename to check against specific magic numbers,
    // but if we only have the blob, we check if it matches ANY allowed type.

    // Flatten allowed magic numbers
    const allSignatures = Object.values(MAGIC_NUMBERS).flat();

    // Check if header starts with any known signature
    return allSignatures.some(signature => header.startsWith(signature));
}

/**
 * Comprehensive file validation
 */
export async function validateFile(file: File): Promise<ValidationResult> {
    // 1. Check size
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File size exceeds limit (5MB)' };
    }

    // 2. Check extension
    const filename = file.name.toLowerCase();
    const ext = filename.slice(filename.lastIndexOf('.'));

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: 'Invalid file extension' };
    }

    // 3. Check magic number
    const isValidSignature = await validateFileSignature(file);
    if (!isValidSignature) {
        return { valid: false, error: 'File content does not match extension' };
    }

    return {
        valid: true,
        sanitizedFilename: generateSecureFilename(file.name)
    };
}
