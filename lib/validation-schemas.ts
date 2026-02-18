import { z } from 'zod';

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'Username cannot be empty')
        .max(50, 'Username must be less than 50 characters')
        .trim(),
    password: z
        .string()
        .min(1, 'Password cannot be empty')
        .max(100, 'Password must be less than 100 characters'),
});

// ============================================================================
// User Schemas
// ============================================================================

export const createUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .trim()
        .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens'),
    fullName: z
        .string()
        .max(100, 'Full name must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    position: z
        .string()
        .max(100, 'Position must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    department: z
        .string()
        .max(100, 'Department must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    telephoneExtension: z
        .string()
        .max(20, 'Telephone extension must be less than 20 characters')
        .trim()
        .optional()
        .nullable(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),
    role: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'ENGINEER_ADMIN']),
});

export const updateUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .trim()
        .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens')
        .optional(),
    fullName: z
        .string()
        .max(100, 'Full name must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    position: z
        .string()
        .max(100, 'Position must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    department: z
        .string()
        .max(100, 'Department must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    telephoneExtension: z
        .string()
        .max(20, 'Telephone extension must be less than 20 characters')
        .trim()
        .optional()
        .nullable(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters')
        .optional(),
    role: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'ENGINEER_ADMIN']).optional(),
    action: z.enum(['unlock', 'lock']).optional(),
});

// ============================================================================
// Admin Schemas
// ============================================================================

export const unblockIPSchema = z.object({
    ipAddress: z
        .string()
        .regex(
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            'Invalid IP address format'
        ),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));

        return {
            success: false as const,
            errors,
            // User-friendly error message
            message: errors.length === 1
                ? errors[0].message
                : `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
        };
    }

    return {
        success: true as const,
        data: result.data,
    };
}
