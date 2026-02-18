"use client";

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface AdminActionsProps {
    ticketId: string;
    currentStatus: string;
    onUpdate: () => void;
    tableName?: 'tickets' | 'engineer_tickets';
    assignTo?: string | null;
    adminNotes?: string | null;
    savedAssignTo?: string | null;
    savedAdminNotes?: string | null;
}

const STATUS_OPTIONS = [
    { value: 'NEW', label: 'New' },
    { value: 'IN_PROGRESS', label: 'On Process' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'DONE', label: 'Done' },
    { value: 'CANCEL', label: 'Cancel' },
];

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case 'NEW': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'ON_HOLD': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'DONE': return 'bg-green-100 text-green-700 border-green-200';
        case 'CANCEL': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export default function AdminActions({ ticketId, currentStatus, onUpdate, tableName = 'tickets', assignTo, adminNotes, savedAssignTo, savedAdminNotes }: AdminActionsProps) {
    const [loading, setLoading] = useState(false);
    const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);

    const handleStatusUpdate = async (newStatus: string) => {
        // Validate "Assign to" field for DONE status - must be saved (not just filled)
        if (newStatus === 'DONE') {
            if (!assignTo || assignTo.trim() === '') {
                toast.error('Cannot change status to "Done". Please fill in the "Assign to" field first.');
                return;
            }
            // Check if the current value has been saved
            if (assignTo !== (savedAssignTo || '')) {
                toast.error('Cannot change status to "Done". Please save the "Assign to" field first.');
                return;
            }
        }

        // Validate "Admin Notes" field for ON_HOLD and CANCEL status - must be saved (not just filled)
        if (newStatus === 'ON_HOLD' || newStatus === 'CANCEL') {
            if (!adminNotes || adminNotes.trim() === '') {
                toast.error(`Cannot change status to "${newStatus === 'ON_HOLD' ? 'On Hold' : 'Cancel'}". Please fill in the "Admin Notes" field first.`);
                return;
            }
            // Check if the current value has been saved
            if (adminNotes !== (savedAdminNotes || '')) {
                toast.error(`Cannot change status to "${newStatus === 'ON_HOLD' ? 'On Hold' : 'Cancel'}". Please save the "Admin Notes" field first.`);
                return;
            }
        }

        // Store previous status for rollback
        const previousStatus = optimisticStatus;

        // Optimistic update - change UI immediately
        setOptimisticStatus(newStatus);
        setLoading(true);

        try {
            const updateFn = tableName === 'engineer_tickets'
                ? apiClient.engineerTickets.update
                : apiClient.tickets.update;

            const result = await updateFn(ticketId, { status: newStatus });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update status');
            }

            toast.success('Status updated successfully!');
            onUpdate();
        } catch (error) {
            console.error('Error updating status:', error);
            // Rollback on error
            setOptimisticStatus(previousStatus);
            toast.error('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <select
            disabled={loading}
            value={optimisticStatus}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className={`w-full px-4 py-2 rounded-xl border-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${getStatusColor(optimisticStatus)} [&>option]:bg-white [&>option]:text-black`}
        >
            {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                    {status.label}
                </option>
            ))}
        </select>
    );
}
