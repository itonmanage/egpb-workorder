'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ExternalLink, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { playNotificationSound } from '@/lib/notification-sound';

interface ToastNotification {
    id: string;
    type: 'it' | 'engineer';
    ticketNumber: string;
    title: string;
    description: string;
    ticketId: string;
    area?: string;
    location?: string;
    typeOfDamage?: string;
}

interface ToastNotificationProps {
    notification: ToastNotification;
    onClose: () => void;
}

export function ToastNotification({ notification, onClose }: ToastNotificationProps) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Fade in animation
        setTimeout(() => setIsVisible(true), 10);

        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - (100 / 150))); // 15 seconds = 150 intervals
        }, 100);

        // Auto-hide after 15 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 15000);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleClick = () => {
        const path = notification.type === 'it'
            ? `/dashboard/ticket/${notification.ticketId}`
            : `/dashboard/engineer/ticket/${notification.ticketId}`;
        router.push(path);
        handleClose();
    };

    const isIT = notification.type === 'it';
    const bgGradient = isIT
        ? 'from-blue-500 via-blue-600 to-indigo-600'
        : 'from-orange-500 via-orange-600 to-red-600';
    const borderColor = isIT ? 'border-blue-400' : 'border-orange-400';
    const iconBg = isIT ? 'bg-blue-100' : 'bg-orange-100';
    const iconColor = isIT ? 'text-blue-600' : 'text-orange-600';
    const progressBg = isIT ? 'bg-blue-500' : 'bg-orange-500';

    return (
        <div
            className={`toast-enter fixed top-20 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border-2 ${borderColor} overflow-hidden ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Header with Gradient */}
            <div className={`bg-gradient-to-r ${bgGradient} px-5 py-4 relative overflow-hidden`}>
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)]"></div>
                </div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon Badge */}
                        <div className={`${iconBg} ${iconColor} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110`}>
                            <span className="text-2xl">{isIT ? '🎫' : '🔧'}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base tracking-wide">
                                {isIT ? 'New IT Ticket' : 'New Engineer Ticket'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock size={14} className="text-white/80" />
                                <span className="text-white/90 text-xs font-medium">Just now</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/90 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 transform hover:scale-110"
                        aria-label="Close notification"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 bg-gradient-to-b from-gray-50 to-white">
                {/* Ticket Number Badge */}
                <div className="mb-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${isIT ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        } shadow-sm`}>
                        {notification.ticketNumber}
                    </span>
                </div>

                {/* Title - Show Description as main heading */}
                <h4 className="font-bold text-gray-900 text-lg mb-3 line-clamp-1 leading-tight">
                    {notification.description || 'No description'}
                </h4>

                {/* Details Grid */}
                <div className="space-y-2 mb-4">
                    {notification.location && (
                        <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-xs font-semibold min-w-[80px]">Area:</span>
                            <span className="text-gray-700 text-sm font-medium flex-1">{notification.location}</span>
                        </div>
                    )}
                    {notification.typeOfDamage && (
                        <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-xs font-semibold min-w-[80px]">Type:</span>
                            <span className="text-gray-700 text-sm font-medium flex-1">{notification.typeOfDamage}</span>
                        </div>
                    )}
                    {notification.title && (
                        <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-xs font-semibold min-w-[80px]">Location:</span>
                            <span className="text-gray-600 text-sm flex-1 line-clamp-2">{notification.title}</span>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleClick}
                    className={`w-full bg-gradient-to-r ${bgGradient} hover:shadow-lg text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group`}
                >
                    <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>View Ticket Details</span>
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-200 relative overflow-hidden">
                <div
                    className={`h-full ${progressBg} transition-all duration-100 ease-linear shadow-sm relative`}
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ animation: 'shimmer 2s infinite' }}></div>
                </div>
            </div>
        </div>
    );
}

export function ToastContainer() {
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);

    const addNotification = useCallback((notification: ToastNotification) => {
        setNotifications(prev => [...prev, notification]);

        // Play notification sound
        playNotificationSound();
    }, []);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Listen for custom toast events
    useEffect(() => {
        const handleToastEvent = (event: Event) => {
            const customEvent = event as CustomEvent<ToastNotification>;
            if (customEvent.detail) {
                addNotification(customEvent.detail);
            }
        };

        window.addEventListener('showToast', handleToastEvent);
        return () => {
            window.removeEventListener('showToast', handleToastEvent);
        };
    }, [addNotification]);

    return (
        <div className="fixed top-0 right-0 z-50 pointer-events-none p-4">
            <div className="pointer-events-auto space-y-4">
                {notifications.map((notification, index) => (
                    <div
                        key={notification.id}
                        style={{
                            marginTop: index * 8,
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        <ToastNotification
                            notification={notification}
                            onClose={() => removeNotification(notification.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
