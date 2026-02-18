// SSE Connection Manager for real-time notifications
type SSEConnection = {
    userId: string;
    controller: ReadableStreamDefaultController;
    encoder: TextEncoder;
};

class SSEManager {
    private connections: Map<string, SSEConnection[]> = new Map();

    addConnection(userId: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
        const userConnections = this.connections.get(userId) || [];
        userConnections.push({ userId, controller, encoder });
        this.connections.set(userId, userConnections);
        console.log(`SSE: User ${userId} connected. Total connections: ${userConnections.length}`);
    }

    removeConnection(userId: string, controller: ReadableStreamDefaultController) {
        const userConnections = this.connections.get(userId) || [];
        const filtered = userConnections.filter(conn => conn.controller !== controller);

        if (filtered.length > 0) {
            this.connections.set(userId, filtered);
        } else {
            this.connections.delete(userId);
        }
        console.log(`SSE: User ${userId} disconnected. Remaining connections: ${filtered.length}`);
    }

    sendToUser(userId: string, data: unknown) {
        const userConnections = this.connections.get(userId);
        if (!userConnections || userConnections.length === 0) {
            console.log(`SSE: No active connections for user ${userId}`);
            return;
        }

        const message = `data: ${JSON.stringify(data)}\n\n`;

        userConnections.forEach(conn => {
            try {
                conn.controller.enqueue(conn.encoder.encode(message));
                console.log(`SSE: Sent notification to user ${userId}`);
            } catch (error) {
                console.error(`SSE: Error sending to user ${userId}:`, error);
                this.removeConnection(userId, conn.controller);
            }
        });
    }

    getConnectionCount(userId: string): number {
        return this.connections.get(userId)?.length || 0;
    }
}

// Global SSE manager instance
export const sseManager = new SSEManager();
