/**
 * Ticket Number Generator
 * 
 * Generates unique ticket numbers with the following format:
 * - IT Tickets: EGPB-IT25-00001, EGPB-IT25-00002, ...
 * - Engineer Tickets: EGPB-EN25-00001, EGPB-EN25-00002, ...
 * 
 * Format: EGPB-{TYPE}{YEAR}-{NUMBER}
 * - EGPB: Company prefix
 * - IT/EN: Ticket type
 * - 25: Year (last 2 digits)
 * - 00001: Sequential 5-digit number
 */

import { prisma } from './prisma';

/**
 * Get current year suffix (last 2 digits)
 */
function getYearSuffix(): string {
  const year = new Date().getFullYear();
  return year.toString().slice(-2); // e.g., 2025 -> "25"
}

/**
 * Generate next ticket number for IT tickets
 */
export async function generateITTicketNumber(): Promise<string> {
  const year = getYearSuffix();
  const prefix = `EGPB-IT${year}-`;

  // Find the latest ticket number with this year's prefix
  const latestTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: 'desc',
    },
  });

  let nextNumber = 1;

  if (latestTicket) {
    // Extract number from ticket (e.g., "EGPB-IT25-00042" -> "00042" -> 42)
    const lastNumber = latestTicket.ticketNumber.split('-').pop();
    if (lastNumber) {
      nextNumber = parseInt(lastNumber, 10) + 1;
    }
  }

  // Format number with leading zeros (5 digits)
  const formattedNumber = nextNumber.toString().padStart(5, '0');

  return `${prefix}${formattedNumber}`;
}

/**
 * Generate next ticket number for Engineer tickets
 */
export async function generateEngineerTicketNumber(): Promise<string> {
  const year = getYearSuffix();
  const prefix = `EGPB-EN${year}-`;

  // Find the latest ticket number with this year's prefix
  const latestTicket = await prisma.engineerTicket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: 'desc',
    },
  });

  let nextNumber = 1;

  if (latestTicket) {
    // Extract number from ticket (e.g., "EGPB-EN25-00042" -> "00042" -> 42)
    const lastNumber = latestTicket.ticketNumber.split('-').pop();
    if (lastNumber) {
      nextNumber = parseInt(lastNumber, 10) + 1;
    }
  }

  // Format number with leading zeros (5 digits)
  const formattedNumber = nextNumber.toString().padStart(5, '0');

  return `${prefix}${formattedNumber}`;
}

/**
 * Validate ticket number format
 */
export function validateTicketNumber(ticketNumber: string, type: 'IT' | 'EN'): boolean {
  const year = getYearSuffix();
  const pattern = new RegExp(`^EGPB-${type}${year}-\\d{5}$`);
  return pattern.test(ticketNumber);
}

