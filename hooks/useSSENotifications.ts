'use client';

import { useEffect, useCallback } from 'react';

interface SSECallbacks {
    onNewTicket: () => void;
}

export function useSSENotifications(
    type: 'it' | 'engineer',
    isAdmin: boolean,
    callbacks: SSECallbacks
) {
    const { onNewTicket } = callbacks;

    const connectSSE = useCallback(() => {
        if (!isAdmin) return null;

        const eventSource = new EventSource('/api/sse');
        let reconnectTimeout: NodeJS.Timeout | undefined;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle keepalive
                if (data.type === 'keepalive') {
                    return;
                }

                // Filter by ticket type
                const eventType = type === 'it' ? 'new_it_ticket' : 'new_engineer_ticket';
                if (data.type === eventType) {
                    // Refresh data
                    onNewTicket();

                    // Show toast notification
                    const ticket = data.data;
                    const ticketType: 'it' | 'engineer' = type;
                    window.dispatchEvent(new CustomEvent('showToast', {
                        detail: {
                            id: `${type}-${ticket.id}-${Date.now()}`,
                            type: ticketType,
                            ticketNumber: ticket.ticketNumber,
                            title: ticket.title,
                            description: ticket.description,
                            ticketId: ticket.id,
                            area: ticket.area,
                            location: ticket.location,
                            typeOfDamage: ticket.typeOfDamage,
                        }
                    }));
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        };

        eventSource.onerror = () => {
            console.log('SSE connection error, reconnecting...');
            eventSource?.close();
            // Reconnect after 5 seconds
            reconnectTimeout = setTimeout(() => connectSSE(), 5000);
        };

        return { eventSource, reconnectTimeout };
    }, [isAdmin, type, onNewTicket]);

    useEffect(() => {
        const connection = connectSSE();

        return () => {
            connection?.eventSource?.close();
            if (connection?.reconnectTimeout) {
                clearTimeout(connection.reconnectTimeout);
            }
        };
    }, [connectSSE]);
}
