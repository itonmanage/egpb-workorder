import { z } from 'zod';

/**
 * API Validation Schemas
 * For validating request bodies in API routes
 */

// ============================================
// TICKET VALIDATION
// ============================================

export const createTicketApiSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    department: z.string().min(1, 'Department is required'),
    location: z.string().min(1, 'Location is required'),
    typeOfDamage: z.string().min(1, 'Type of damage is required'),
    status: z.enum(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL']).default('NEW'),
});

export const updateTicketApiSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL']).optional(),
    assigneeId: z.string().uuid().optional(),
});

// ============================================
// ENGINEER TICKET VALIDATION
// ============================================

export const createEngineerTicketApiSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    department: z.string().min(1, 'Department is required'),
    location: z.string().min(1, 'Location is required'),
    typeOfDamage: z.string().min(1, 'Type of damage is required'),
    status: z.enum(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL']).default('NEW'),
});

export const updateEngineerTicketApiSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL']).optional(),
    assigneeId: z.string().uuid().optional(),
});

// ============================================
// USER VALIDATION
// ============================================

export const createUserApiSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters'),
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name too long'),
    role: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'ENGINEER_ADMIN']),
});

export const updateUserApiSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    role: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'ENGINEER_ADMIN']).optional(),
    password: z.string().min(6).optional(),
});

// ============================================
// AUTH VALIDATION
// ============================================

export const loginApiSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const registerApiSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters'),
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name too long'),
});

// ============================================
// HELPER TYPES
// ============================================

export type CreateTicketInput = z.infer<typeof createTicketApiSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketApiSchema>;
export type CreateEngineerTicketInput = z.infer<typeof createEngineerTicketApiSchema>;
export type UpdateEngineerTicketInput = z.infer<typeof updateEngineerTicketApiSchema>;
export type CreateUserInput = z.infer<typeof createUserApiSchema>;
export type UpdateUserInput = z.infer<typeof updateUserApiSchema>;
export type LoginInput = z.infer<typeof loginApiSchema>;
export type RegisterInput = z.infer<typeof registerApiSchema>;
