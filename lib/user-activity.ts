import { prisma } from './prisma';
import { getStatusDisplayName } from './ticket-utils';
import { sseManager } from './sse-manager';

/**
 * Log user activity
 */
export async function logUserActivity(
    userId: string,
    action: string,
    ticketId?: string,
    ticketNumber?: string,
    ticketType?: 'IT' | 'ENGINEER',
    details?: string
) {
    try {
        await prisma.userActivity.create({
            data: {
                userId,
                action,
                ticketId,
                ticketNumber,
                ticketType,
                details
            }
        });
    } catch (error) {
        console.error('Log user activity error:', error);
    }
}

/**
 * Create notification for user
 */
export async function createNotification(
    userId: string,
    type: 'assignment' | 'comment' | 'status_change' | 'mention',
    message: string,
    ticketId?: string,
    ticketNumber?: string,
    ticketType?: 'IT' | 'ENGINEER'
) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                message,
                ticketId,
                ticketNumber,
                ticketType
            }
        });

        // Broadcast to user via SSE
        sseManager.sendToUser(userId, {
            type: 'new_notification',
            data: notification
        });

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
    }
}

/**
 * Create notification for ticket assignment
 */
export async function notifyTicketAssignment(
    assignedUsername: string,
    ticketNumber: string,
    ticketType: 'IT' | 'ENGINEER',
    ticketId: string
) {
    try {
        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username: assignedUsername }
        });

        if (user) {
            await createNotification(
                user.id,
                'assignment',
                `You have been assigned to ticket ${ticketNumber}`,
                ticketId,
                ticketNumber,
                ticketType
            );
        }
    } catch (error) {
        console.error('Notify ticket assignment error:', error);
    }
}

/**
 * Create notification for status change
 */
export async function notifyStatusChange(
    userId: string,
    ticketNumber: string,
    oldStatus: string,
    newStatus: string,
    ticketType: 'IT' | 'ENGINEER',
    ticketId: string
) {
    try {
        const oldStatusDisplay = getStatusDisplayName(oldStatus);
        const newStatusDisplay = getStatusDisplayName(newStatus);

        await createNotification(
            userId,
            'status_change',
            `Ticket ${ticketNumber} status changed from ${oldStatusDisplay} to ${newStatusDisplay}`,
            ticketId,
            ticketNumber,
            ticketType
        );
    } catch (error) {
        console.error('Notify status change error:', error);
    }
}

/**
 * Create notification for new comment
 */
export async function notifyNewComment(
    userId: string,
    ticketNumber: string,
    commenterName: string,
    ticketType: 'IT' | 'ENGINEER',
    ticketId: string
) {
    try {
        await createNotification(
            userId,
            'comment',
            `${commenterName} commented on ticket ${ticketNumber}`,
            ticketId,
            ticketNumber,
            ticketType
        );
    } catch (error) {
        console.error('Notify new comment error:', error);
    }
}
