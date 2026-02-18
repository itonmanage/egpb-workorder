"use client";

import { useState, useEffect } from 'react';
import { Activity, LogOut, ChevronDown, Ticket, TrendingUp } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';

interface UserStats {
    totalCreated: number;
    totalAssigned: number;
    completedThisMonth: number;
    activeTickets: number;
}

interface UserActivity {
    id: string;
    action: string;
    ticketNumber: string | null;
    ticketType: string | null;
    details: string | null;
    createdAt: string;
}

interface UserProfileDropdownProps {
    username: string;
    userRole: string;
    onLogout: () => void;
    onFilterMyTickets?: () => void;
}

export default function UserProfileDropdown({ username, userRole, onLogout, onFilterMyTickets }: UserProfileDropdownProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'activity'>('stats');

    const getUserInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    // Auto-refresh unread count every 30 seconds
    useEffect(() => {
        if (showDropdown) {
            fetchStats();
            fetchActivities();
        }
    }, [showDropdown]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/users/stats');
            const result = await response.json();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await fetch('/api/users/activity?limit=5');
            const result = await response.json();
            if (result.success) {
                setActivities(result.data.activities);
            }
        } catch (error) {
            console.error('Fetch activities error:', error);
        }
    };


    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 hover:bg-green-50 rounded-xl transition-all duration-300 group"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                    {getUserInitials(username)}
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fadeIn"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-green-100 z-50 overflow-hidden animate-slideDown">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg">
                                    {getUserInitials(username)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{username}</h3>
                                    <p className="text-sm text-green-100">{ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] || userRole}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'stats'
                                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                                    }`}
                            >
                                <TrendingUp size={16} className="inline mr-1" />
                                Stats
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'activity'
                                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Activity size={16} className="inline mr-1" />
                                Activity
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {/* Stats Tab */}
                            {activeTab === 'stats' && stats && (
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                if (onFilterMyTickets) {
                                                    onFilterMyTickets();
                                                    setShowDropdown(false);
                                                }
                                            }}
                                            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100 hover:shadow-md hover:scale-105 transition-all cursor-pointer text-left"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-blue-600 font-medium">Created</span>
                                                <Ticket size={14} className="text-blue-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-blue-700">{stats.totalCreated}</p>
                                            <span className="text-xs text-blue-500 mt-1 block">Click to filter</span>
                                        </button>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-green-600 font-medium">Completed</span>
                                                <TrendingUp size={14} className="text-green-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-green-700">{stats.completedThisMonth}</p>
                                            <span className="text-xs text-green-600">This month</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 'activity' && (
                                <div className="p-2">
                                    {activities.length > 0 ? (
                                        <div className="space-y-1">
                                            {activities.map((activity) => (
                                                <div key={activity.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-800">{activity.action}</p>
                                                            {activity.ticketNumber && (
                                                                <p className="text-xs text-gray-500">
                                                                    Ticket: {activity.ticketNumber}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {formatTimeAgo(activity.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400">
                                            <Activity size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No recent activity</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 p-2">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
