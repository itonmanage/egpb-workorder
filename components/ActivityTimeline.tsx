'use client';

import { useEffect, useState } from 'react';
import { Clock, User, FileText, Image as ImageIcon, CheckCircle, AlertCircle, ChevronDown, ChevronUp, History, Trash2 } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/ticket-utils';

interface Activity {
    id: string;
    actionType: string;
    oldValue?: string | null;
    newValue?: string | null;
    description?: string | null;
    createdAt: string;
    user?: {
        id: string;
        username: string;
        fullName?: string | null;
        role: string;
    } | null;
}

interface ActivityTimelineProps {
    ticketId: string;
    ticketType: 'it' | 'engineer';
}

const INITIAL_DISPLAY_COUNT = 5;

const getActivityIcon = (actionType: string) => {
    switch (actionType) {
        case 'created':
            return <FileText className="text-blue-600" size={18} />;
        case 'status_changed':
            return <CheckCircle className="text-green-600" size={18} />;
        case 'assigned':
        case 'reassigned':
            return <User className="text-purple-600" size={18} />;
        case 'comment_added':
            return <FileText className="text-gray-600" size={18} />;
        case 'image_uploaded':
            return <ImageIcon className="text-orange-600" size={18} />;
        case 'image_deleted':
            return <Trash2 className="text-red-600" size={18} />;
        case 'notes_updated':
            return <AlertCircle className="text-yellow-600" size={18} />;
        default:
            return <Clock className="text-gray-600" size={18} />;
    }
};

const getActivityTitle = (actionType: string) => {
    switch (actionType) {
        case 'created':
            return 'Ticket Created';
        case 'status_changed':
            return 'Status Changed';
        case 'assigned':
            return 'Assigned';
        case 'reassigned':
            return 'Reassigned';
        case 'comment_added':
            return 'Comment Added';
        case 'image_uploaded':
            return 'Image Uploaded';
        case 'image_deleted':
            return 'Image Deleted';
        case 'notes_updated':
            return 'Notes Updated';
        default:
            return actionType;
    }
};

const getActivityColor = (actionType: string) => {
    switch (actionType) {
        case 'created':
            return 'bg-blue-50 border-blue-200';
        case 'status_changed':
            return 'bg-green-50 border-green-200';
        case 'assigned':
        case 'reassigned':
            return 'bg-purple-50 border-purple-200';
        case 'notes_updated':
            return 'bg-yellow-50 border-yellow-200';
        case 'image_uploaded':
            return 'bg-orange-50 border-orange-200';
        case 'image_deleted':
            return 'bg-red-50 border-red-200';
        default:
            return 'bg-gray-50 border-gray-200';
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatRelativeTime = (dateString: string) => {
    // Always show exact date and time
    return formatDate(dateString);
};

export function ActivityTimeline({ ticketId, ticketType }: ActivityTimelineProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const endpoint = ticketType === 'it'
                    ? `/api/tickets/${ticketId}/timeline`
                    : `/api/engineer-tickets/${ticketId}/timeline`;

                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    setActivities(data.activities || []);
                }
            } catch (error) {
                console.error('Error fetching timeline:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, [ticketId, ticketType]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <History className="text-green-600" size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-black">Activity Timeline</h3>
                    </div>
                    <div className="text-center text-gray-500 py-8">
                        <div className="animate-pulse flex flex-col items-center gap-2">
                            <Clock className="text-gray-400" size={32} />
                            <p>Loading timeline...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <History className="text-green-600" size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-black">Activity Timeline</h3>
                    </div>
                    <div className="text-center text-gray-500 py-8">
                        <Clock className="mx-auto mb-2 text-gray-400" size={32} />
                        <p>No activities yet</p>
                    </div>
                </div>
            </div>
        );
    }

    const displayedActivities = showAll ? activities : activities.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = activities.length > INITIAL_DISPLAY_COUNT;

    return (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-white cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <History className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black">Activity Timeline</h3>
                            <p className="text-xs text-gray-600">{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-green-100 rounded-lg transition-colors">
                        {isExpanded ? (
                            <ChevronUp className="text-gray-600" size={20} />
                        ) : (
                            <ChevronDown className="text-gray-600" size={20} />
                        )}
                    </button>
                </div>
            </div>

            {/* Timeline Content */}
            {isExpanded && (
                <div className="p-6">
                    <div className="space-y-3">
                        {displayedActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className={`relative border rounded-xl p-4 transition-all hover:shadow-md ${getActivityColor(activity.actionType)}`}
                            >
                                <div className="flex gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                            {getActivityIcon(activity.actionType)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="font-semibold text-black text-sm">
                                                {getActivityTitle(activity.actionType)}
                                            </h4>
                                            <span className="text-xs text-gray-500 whitespace-nowrap" title={formatDate(activity.createdAt)}>
                                                {formatRelativeTime(activity.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">
                                            by <span className="font-medium">{activity.user?.username || 'System'}</span>
                                        </p>

                                        {/* Details */}
                                        {activity.actionType === 'status_changed' && activity.oldValue && activity.newValue && (
                                            <div className="mt-2 flex items-center gap-2 text-sm">
                                                <span className="px-2.5 py-1 bg-white rounded-md border border-gray-300 text-gray-700 font-medium text-xs">
                                                    {STATUS_LABELS[activity.oldValue] || activity.oldValue}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="px-2.5 py-1 bg-green-600 text-white rounded-md font-medium text-xs shadow-sm">
                                                    {STATUS_LABELS[activity.newValue] || activity.newValue}
                                                </span>
                                            </div>
                                        )}

                                        {activity.actionType === 'assigned' && activity.newValue && (
                                            <div className="mt-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                Assigned to: <span className="font-semibold text-purple-600">{activity.newValue}</span>
                                            </div>
                                        )}

                                        {activity.actionType === 'notes_updated' && (
                                            <div className="mt-2 space-y-2">
                                                {activity.oldValue && (
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-600 text-xs">Previous notes:</span>
                                                        <div className="mt-1 px-3 py-2 bg-white rounded-lg border border-gray-300 text-gray-700 text-xs">
                                                            {activity.oldValue}
                                                        </div>
                                                    </div>
                                                )}
                                                {activity.newValue && (
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-600 text-xs">
                                                            {activity.oldValue ? 'Updated notes:' : 'Notes added:'}
                                                        </span>
                                                        <div className="mt-1 px-3 py-2 bg-yellow-100 rounded-lg border border-yellow-300 text-gray-700 text-xs font-medium">
                                                            {activity.newValue}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activity.description && activity.actionType !== 'notes_updated' && (
                                            <div className="mt-2 text-xs text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                {activity.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show More/Less Button */}
                    {hasMore && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-medium text-sm border border-green-200"
                            >
                                {showAll ? (
                                    <>
                                        <ChevronUp size={16} />
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown size={16} />
                                        Show {activities.length - INITIAL_DISPLAY_COUNT} More {activities.length - INITIAL_DISPLAY_COUNT === 1 ? 'Activity' : 'Activities'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
