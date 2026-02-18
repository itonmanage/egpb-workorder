'use client';

import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import NextImage from 'next/image';
import { useEffect } from 'react';

interface ImageLightboxProps {
    images: Array<{ url: string; name: string }>;
    currentIndex: number;
    onClose: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNext, onPrevious }: ImageLightboxProps) {
    const currentImage = images[currentIndex];
    const hasMultiple = images.length > 1;

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Navigate with arrow keys
    useEffect(() => {
        if (!hasMultiple) return;

        const handleArrowKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
            if (e.key === 'ArrowRight' && onNext) onNext();
        };
        window.addEventListener('keydown', handleArrowKeys);
        return () => window.removeEventListener('keydown', handleArrowKeys);
    }, [hasMultiple, onNext, onPrevious]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 w-12 h-12 bg-red-600 hover:bg-red-700 hover:scale-110 active:scale-95 text-white rounded-full flex items-center justify-center transition-all duration-200 z-[10000] shadow-lg animate-in fade-in slide-in-from-top-2"
                title="Close (Esc)"
            >
                <X size={28} />
            </button>

            {/* Image Counter */}
            {hasMultiple && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-full text-base font-medium z-[10000] animate-in fade-in slide-in-from-top-2 duration-300">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Previous Button */}
            {hasMultiple && onPrevious && currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrevious();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white bg-opacity-90 hover:bg-opacity-100 hover:scale-110 active:scale-95 text-black rounded-full flex items-center justify-center transition-all duration-200 z-[10000] shadow-lg animate-in fade-in slide-in-from-left-2"
                    title="Previous (←)"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {/* Next Button */}
            {hasMultiple && onNext && currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white bg-opacity-90 hover:bg-opacity-100 hover:scale-110 active:scale-95 text-black rounded-full flex items-center justify-center transition-all duration-200 z-[10000] shadow-lg animate-in fade-in slide-in-from-right-2"
                    title="Next (→)"
                >
                    <ChevronRight size={32} />
                </button>
            )}

            {/* Image Container */}
            <div
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center animate-in zoom-in-95 fade-in duration-300"
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <NextImage
                        src={currentImage.url}
                        alt={currentImage.name}
                        fill
                        className="object-contain"
                        quality={100}
                        priority
                    />
                </div>
            </div>

            {/* Image Name */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-full text-sm max-w-md truncate z-[10000] animate-in fade-in slide-in-from-bottom-2 duration-300">
                {currentImage.name}
            </div>
        </div>
    );
}
