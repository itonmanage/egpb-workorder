/**
 * Shared TypeScript types for the ticket-form-app
 */

/**
 * Ticket image interface
 */
export interface TicketImage {
    id: string;
    imageUrl?: string;
    image_url?: string;
}

/**
 * Ticket interface
 */
export interface Ticket {
    id: string;
    ticketNumber: string;
    title: string | null;
    description: string | null;
    department: string | null;
    location: string | null;
    typeOfDamage: string;
    status: string;
    createdAt: string;
    adminNotes: string | null;
    assignTo: string | null;
    informationBy?: string | null;
    updatedAt: string;
    user?: {
        username: string;
    };
    username?: string;
    images?: TicketImage[];
}

/**
 * Ticket statistics interface
 */
export interface TicketStats {
    NEW: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    DONE: number;
    CANCEL: number;
}

/**
 * Ticket type for distinguishing IT vs Engineer tickets
 */
export type TicketType = 'it' | 'engineer';
