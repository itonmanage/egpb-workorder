'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom hook to display notification count in browser tab title
 * @param count - Number of unread notifications
 * @param baseTitle - Base title to display (e.g., "EGPB Ticket - Dashboard")
 */
export function useTabBadge(count: number, baseTitle: string) {
    const previousCountRef = useRef(count);

    useEffect(() => {
        // Update tab title based on count
        if (count > 0) {
            document.title = `(${count}) ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }

        // Optional: Play sound when count increases
        // Uncomment the following lines to enable sound notification
        /*
        if (count > previousCountRef.current && count > 0) {
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(err => console.log('Audio play failed:', err));
        }
        */

        // Update previous count
        previousCountRef.current = count;

        // Cleanup: Reset title on unmount
        return () => {
            document.title = baseTitle;
        };
    }, [count, baseTitle]);
}
