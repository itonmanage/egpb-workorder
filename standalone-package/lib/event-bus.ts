/**
 * Simple Event Bus for Server-Sent Events
 * ใช้สำหรับ broadcast events ระหว่าง API routes
 */

type EventListener = (data: unknown) => void;

class EventBus {
    private listeners: Map<string, Set<EventListener>> = new Map();

    on(event: string, listener: EventListener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    off(event: string, listener: EventListener) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
        }
    }

    emit(event: string, data: unknown) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    removeAllListeners(event?: string) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Export singleton instance
export const eventBus = new EventBus();
