import { z } from 'zod';
import { FILE_UPLOAD } from './constants';

/**
 * Validation Schemas for EGPB Ticket System
 * 
 * Requirements:
 * - Required fields: area, typeOfDamage, department
 * - Optional fields: locationDetail, description (no length limits)
 * - File validation: max 10MB per file, max 15 files per ticket
 */

// ============================================
// IT TICKET VALIDATION
// ============================================

export const itTicketSchema = z.object({
    area: z.string().min(1, 'กรุณาเลือก Area'),
    typeOfDamage: z.string().min(1, 'กรุณาเลือก Type of Damage'),
    department: z.string().min(1, 'กรุณาเลือก Department'),
    locationDetail: z.string().optional(),
    description: z.string().optional(),
    attachments: z.array(z.instanceof(File))
        .max(FILE_UPLOAD.MAX_FILES, `อัปโหลดได้สูงสุด ${FILE_UPLOAD.MAX_FILES} ไฟล์`)
        .refine(
            (files) => files.every(file => file.size <= FILE_UPLOAD.MAX_FILE_SIZE),
            {
                message: `ไฟล์แต่ละไฟล์ต้องมีขนาดไม่เกิน ${FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`
            }
        )
        .refine(
            (files) => files.every(file =>
                FILE_UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof FILE_UPLOAD.ACCEPTED_IMAGE_TYPES[number])
            ),
            {
                message: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WebP)'
            }
        )
        .optional()
        .default([]),
});

export type ITTicketFormData = z.infer<typeof itTicketSchema>;

// ============================================
// ENGINEER TICKET VALIDATION
// ============================================

export const engineerTicketSchema = z.object({
    area: z.string().min(1, 'กรุณาเลือก Area'),
    typeOfDamage: z.string().min(1, 'กรุณาเลือก Type of Damage'),
    department: z.string().min(1, 'กรุณาเลือก Department'),
    locationDetail: z.string().optional(),
    description: z.string().optional(),
    attachments: z.array(z.instanceof(File))
        .max(FILE_UPLOAD.MAX_FILES, `อัปโหลดได้สูงสุด ${FILE_UPLOAD.MAX_FILES} ไฟล์`)
        .refine(
            (files) => files.every(file => file.size <= FILE_UPLOAD.MAX_FILE_SIZE),
            {
                message: `ไฟล์แต่ละไฟล์ต้องมีขนาดไม่เกิน ${FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`
            }
        )
        .refine(
            (files) => files.every(file =>
                FILE_UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof FILE_UPLOAD.ACCEPTED_IMAGE_TYPES[number])
            ),
            {
                message: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WebP)'
            }
        )
        .optional()
        .default([]),
});

export type EngineerTicketFormData = z.infer<typeof engineerTicketSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate form data and return formatted errors
 */
export function validateFormData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format errors for easy display
    const errors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
    });

    return { success: false, errors };
}
