"use client";

import Link from 'next/link';
import { MapPin, Building, FileText, ChevronRight, Inbox } from 'lucide-react';
import { getStatusColor, getStatusDisplayName } from '@/lib/ticket-utils';
import { Ticket } from '@/lib/types';

interface EngineerTicketCardsMobileProps {
    tickets: Ticket[];
    loading: boolean;
}

/**
 * Mobile/Tablet card view for Engineer Dashboard tickets
 * Displays tickets in a responsive grid layout optimized for touch devices
 * 
 * Layout: 1 column on mobile, 2 on sm, 3 on md
 * Hidden on desktop (lg:hidden applied by parent)
 */
export default function EngineerTicketCardsMobile({ tickets, loading }: EngineerTicketCardsMobileProps) {
    // Loading skeleton
    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty state
    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No tickets found</p>
            </div>
        );
    }

    // Ticket cards grid
    return (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tickets.map((ticket: Ticket) => (
                <Link
                    key={ticket.id}
                    href={`/dashboard/engineer/ticket/${ticket.id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow active:bg-gray-50"
                >
                    {/* Header: Ticket ID + Status */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-mono font-semibold text-green-600">
                            {ticket.ticketNumber || `#${ticket.id.slice(0, 8)}`}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {getStatusDisplayName(ticket.status)}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        {/* Area */}
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Area</p>
                                <p className="text-sm font-medium text-gray-900">{ticket.location || '-'}</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-2">
                            <Building size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm text-gray-900 truncate">{ticket.title || '-'}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex items-start gap-2">
                            <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Description</p>
                                <p className="text-sm text-gray-900 line-clamp-2">{ticket.description || 'No description'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString('en-GB')}
                        </span>
                        <ChevronRight size={16} className="text-gray-400" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
