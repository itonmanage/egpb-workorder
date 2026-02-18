import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * EmptyState Component
 * 
 * แสดง empty state เมื่อไม่มีข้อมูล
 * รองรับ icon, title, description, และ action button
 */

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    };
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
            {/* Icon */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Icon size={40} className="text-gray-400" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-600 text-center max-w-md mb-6">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className={`
                        px-6 py-3 rounded-xl font-medium transition-all
                        ${action.variant === 'secondary'
                            ? 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                        }
                    `}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
