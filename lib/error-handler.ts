import { logError } from './logger';

/**
 * Custom Application Error
 */
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(400, message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(404, `${resource} not found`, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}

/**
 * Handle errors and return appropriate Response
 */
export function handleError(error: unknown): Response {
    // Log error
    logError('API Error', error);

    // Handle known errors
    if (error instanceof AppError) {
        return Response.json(
            {
                error: error.message,
                code: error.code,
                details: error.details,
            },
            { status: error.statusCode }
        );
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
        return Response.json(
            {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: (error as { issues: unknown }).issues,
            },
            { status: 400 }
        );
    }

    // Handle unknown errors
    return Response.json(
        {
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
        },
        { status: 500 }
    );
}

/**
 * Async handler wrapper for API routes
 */
export function asyncHandler(
    handler: (request: Request, context?: Record<string, unknown>) => Promise<Response>
) {
    return async (request: Request, context?: Record<string, unknown>): Promise<Response> => {
        try {
            return await handler(request, context);
        } catch (error) {
            return handleError(error);
        }
    };
}
