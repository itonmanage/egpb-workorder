"use client";

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function SessionTimeout() {
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const logout = useCallback(async () => {
        // Double check if really inactive (to prevent tabs causing issues)
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity < TIMEOUT_MS) {
            // We can't easily call resetTimer here because of dependency cycles or defining it before/after
            // Instead, just restart the timer manually
            lastActivityRef.current = Date.now();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(logout, TIMEOUT_MS);
            return;
        }

        console.log('Session timed out due to inactivity.');
        // Clear all dashboard filters on auto-logout
        localStorage.removeItem('it-dashboard-filters');
        localStorage.removeItem('engineer-dashboard-filters');
        try {
            await apiClient.auth.signOut();
            router.push('/login?timeout=true');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login?timeout=true');
        }
    }, [router]); // Removing 'logout' from deps as it's recursive, and 'TIMEOUT_MS' is constant

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(logout, TIMEOUT_MS);
    }, [logout]);

    useEffect(() => {
        // Initial timer start
        resetTimer();

        // Events to track activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Throttle the event listener to avoid performance issues on mousemove
        let throttleTimer: NodeJS.Timeout | null = null;
        const handleActivity = () => {
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    resetTimer();
                    throttleTimer = null;
                }, 1000); // Update at most once per second
            }
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (throttleTimer) {
                clearTimeout(throttleTimer);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return null; // This component doesn't render anything
}
