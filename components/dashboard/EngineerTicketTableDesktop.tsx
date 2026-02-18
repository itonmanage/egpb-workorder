"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, Inbox } from 'lucide-react';
import { getStatusColor, getStatusDisplayName } from '@/lib/ticket-utils';
import { Ticket } from '@/lib/types';
import { LoadingSkeleton, EmptyState } from '@/components/ui';

interface EngineerTicketTableDesktopProps {
    tickets: Ticket[];
    loading: boolean;
    hasFilters: boolean;
    onCreateClick: () => void;
}

/**
 * Desktop table view for Engineer Dashboard tickets
 * Displays tickets in a full table layout with all columns (includes Information By column)
 * 
 * Features:
 * - Expandable rows for description preview
 * - Column truncation with tooltip on hover
 * - Loading skeleton and empty states
 * 
 * Hidden on mobile/tablet (hidden lg:block applied by parent)
 */
export default function EngineerTicketTableDesktop({
    tickets,
    loading,
    hasFilters,
    onCreateClick
}: EngineerTicketTableDesktopProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (ticketId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(ticketId)) {
            newExpanded.delete(ticketId);
        } else {
            newExpanded.add(ticketId);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-max">
                <thead className="bg-green-50 border-b border-green-100">
                    <tr>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Ticket ID</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Area</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Location</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Department</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Type Of Damage</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Request By</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Date</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Status</th>
                        <th className="px-3 py-3 font-semibold text-sm text-black whitespace-nowrap">Information By</th>
                        <th className="px-2 py-3 font-semibold text-sm text-black w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                    {loading ? (
                        <tr>
                            <td colSpan={10} className="p-0">
                                <LoadingSkeleton variant="table" count={10} />
                            </td>
                        </tr>
                    ) : tickets.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="p-0">
                                <EmptyState
                                    icon={hasFilters ? FileText : Inbox}
                                    title={hasFilters ? 'No tickets found' : 'No tickets yet'}
                                    description={hasFilters ? 'Try adjusting your search or filter criteria' : 'Create your first engineer ticket to get started'}
                                    action={!hasFilters ? {
                                        label: 'Create Ticket',
                                        onClick: onCreateClick
                                    } : undefined}
                                />
                            </td>
                        </tr>
                    ) : (
                        tickets.map((ticket) => {
                            const isExpanded = expandedRows.has(ticket.id);
                            return (
                                <React.Fragment key={ticket.id}>
                                    <tr className="border-b border-green-100 hover:bg-green-50 transition-colors">
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/dashboard/engineer/ticket/${ticket.id}`}
                                                className="font-mono text-sm text-green-600 hover:text-green-700 hover:underline"
                                            >
                                                {ticket.ticketNumber || `#${ticket.id.slice(0, 8)}`}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap max-w-[100px] truncate" title={ticket.location || '-'}>{ticket.location || '-'}</td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap max-w-[120px] truncate" title={ticket.title || '-'}>{ticket.title || '-'}</td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap max-w-[100px] truncate" title={ticket.department || '-'}>{ticket.department || '-'}</td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap max-w-[120px] truncate" title={ticket.typeOfDamage}>{ticket.typeOfDamage}</td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap">{ticket.user?.username || 'Unknown'}</td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                                {getStatusDisplayName(ticket.status)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-black whitespace-nowrap max-w-[100px] truncate" title={ticket.informationBy || '-'}>{ticket.informationBy || '-'}</td>
                                        <td className="px-2 py-3">
                                            <button
                                                onClick={() => toggleRow(ticket.id)}
                                                className="text-green-600 hover:text-green-700 transition-transform"
                                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr key={`${ticket.id}-desc`} className="bg-green-50/50">
                                            <td colSpan={10} className="px-6 py-4">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-sm font-semibold text-black min-w-fit">Description:</span>
                                                    <p className="text-sm text-black leading-relaxed" title={ticket.description || 'No description provided'}>
                                                        {ticket.description
                                                            ? (ticket.description.length > 50
                                                                ? ticket.description.substring(0, 50) + '...'
                                                                : ticket.description)
                                                            : 'No description provided'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
