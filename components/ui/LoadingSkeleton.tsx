import React from 'react';

/**
 * LoadingSkeleton Component
 * 
 * แสดง skeleton loading states สำหรับ components ต่างๆ
 * รองรับหลาย variants: stats, table, form, card
 */

interface LoadingSkeletonProps {
    variant: 'stats' | 'table' | 'form' | 'card';
    count?: number;
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
    if (variant === 'stats') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                {/* Table Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
                {/* Table Rows */}
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="px-6 py-5 border-b border-gray-100">
                        <div className="grid grid-cols-6 gap-4 items-center">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="flex gap-2 justify-end">
                                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'form') {
        return (
            <div className="space-y-6 animate-pulse">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                        <div className="space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="flex gap-2 mt-4">
                                <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
                                <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
}
