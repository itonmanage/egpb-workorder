import winston from 'winston';
import path from 'path';

/**
 * Logger for EGPB Ticket System
 * 
 * Logs to:
 * - error.log: Error level and above
 * - combined.log: All logs
 * - Console: Development only
 */

const logDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'egpb-ticket' },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// Helper functions
export function logInfo(message: string, meta?: Record<string, unknown>) {
    logger.info(message, meta);
}

export function logError(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errorObj = error as Error | undefined;
    logger.error(message, { error: errorObj?.message || error, stack: errorObj?.stack, ...meta });
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
    logger.warn(message, meta);
}

export function logDebug(message: string, meta?: Record<string, unknown>) {
    logger.debug(message, meta);
}
