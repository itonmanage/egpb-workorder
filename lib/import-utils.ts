/**
 * Shared Import Utilities for EGPB Ticket System
 */

import { STATUS_MAP, type TicketStatus } from './constants';

/**
 * Parse date from CSV/Excel format
 * Handles Excel serial dates and string dates
 */
export function parseCSVDate(dateValue: string | number | undefined): Date {
    if (!dateValue) {
        return new Date();
    }

    try {
        // Handle Excel serial date (number of days since 1900-01-01)
        if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        // Handle string date
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date;
        }
    } catch {
        // Fall through to default
    }

    return new Date();
}

/**
 * Map status string to ticket status enum
 */
export function mapStatus(statusRaw: string | undefined): TicketStatus {
    if (!statusRaw) {
        return 'NEW';
    }
    return (STATUS_MAP[statusRaw] as TicketStatus) || 'NEW';
}

/**
 * Extract numeric ticket number from ticket ID
 * Example: "EGPB-IT25-00123" -> 123
 */
export function extractTicketNumber(ticketId: string): number {
    const match = ticketId.match(/(\d+)$/);
    return match ? parseInt(match[1]) : 0;
}

/**
 * Format import summary for logging
 */
export function formatImportSummary(
    successCount: number,
    skippedCount: number,
    errorCount: number,
    maxTicketNumber: number
): string {
    const lines = [
        '',
        '═'.repeat(60),
        '📊 Import Summary:',
        '═'.repeat(60),
        `   ✅ Successfully imported: ${successCount} tickets`,
        `   ⏭️  Skipped: ${skippedCount} rows`,
        `   ❌ Failed: ${errorCount} rows`,
        `   🔢 Highest ticket number: ${maxTicketNumber}`,
        '═'.repeat(60),
        '',
        `💡 Next ticket will be numbered from: ${maxTicketNumber + 1}`,
        '',
        '✅ Import completed!',
    ];
    return lines.join('\n');
}
