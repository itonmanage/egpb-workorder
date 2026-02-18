/**
 * Utility functions for ticket-related operations
 */

/**
 * Get Tailwind CSS classes for status badge based on ticket status
 */
export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'NEW':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'IN_PROGRESS':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'ON_HOLD':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'DONE':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'CANCEL':
            return 'bg-red-100 text-red-700 border-red-200';
        default:
            return 'bg-gray-100 text-black border-gray-200';
    }
};

/**
 * Get human-readable display name for ticket status
 */
export const getStatusDisplayName = (status: string): string => {
    switch (status) {
        case 'NEW':
            return 'New';
        case 'IN_PROGRESS':
            return 'On Process';
        case 'ON_HOLD':
            return 'On Hold';
        case 'DONE':
            return 'Done';
        case 'CANCEL':
            return 'Cancel';
        default:
            return status;
    }
};

/**
 * Get status label (alias for getStatusDisplayName for backward compatibility)
 */
export const getStatusLabel = (status: string): string => {
    return getStatusDisplayName(status);
};

/**
 * Status labels mapping
 */
export const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    IN_PROGRESS: 'On Process',
    ON_HOLD: 'On Hold',
    DONE: 'Done',
    CANCEL: 'Cancel',
};

/**
 * Status colors for charts (hex values)
 */
export const STATUS_COLORS: Record<string, string> = {
    NEW: '#3B82F6', // blue-500
    IN_PROGRESS: '#EAB308', // yellow-500
    ON_HOLD: '#F97316', // orange-500
    DONE: '#22C55E', // green-500
    CANCEL: '#EF4444', // red-500
};

/**
 * Get user initials from username
 */
export const getUserInitials = (name: string): string => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
};

/**
 * Format date to locale string (Thai format)
 */
export const formatDateThai = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('th-TH');
};

/**
 * Format date to GB format (DD/MM/YYYY)
 */
export const formatDateGB = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB');
};
