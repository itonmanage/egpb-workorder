/**
 * Shared Constants for EGPB Ticket System
 */

// ============================================
// APP CONFIGURATION
// ============================================

export const BASE_PATH = '/egpb/pyt/workorder';

// ============================================
// IT TICKET CONSTANTS
// ============================================

export const IT_DAMAGE_TYPES = [
    'Hardware',
    'Network / Internet / WIFI',
    'Software',
    'Television / Digital Signage',
    'Telephone',
    'Access / Permission',
    'Printing / Scanning',
    'CCTV',
    'POS',
    'Access Control',
    'Email / Communication',
    'Service Request',
    'Security Incident',
    'Other',
] as const;

export type ITDamageType = typeof IT_DAMAGE_TYPES[number];

export const IT_AREAS = [
    'Guest room',
    'Back Office',
    'Reception',
    'Kitchen',
    'Restaurant/Retail',
    'Juristic/Tenants',
    'Public Area',
    'Other',
] as const;

export type ITArea = typeof IT_AREAS[number];

// ============================================
// ENGINEER TICKET CONSTANTS
// ============================================

export const ENGINEER_DAMAGE_TYPES = [
    'Air Condition',
    'Refrigerator',
    'Wal-in Chiller',
    'Ice Machines',
    'Ventilation System',
    'GAS System',
    'Hot Water',
    'Cold Water',
    'Toilet',
    'Drainage pipe',
    'Water Leaking pipe',
    'EE Equipment',
    'Television / Digital Signage',
    'Telephone',
    'Safe Box',
    'Door',
    'Lighting',
    'Furniture',
    'Touch up/Grouting',
    'Carpenter work',
    'Safety System',
    'Sanitary and Toilet',
    'Lift',
    'PM Program',
    'Other',
] as const;

export type EngineerDamageType = typeof ENGINEER_DAMAGE_TYPES[number];

export const ENGINEER_AREAS = [
    'Guest Rooms',
    'Kitchen',
    'Office Hotel Area',
    'BOH Hotel',
    'Retail',
    'Tenants Office Area',
    'Function Room',
    'Other',
] as const;

export type EngineerArea = typeof ENGINEER_AREAS[number];

// ============================================
// SHARED CONSTANTS
// ============================================

export const DEPARTMENTS = [
    'Engineer',
    'Executive & Accounting',
    'F&B',
    'Banquet',
    'Front Office',
    'Housekeeping',
    'Human Resource',
    'Juristic',
    'Kitchen',
    'Reservations & Sales & Marketing',
    'Security',
] as const;

export type Department = typeof DEPARTMENTS[number];

// Status Configuration
export const STATUS_CONFIG = {
    NEW: {
        value: 'NEW',
        label: 'New',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
    },
    IN_PROGRESS: {
        value: 'IN_PROGRESS',
        label: 'On Process',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
    },
    ON_HOLD: {
        value: 'ON_HOLD',
        label: 'On Hold',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
    },
    DONE: {
        value: 'DONE',
        label: 'Done',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
    },
    CANCEL: {
        value: 'CANCEL',
        label: 'Cancel',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
    },
} as const;

export type TicketStatus = keyof typeof STATUS_CONFIG;

// File Upload Settings
export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    MAX_FILES: 15, // Maximum 15 files per ticket
} as const;

// Pagination
export const PAGINATION = {
    ITEMS_PER_PAGE: 20,
    MAX_PAGE_BUTTONS: 5,
} as const;

// Validation Rules
export const VALIDATION = {
    DESCRIPTION: {
        MAX_LENGTH: 2000,
    },
    LOCATION: {
        MAX_LENGTH: 200,
    },
    ADMIN_NOTES: {
        MAX_LENGTH: 1000,
    },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getDamageTypes(ticketType: 'it' | 'engineer') {
    return ticketType === 'it' ? IT_DAMAGE_TYPES : ENGINEER_DAMAGE_TYPES;
}

export function getAreas(ticketType: 'it' | 'engineer') {
    return ticketType === 'it' ? IT_AREAS : ENGINEER_AREAS;
}

export function getStatusConfig(status: string) {
    return STATUS_CONFIG[status as TicketStatus] || STATUS_CONFIG.NEW;
}

// ============================================
// LEGACY CONSTANTS (for backward compatibility)
// ============================================

// Role to Department Mapping
export const ROLE_TO_DEPARTMENT_MAP: Record<string, string> = {
    'EXE_AC': 'Executive & Accounting',
    'FB': 'F&B',
    'FRONT_OFFICE': 'Front Office',
    'HK': 'Housekeeping',
    'HR': 'HR',
    'JURISTIC': 'Juristic',
    'KITCHEN': 'Kitchen',
    'RSVN_SALE': 'Reservation & Sales & Marketing',
    'SEC': 'Security',
    'ENG': 'Engineer',
    'GSC': 'GSC',
    'BANQUET': 'Banquet',
};

// Department Roles List
export const DEPARTMENT_ROLES = [
    'GSC',
    'FRONT_OFFICE',
    'FB',
    'RSVN_SALE',
    'HR',
    'HK',
    'EXE_AC',
    'JURISTIC',
    'SEC',
    'KITCHEN',
    'BANQUET',
    'ENG',
];

// Role Display Labels
export const ROLE_LABELS: Record<string, string> = {
    'ADMIN': 'Admin',
    'IT_ADMIN': 'IT Admin',
    'ENGINEER_ADMIN': 'Engineer Admin',
    'USER': 'User',
    'FRONT_OFFICE': 'Front Office',
    'BACK_OFFICE': 'Back Office',
    'ACCOUNTING': 'Accounting',
    'ENGINEER': 'Engineer',
    'GSC': 'GSC',
    'FB': 'F&B',
    'RSVN_SALE': 'Reservation & Sales & Marketing',
    'HR': 'Human Resource',
    'HK': 'Housekeeping',
    'EXE_AC': 'Executive & Accounting',
    'JURISTIC': 'Juristic',
    'SEC': 'Security',
    'KITCHEN': 'Kitchen',
    'BANQUET': 'Banquet',
    'ENG': 'Engineer',
};

// Status Mapping for Import
export const STATUS_MAP: Record<string, string> = {
    'New': 'NEW',
    'On Process': 'IN_PROGRESS',
    'On Hold': 'ON_HOLD',
    'Done': 'DONE',
    'Cancel': 'CANCEL',
    'NEW': 'NEW',
    'IN_PROGRESS': 'IN_PROGRESS',
    'ON_HOLD': 'ON_HOLD',
    'DONE': 'DONE',
    'CANCEL': 'CANCEL',
};
