"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { playNotificationSound } from '@/lib/notification-sound';

interface Notification {
    id: string;
    type: string;
    message: string;
    ticketNumber: string | null;
    ticketId: string | null;
    ticketType: string | null;
    read: boolean;
    createdAt: string;
}

interface BellNotificationProps {
    onUnreadCountChange?: (count: number) => void;
}

export default function BellNotification({ onUnreadCountChange }: BellNotificationProps = {}) {
    const [showPanel, setShowPanel] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const eventSourceRef = useRef<EventSource | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch initial notifications
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Setup SSE connection
    useEffect(() => {
        const connectSSE = () => {
            const eventSource = new EventSource('/api/notifications/sse');
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('SSE connected');
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_notification') {
                        // Play notification sound
                        playNotificationSound();

                        // Refresh notifications when new one arrives
                        fetchNotifications();
                    }
                } catch (error) {
                    console.error('SSE parse error:', error);
                }
            };

            eventSource.onerror = () => {
                console.log('SSE error, reconnecting...');
                eventSource.close();
                // Reconnect after 5 seconds
                setTimeout(connectSSE, 5000);
            };
        };

        connectSSE();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Notify parent component when unread count changes
    useEffect(() => {
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [unreadCount, onUnreadCountChange]);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowPanel(false);
            }
        };

        if (showPanel) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPanel]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/users/notifications?limit=10');
            const result = await response.json();
            if (result.success) {
                setNotifications(result.data.notifications);
                setUnreadCount(result.data.unreadCount);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/users/notifications/${id}`, {
                method: 'PATCH'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/users/notifications/mark-all-read', {
                method: 'POST'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Mark all as read error:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        if (notification.ticketId) {
            const ticketUrl = notification.ticketType === 'ENGINEER'
                ? `/dashboard/engineer/ticket/${notification.ticketId}`
                : `/dashboard/ticket/${notification.ticketId}`;
            window.location.href = ticketUrl;
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 hover:bg-green-50 rounded-xl transition-all duration-300 group"
            >
                <Bell size={20} className="text-gray-700 group-hover:text-green-600 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {showPanel && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Unread count and Mark all as read */}
                    {notifications.length > 0 && unreadCount > 0 && (
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
                            <span className="text-xs text-gray-600">{unreadCount} unread</span>
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                            >
                                Mark all as read
                            </button>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-4 transition-colors ${notification.read
                                            ? 'bg-white hover:bg-gray-50'
                                            : 'bg-blue-50 hover:bg-blue-100'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'
                                                }`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${notification.read
                                                    ? 'text-gray-600'
                                                    : 'text-gray-900 font-medium'
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
