/**
 * Notification Sound Utility
 * 
 * This module provides a simple way to play notification sounds
 * If notification.mp3 is not available, it will generate a beep using Web Audio API
 * Auto-initializes AudioContext on first user interaction
 */

// ========================================
// CONFIGURATION - เปลี่ยนชื่อไฟล์เสียงได้ที่นี่
// ========================================
const NOTIFICATION_SOUND_PATH = '/notification.mp3';
// เปลี่ยนเลข VERSION ทุกครั้งที่เปลี่ยนไฟล์เสียง (เช่น 1, 2, 3, ...)
const SOUND_VERSION = 2;

let audioContext: AudioContext | null = null;
let isAudioReady = false;

/**
 * Initialize AudioContext on first user interaction
 * This is required by browsers to allow audio playback
 */
function initAudioContext() {
    if (!isAudioReady && !audioContext) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Resume context if it's suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            isAudioReady = true;
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        }
    }
}

// Auto-initialize on any user interaction
if (typeof window !== 'undefined') {
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    const initOnce = () => {
        initAudioContext();
        // Remove listeners after first interaction
        events.forEach(event => {
            document.removeEventListener(event, initOnce);
        });
    };

    events.forEach(event => {
        document.addEventListener(event, initOnce, { once: true });
    });
}

/**
 * Play notification sound
 * Falls back to beep if MP3 file is not available
 */
export function playNotificationSound() {
    // Ensure AudioContext is ready
    initAudioContext();

    try {
        // Try to play MP3 file first
        // Add version to bypass browser cache
        const audio = new Audio(`${NOTIFICATION_SOUND_PATH}?v=${SOUND_VERSION}`);
        audio.volume = 0.5;
        audio.play().catch(() => {
            // If MP3 fails, play a beep sound
            playBeep();
        });
    } catch {
        // If Audio fails, play a beep sound
        playBeep();
    }
}

/**
 * Generate and play a simple beep sound using Web Audio API
 */
function playBeep() {
    try {
        if (!audioContext) {
            initAudioContext();
        }

        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure the beep
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine'; // Sine wave for smooth sound

        // Fade in and out
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);

        // Play the beep
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    } catch (error) {
        console.error('Failed to play beep:', error);
    }
}
