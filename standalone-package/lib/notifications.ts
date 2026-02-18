// Notification helper functions for browser notifications

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });

        return notification;
    }
    return null;
}

export function showNewTicketNotification(ticketNumber: string, description: string, ticketId: string) {
    const notification = showNotification('🎫 New Ticket Created', {
        body: `${ticketNumber}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
        tag: ticketId,
        requireInteraction: false,
        silent: false,
    });

    if (notification) {
        notification.onclick = () => {
            window.focus();
            window.location.href = `/dashboard/ticket/${ticketId}`;
            notification.close();
        };
    }

    return notification;
}
