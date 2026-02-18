import { prisma } from './prisma';

export type ActivityType =
    | 'created'
    | 'status_changed'
    | 'assigned'
    | 'comment_added'
    | 'image_uploaded'
    | 'notes_updated'
    | 'reassigned';

interface LogActivityParams {
    ticketId: string;
    userId?: string;
    actionType: ActivityType;
    oldValue?: string;
    newValue?: string;
    description?: string;
}

export async function logTicketActivity(params: LogActivityParams) {
    try {
        console.log('[Activity Logger] Logging IT ticket activity:', params);
        const result = await prisma.ticketActivity.create({
            data: {
                ticketId: params.ticketId,
                userId: params.userId,
                actionType: params.actionType,
                oldValue: params.oldValue,
                newValue: params.newValue,
                description: params.description,
            },
        });
        console.log('[Activity Logger] IT ticket activity logged successfully:', result.id);
    } catch (error) {
        console.error('[Activity Logger] Error logging ticket activity:', error);
    }
}

export async function logEngineerTicketActivity(params: LogActivityParams) {
    try {
        await prisma.engineerTicketActivity.create({
            data: {
                ticketId: params.ticketId,
                userId: params.userId,
                actionType: params.actionType,
                oldValue: params.oldValue,
                newValue: params.newValue,
                description: params.description,
            },
        });
    } catch (error) {
        console.error('Error logging engineer ticket activity:', error);
    }
}
