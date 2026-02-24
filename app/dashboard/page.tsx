"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, Search, AlertCircle, Clock, CheckCircle, Download, Users, Bell, BarChart, ChevronDown, ChevronLeft, ChevronRight, XCircle, PauseCircle, Calendar, X, FilterX, Settings } from 'lucide-react';
import { exportToExcel } from '@/lib/exportToExcel';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ToastContainer } from '@/components/ToastNotification';
import { useSSENotifications } from '@/hooks/useSSENotifications';
import { useTabBadge } from '@/hooks/useTabBadge';
import { getStatusDisplayName } from '@/lib/ticket-utils';
import { Ticket, TicketImage, TicketStats } from '@/lib/types';
import BellNotification from '@/components/BellNotification';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import DashboardMenu from '@/components/DashboardMenu';
import { ITTicketCardsMobile, ITTicketTableDesktop } from '@/components/dashboard';


export default function Dashboard() {
    const router = useRouter();
    const pathname = usePathname();



    // Data State
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<TicketStats>({
        NEW: 0,
        IN_PROGRESS: 0,
        ON_HOLD: 0,
        DONE: 0,
        CANCEL: 0
    });
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // User & UI State
    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [showNotifications, setShowNotifications] = useState(false);

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [myTicketsFilter, setMyTicketsFilter] = useState(false);
    const ITEMS_PER_PAGE = 20;

    const [newTickets, setNewTickets] = useState<Ticket[]>([]);
    const [userNotificationCount, setUserNotificationCount] = useState(0);


    // Fetch Paginated Tickets
    const fetchTickets = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const offset = (currentPage - 1) * ITEMS_PER_PAGE;
            const filters: {
                limit: number;
                offset: number;
                search?: string;
                status?: string;
                type?: string;
                startDate?: string;
                endDate?: string;
            } = {
                limit: ITEMS_PER_PAGE,
                offset: offset,
            };

            if (searchQuery) filters.search = searchQuery;
            if (filterStatus) filters.status = filterStatus;
            if (filterType) filters.type = filterType;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (myTicketsFilter) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (filters as any).createdByMe = 'true';
            }

            const result = await apiClient.tickets.list(filters);

            if (result.success && result.data) {
                setTickets(result.data.tickets || []);
                setTotalCount(result.data.count || 0);
                // Update stats from the same response — no extra API call needed
                if (result.data.statusCounts) {
                    setStats(result.data.statusCounts);
                }
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [currentPage, searchQuery, filterStatus, filterType, startDate, endDate, myTicketsFilter]);

    // Fetch Recent New Tickets for Notifications
    const fetchRecentNewTickets = useCallback(async () => {
        try {
            const result = await apiClient.tickets.list({
                status: 'NEW',
                limit: 20,
                unviewedOnly: 'true'
            });
            if (result.success && result.data) {
                setNewTickets(result.data.tickets || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    // Load filters from localStorage on mount
    useEffect(() => {
        const savedFilters = localStorage.getItem('it-dashboard-filters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                if (filters.search) setSearchQuery(filters.search);
                if (filters.status) setFilterStatus(filters.status);
                if (filters.type) setFilterType(filters.type);
                if (filters.startDate) setStartDate(filters.startDate);
                if (filters.endDate) setEndDate(filters.endDate);
                if (filters.createdByMe !== undefined) setMyTicketsFilter(filters.createdByMe);
            } catch (error) {
                console.error('Error loading filters:', error);
            }
        }
    }, []);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        const filters = {
            search: searchQuery,
            status: filterStatus,
            type: filterType,
            startDate,
            endDate,
            createdByMe: myTicketsFilter
        };
        localStorage.setItem('it-dashboard-filters', JSON.stringify(filters));
    }, [searchQuery, filterStatus, filterType, startDate, endDate, myTicketsFilter]);

    // Initial Load & Auth Check
    useEffect(() => {
        const init = async () => {
            const result = await apiClient.auth.getUser();
            if (result.success && result.data?.user) {
                const user = result.data.user;
                setUsername(user.username);
                setUserRole(user.role);
                setIsAdmin(user.role === 'ADMIN' || user.role === 'IT_ADMIN');

                // Fetch tickets + notifications in parallel (stats come from fetchTickets response)
                await Promise.all([fetchTickets(), fetchRecentNewTickets()]);
            } else {
                router.push('/login');
                return;
            }
        };
        init();
    }, [router, fetchTickets, fetchRecentNewTickets]);

    // Check for refresh parameter (after creating a ticket)
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const shouldRefresh = searchParams.get('refresh') === 'true';
        const sessionRefresh = sessionStorage.getItem('dashboardRefresh') === 'true';

        if (shouldRefresh || sessionRefresh) {

            // Set flag in sessionStorage for Fast Refresh scenarios
            sessionStorage.setItem('dashboardRefresh', 'true');

            // Fetch immediately (stats come from fetchTickets response)
            fetchTickets();
            fetchRecentNewTickets();

            // Remove the query parameter to avoid repeated refreshes
            if (shouldRefresh) {
                window.history.replaceState({}, '', '/dashboard');
            }

            // Clear sessionStorage after successful fetch
            setTimeout(() => {
                sessionStorage.removeItem('dashboardRefresh');
            }, 2000);
        }
    }, [fetchTickets, fetchRecentNewTickets]);

    // Trigger Fetch on Filter Change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTickets]);

    const handleNewTicket = useCallback(() => {
        fetchTickets(false); // Fetch background data without full loading spinner (stats come from response)
        fetchRecentNewTickets();
    }, [fetchTickets, fetchRecentNewTickets]);

    // SSE Connection for real-time notifications
    useSSENotifications('it', isAdmin, {
        onNewTicket: handleNewTicket
    });

    // Export All Matching Tickets
    const handleExportToExcel = async () => {
        try {
            const filters: {
                limit: number;
                search?: string;
                status?: string;
                type?: string;
                startDate?: string;
                endDate?: string;
            } = { limit: 10000 };
            if (searchQuery) filters.search = searchQuery;
            if (filterStatus) filters.status = filterStatus;
            if (filterType) filters.type = filterType;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const result = await apiClient.tickets.list(filters);

            if (result.success && result.data) {
                const tickets = result.data.tickets || [];

                if (tickets.length === 0) {
                    toast.error('No tickets to export');
                    return;
                }

                const exportData = tickets.map((ticket: Ticket) => ({
                    'Ticket Number': ticket.ticketNumber,
                    'Location': ticket.title || '',
                    'Description': ticket.description || '',
                    'Department': ticket.department || '',
                    'Area': ticket.location || '',
                    'Type of Damage': ticket.typeOfDamage,
                    'Status': getStatusDisplayName(ticket.status),
                    'Admin Notes': ticket.adminNotes || '',
                    'Assign To': ticket.assignTo || '',
                    'Created At': new Date(ticket.createdAt).toLocaleString('th-TH'),
                    'Last Updated': new Date(ticket.updatedAt).toLocaleString('th-TH'),
                    'Reporter': ticket.user?.username || '',
                    'Image Links': ticket.images?.map((img: TicketImage) => {
                        const url = img.imageUrl || img.image_url;
                        return url ? `http://10.70.0.34:3000${url}` : null;
                    }).filter(Boolean).join(', ') || 'No Images'
                }));

                const filename = `EGPB_Tickets_${new Date().toISOString().split('T')[0]}.xlsx`;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                exportToExcel(exportData as any[], filename);
            }
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Failed to export tickets');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.tickets.markAllRead();
            setNewTickets([]);
            setShowNotifications(false);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleLogout = async () => {
        // Clear filters on logout
        localStorage.removeItem('it-dashboard-filters');
        await apiClient.auth.signOut();
        // Redirect to login page with correct base path
        window.location.href = '/egpb/pyt/workorder/login';
    };

    const unviewedCount = useMemo(() => {
        return newTickets.length;
    }, [newTickets]);

    // Tab badge notification - show admin's new tickets OR user's notifications
    const tabBadgeCount = isAdmin ? unviewedCount : userNotificationCount;
    useTabBadge(tabBadgeCount, 'EGPB Ticket - IT Dashboard');

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Block rendering until authenticated
    if (!username) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <ToastContainer />
            {/* Dashboard Navbar */}
            <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto">
                    {/* Left: Menu + Logo */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <DashboardMenu currentPath={pathname} />
                        <div className="text-lg sm:text-xl font-bold text-green-600 tracking-tight">
                            EGPB<span className="text-gray-900">Ticket</span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* System Settings - only for admin */}
                        {userRole === 'ADMIN' && (
                            <Link
                                href="/dashboard/admin/settings"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="ตั้งค่าระบบ"
                            >
                                <Settings size={20} className="text-gray-700" />
                            </Link>
                        )}
                        {/* Manage Users - only for admin and it_admin */}
                        {(userRole === 'ADMIN' || userRole === 'IT_ADMIN') && (
                            <Link
                                href="/dashboard/users"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Manage Users"
                            >
                                <Users size={20} className="text-gray-700" />
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                href="/dashboard/summary"
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
                                title="View Summary Dashboard"
                            >
                                <BarChart size={20} />
                                <span className="hidden lg:inline">Summary</span>
                            </Link>
                        )}
                        {isAdmin && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 hover:bg-green-50 rounded-lg transition-colors cursor-pointer relative"
                                >
                                    <Bell size={20} className="text-black" />
                                    {unviewedCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                                            {unviewedCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-green-100 z-50 max-h-[500px] overflow-hidden flex flex-col">
                                        <div className="p-4 border-b border-green-100 flex justify-between items-center bg-green-50">
                                            <h3 className="font-bold text-black">New Tickets ({unviewedCount})</h3>
                                            {unviewedCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto max-h-[400px]">
                                            {newTickets.length === 0 ? (
                                                <div className="p-8 text-center text-black">
                                                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">No new tickets</p>
                                                </div>
                                            ) : (
                                                newTickets.map((ticket) => (
                                                    <Link
                                                        key={ticket.id}
                                                        href={`/dashboard/ticket/${ticket.id}`}
                                                        onClick={() => {
                                                            const newTicketsList = newTickets.filter(t => t.id !== ticket.id);
                                                            setNewTickets(newTicketsList);
                                                            setShowNotifications(false);
                                                        }}
                                                        className="block p-4 hover:bg-green-50 border-b border-green-50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-mono text-black bg-gray-100 px-2 py-0.5 rounded">
                                                                        {ticket.ticketNumber}
                                                                    </span>
                                                                    <span className="text-xs text-black">
                                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-semibold text-black text-sm mb-1 truncate">
                                                                    {ticket.title}
                                                                </h4>
                                                                <p className="text-xs text-black line-clamp-2">
                                                                    {ticket.description}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-xs text-black">
                                                                        📍 {ticket.location || 'N/A'}
                                                                    </span>
                                                                    <span className="text-xs text-black">
                                                                        🔧 {ticket.typeOfDamage}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {isAdmin && (
                            <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                Admin
                            </span>
                        )}
                        <BellNotification onUnreadCountChange={setUserNotificationCount} />
                        <UserProfileDropdown
                            username={username}
                            userRole={userRole}
                            onLogout={handleLogout}
                            onFilterMyTickets={() => {
                                setMyTicketsFilter(true);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-black">IT Dashboard</h1>
                        <p className="text-sm sm:text-base text-black">
                            {isAdmin ? 'Manage all repair tickets across the organization' : 'Manage and track your repair tickets'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
                        {myTicketsFilter && (
                            <button
                                onClick={() => {
                                    setMyTicketsFilter(false);
                                    setCurrentPage(1);
                                }}
                                className="flex items-center px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg md:rounded-xl hover:bg-blue-200 transition-all font-medium text-sm"
                            >
                                <FilterX size={18} className="mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">Clear My Tickets Filter</span>
                                <span className="xs:hidden">Clear Filter</span>
                            </button>
                        )}
                        <button
                            onClick={handleExportToExcel}
                            className="ripple-effect flex items-center px-3 sm:px-4 py-2.5 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-all font-medium text-sm"
                        >
                            <Download size={18} className="mr-2" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <Link
                            href="/dashboard/create"
                            className="ripple-effect flex items-center px-3 sm:px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md font-medium text-sm"
                        >
                            <Plus size={18} className="mr-2" />
                            <span className="hidden sm:inline">Create</span>
                        </Link>
                    </div>
                </div>

                {/* Status Cards - Compact Design */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                    <div className="card-hover bg-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-sm cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">New Tickets</h3>
                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                <AlertCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-black">{stats.NEW}</p>
                    </div>
                    <div className="card-hover bg-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-sm cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">On Process</h3>
                            <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg">
                                <Clock size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-black">{stats.IN_PROGRESS}</p>
                    </div>
                    <div className="card-hover bg-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-sm cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">On Hold</h3>
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                <PauseCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-black">{stats.ON_HOLD}</p>
                    </div>
                    <div className="card-hover bg-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-sm cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">Done ( MTD )</h3>
                            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-black">{stats.DONE}</p>
                    </div>
                    <div className="card-hover bg-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-sm cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">Cancel</h3>
                            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                                <XCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-black">{stats.CANCEL}</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white px-4 py-4 sm:px-8 sm:py-5 md:px-16 md:py-5 lg:px-24 lg:py-6 rounded-2xl border border-green-100 shadow-sm mb-6 md:mb-8 md:w-fit md:mx-auto">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 md:gap-6">
                        {/* Search */}
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-[240px] md:w-[300px] lg:w-[350px] pl-11 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm placeholder-green-700/50"
                            />
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-10 bg-gray-200"></div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 sm:gap-2.5 bg-green-50/50 border border-green-200 rounded-xl px-3 sm:px-4 py-2.5 w-full sm:w-auto">
                            <Calendar size={18} className="text-green-600 flex-shrink-0" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-gray-700 text-sm focus:outline-none w-[100px] sm:w-[115px]"
                            />
                            <span className="text-green-400 text-sm font-medium flex-shrink-0">→</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-gray-700 text-sm focus:outline-none w-[100px] sm:w-[115px]"
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-green-600 hover:text-green-800 ml-1 flex-shrink-0">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Type Dropdown */}
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2.5 bg-white border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-sm hover:border-green-300 transition-colors cursor-pointer sm:min-w-[130px]"
                            >
                                <option value="">All Types</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Network / Internet / WIFI">Network / Internet / WIFI</option>
                                <option value="Software">Software</option>
                                <option value="Access / Permission">Access / Permission</option>
                                <option value="Printing / Scanning">Printing / Scanning</option>
                                <option value="POS">POS</option>
                                <option value="CCTV">CCTV</option>
                                <option value="Access Control">Access Control</option>
                                <option value="Email / Communication">Email / Communication</option>
                                <option value="Service Request">Service Request</option>
                                <option value="Security Incident">Security Incident</option>
                                <option value="Other">Other</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 pointer-events-none" size={16} />
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2.5 bg-white border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-sm hover:border-green-300 transition-colors cursor-pointer sm:min-w-[120px]"
                            >
                                <option value="">All Status</option>
                                <option value="NEW">New</option>
                                <option value="IN_PROGRESS">On Process</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="DONE">Done</option>
                                <option value="CANCEL">Cancel</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 pointer-events-none" size={16} />
                        </div>

                        {/* Clear Filters Button */}
                        {(searchQuery || filterType || filterStatus || startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterType('');
                                    setFilterStatus('');
                                    setStartDate('');
                                    setEndDate('');
                                    setMyTicketsFilter(false);
                                    localStorage.removeItem('it-dashboard-filters');
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-all text-sm font-medium w-full sm:w-auto"
                                title="Clear All Filters"
                            >
                                <FilterX size={16} />
                                <span>Clear Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tickets Table/Cards */}
                <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                    {/* Mobile/Tablet Cards (< 1024px) */}
                    <div className="lg:hidden">
                        <ITTicketCardsMobile tickets={tickets} loading={loading} />
                    </div>

                    {/* Desktop Table (≥ 1024px) */}
                    <div className="hidden lg:block">
                        <ITTicketTableDesktop
                            tickets={tickets}
                            loading={loading}
                            hasFilters={!!(searchQuery || filterType || filterStatus || startDate || endDate)}
                            onCreateClick={() => router.push('/dashboard/create')}
                        />
                    </div>

                    {/* Pagination Controls */}
                    {totalCount > 0 && (
                        <div className="px-6 py-4 border-t border-green-100 flex items-center justify-between bg-gray-50">
                            <p className="text-sm text-black">
                                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                            </p>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 bg-white text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-black">Page</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={currentPage}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            if (value >= 1 && value <= totalPages) {
                                                setCurrentPage(value);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const value = parseInt(e.currentTarget.value);
                                                if (value >= 1 && value <= totalPages) {
                                                    setCurrentPage(value);
                                                    e.currentTarget.blur();
                                                }
                                            }
                                        }}
                                        className="w-16 px-2 py-1 text-center text-sm font-medium text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-black">of {totalPages}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 bg-white text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div >
    );
}

