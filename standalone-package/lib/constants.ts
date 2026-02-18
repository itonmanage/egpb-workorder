/**
 * Shared Constants for EGPB Ticket System
 */

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

// Ticket Status Type
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCEL';
