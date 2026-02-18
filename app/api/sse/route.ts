import { NextRequest } from 'next/server';
import { eventBus } from '@/lib/event-bus';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
        return new Response('Unauthorized', { status: 401 });
    }

    const user = await getSession(token);
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'IT_ADMIN' || user.role === 'ENGINEER_ADMIN';

    // Only allow admins to connect to SSE
    if (!isAdmin) {
        return new Response('Forbidden', { status: 403 });
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection message
            const initialMessage = `data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`;
            controller.enqueue(encoder.encode(initialMessage));

            // Handler for new IT tickets
            const handleNewITTicket = (data: unknown) => {
                const message = `data: ${JSON.stringify({ type: 'new_it_ticket', data })}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // Handler for new Engineer tickets
            const handleNewEngineerTicket = (data: unknown) => {
                const message = `data: ${JSON.stringify({ type: 'new_engineer_ticket', data })}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // Register event listeners
            eventBus.on('new_it_ticket', handleNewITTicket);
            eventBus.on('new_engineer_ticket', handleNewEngineerTicket);

            // Send keepalive every 30 seconds
            const keepaliveInterval = setInterval(() => {
                try {
                    const keepaliveMessage = `data: ${JSON.stringify({ type: 'keepalive' })}\n\n`;
                    controller.enqueue(encoder.encode(keepaliveMessage));
                } catch (error) {
                    console.error('Error sending keepalive:', error);
                    clearInterval(keepaliveInterval);
                }
            }, 30000);

            // Cleanup on connection close
            request.signal.addEventListener('abort', () => {
                clearInterval(keepaliveInterval);
                eventBus.off('new_it_ticket', handleNewITTicket);
                eventBus.off('new_engineer_ticket', handleNewEngineerTicket);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
