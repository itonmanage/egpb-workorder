import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { sseManager } from '@/lib/sse-manager';

// SSE endpoint for real-time notifications
export async function GET(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        return new Response('Unauthorized', { status: 401 });
    }

    const user = await getSession(token);
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Add connection to manager
            sseManager.addConnection(user.id, controller, encoder);

            // Send initial connection message
            const data = `data: ${JSON.stringify({ type: 'connected', userId: user.id })}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Keep connection alive with heartbeat
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch {
                    clearInterval(heartbeat);
                    sseManager.removeConnection(user.id, controller);
                }
            }, 30000); // Every 30 seconds

            // Cleanup on close
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (request as any).cleanup = () => {
                clearInterval(heartbeat);
                sseManager.removeConnection(user.id, controller);
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            };
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
