"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Calendar, BarChart, TrendingUp, Activity, Shield, AlertTriangle } from 'lucide-react';
import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/ticket-utils';

interface SummaryStats {
    totalTickets: number;
    thisMonthTickets: number;
    lastMonthTickets: number;
    yearToDateTickets: number;
    activeUsers: number;
    avgResolutionHours: number | null;
    statusBreakdown: { status: string; count: number }[];
    typeBreakdown: { type: string; count: number }[];
    locationBreakdown?: { name: string; count: number }[];
    informationByBreakdown?: { name: string; count: number }[];
    departmentBreakdown?: { name: string; count: number }[];
    departmentStatusBreakdown?: {
        department: string;
        NEW: number;
        IN_PROGRESS: number;
        ON_HOLD: number;
        DONE: number;
        CANCEL: number;
        total: number;
    }[];
}

export default function EngineerSummaryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [stats, setStats] = useState<SummaryStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
        from: '',
        to: '',
    });

    // Comparison states
    const now = new Date();
    const [leftMonth, setLeftMonth] = useState(now.getMonth() + 1);
    const [leftYear, setLeftYear] = useState(now.getFullYear());
    const [rightMonth, setRightMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
    const [rightYear, setRightYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const [leftData, setLeftData] = useState<{ type: string; count: number; percentage: number }[]>([]);
    const [rightData, setRightData] = useState<{ type: string; count: number; percentage: number }[]>([]);
    const [leftTotal, setLeftTotal] = useState(0);
    const [rightTotal, setRightTotal] = useState(0);
    const [comparisonLoading, setComparisonLoading] = useState(false);

    // Generate month options
    const months = [
        { value: 0, label: 'All Time' },
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    // Generate year options (last 5 years)
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    const fetchComparison = useCallback(async () => {
        setComparisonLoading(true);
        try {
            const [leftRes, rightRes] = await Promise.all([
                apiClient.stats.damageTypes({ month: leftMonth, year: leftYear, type: 'ENGINEER' }),
                apiClient.stats.damageTypes({ month: rightMonth, year: rightYear, type: 'ENGINEER' }),
            ]);

            if (leftRes.success && leftRes.data) {
                setLeftData(leftRes.data.typeBreakdown);
                setLeftTotal(leftRes.data.totalCount);
            }
            if (rightRes.success && rightRes.data) {
                setRightData(rightRes.data.typeBreakdown);
                setRightTotal(rightRes.data.totalCount);
            }
        } catch (err) {
            console.error('Fetch comparison error:', err);
        } finally {
            setComparisonLoading(false);
        }
    }, [leftMonth, leftYear, rightMonth, rightYear]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const summaryResponse = await apiClient.stats.summary({ ...dateRange, type: 'ENGINEER' });
            if (summaryResponse.success && summaryResponse.data) {
                setStats(summaryResponse.data as SummaryStats);
            } else {
                setError(summaryResponse.error || 'ไม่สามารถดึงข้อมูล summary ได้');
            }
        } catch (err) {
            console.error('Fetch stats error:', err);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        document.title = 'EGPB Ticket - Engineer Summary';

        const init = async () => {
            try {
                const auth = await apiClient.auth.getUser();
                if (auth.success && auth.data?.user) {
                    const user = auth.data.user;
                    setCurrentUser(user);

                    if (user.role !== 'ADMIN' && user.role !== 'ENGINEER_ADMIN') {
                        router.push('/dashboard/engineer');
                        return;
                    }

                    // Fetch stats after auth check
                    fetchStats();
                } else {
                    router.push('/login');
                    return;
                }
            } catch (err) {
                console.error('Summary init error:', err);
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูล summary');
                setLoading(false);
            }
        };

        init();
    }, [router, fetchStats]);

    // Fetch stats when date range changes
    useEffect(() => {
        if (currentUser) {
            fetchStats();
        }
    }, [dateRange, fetchStats, currentUser]);

    // Fetch comparison data
    useEffect(() => {
        if (currentUser) {
            fetchComparison();
        }
    }, [fetchComparison, currentUser]);

    const handleExportToExcel = () => {
        if (!stats) return;

        const { typeBreakdown, statusBreakdown, locationBreakdown, informationByBreakdown, departmentBreakdown, departmentStatusBreakdown } = stats;

        const typeData = typeBreakdown.map(item => ({
            'Type of Damage': item.type,
            'Count': item.count,
            'Percentage': `${(item.count / stats.totalTickets * 100).toFixed(1)}%`
        }));

        const statusData = statusBreakdown.map(item => ({
            'Status': STATUS_LABELS[item.status] || item.status,
            'Count': item.count,
            'Percentage': `${(item.count / stats.totalTickets * 100).toFixed(1)}%`
        }));

        const wb = XLSX.utils.book_new();
        const wsType = XLSX.utils.json_to_sheet(typeData);
        const wsStatus = XLSX.utils.json_to_sheet(statusData);

        XLSX.utils.book_append_sheet(wb, wsType, 'Type Breakdown');
        XLSX.utils.book_append_sheet(wb, wsStatus, 'Status Breakdown');

        if (locationBreakdown) {
            const locationData = locationBreakdown.map(item => ({
                'Area': item.name,
                'Count': item.count,
                'Percentage': `${(item.count / stats.totalTickets * 100).toFixed(1)}%`
            }));
            const wsLocation = XLSX.utils.json_to_sheet(locationData);
            XLSX.utils.book_append_sheet(wb, wsLocation, 'Area Breakdown');
        }

        if (informationByBreakdown) {
            const infoData = informationByBreakdown.map(item => ({
                'Information By': item.name,
                'Count': item.count,
                'Percentage': `${(item.count / stats.totalTickets * 100).toFixed(1)}%`
            }));
            const wsInfo = XLSX.utils.json_to_sheet(infoData);
            XLSX.utils.book_append_sheet(wb, wsInfo, 'Information By Breakdown');
        }

        if (departmentBreakdown) {
            const departmentData = departmentBreakdown.map(item => ({
                'Department': item.name,
                'Count': item.count,
                'Percentage': `${(item.count / stats.totalTickets * 100).toFixed(1)}%`
            }));
            const wsDepartment = XLSX.utils.json_to_sheet(departmentData);
            XLSX.utils.book_append_sheet(wb, wsDepartment, 'Department Breakdown');
        }

        if (departmentStatusBreakdown) {
            const deptStatusData = departmentStatusBreakdown.map(item => ({
                'Department': item.department,
                'New': item.NEW,
                'On Process': item.IN_PROGRESS,
                'On Hold': item.ON_HOLD,
                'Done': item.DONE,
                'Cancel': item.CANCEL,
                'Total': item.total
            }));
            const wsDeptStatus = XLSX.utils.json_to_sheet(deptStatusData);
            XLSX.utils.book_append_sheet(wb, wsDeptStatus, 'Department by Status');
        }

        const filename = `Engineer_Summary_${dateRange.from}_to_${dateRange.to}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const totalStatusCount = useMemo(() => {
        if (!stats) return 0;
        return stats.statusBreakdown.reduce((sum, status) => sum + status.count, 0);
    }, [stats]);

    const pieData = useMemo(() => {
        if (!stats) return [];
        return stats.statusBreakdown.map(item => ({
            name: STATUS_LABELS[item.status] || item.status,
            value: item.count,
            color: STATUS_COLORS[item.status] || '#9CA3AF'
        })).filter(item => item.value > 0);
    }, [stats]);

    const barData = useMemo(() => {
        if (!stats) return [];
        return stats.typeBreakdown.map(item => ({
            name: item.type,
            count: item.count
        }));
    }, [stats]);

    if (loading && !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-black">Loading summary...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
                <div className="max-w-md bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center shadow-sm">
                    <AlertTriangle size={40} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-semibold mb-2">ไม่สามารถโหลดข้อมูลได้</h2>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        ลองอีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-green-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            <Link
                                href="/dashboard/engineer"
                                className="flex items-center text-gray-600 hover:text-black transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>Back to Engineer Dashboard</span>
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-black">Engineer Summary</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                            <Calendar size={18} className="text-gray-500 ml-2" />
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                className="bg-transparent border-none text-sm focus:ring-0 text-black"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                className="bg-transparent border-none text-sm focus:ring-0 text-black"
                            />
                            {(dateRange.from || dateRange.to) && (
                                <button
                                    onClick={() => setDateRange({ from: '', to: '' })}
                                    className="ml-1 px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                    title="Clear filter"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleExportToExcel}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium"
                        >
                            <Download size={18} className="mr-2" />
                            Export to Excel
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 py-6 md:py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total Tickets Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Total Tickets</h3>
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm">
                                <BarChart size={20} />
                            </div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats.totalTickets.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2 font-medium">All Tickets</p>
                    </div>

                    {/* This Month Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-semibold text-sm uppercase tracking-wider">This Month</h3>
                            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl shadow-sm">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats.thisMonthTickets.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Done (Month-to-Date)</p>
                    </div>

                    {/* Last Month Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Last Month Total</h3>
                            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl shadow-sm">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats.lastMonthTickets.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Last Month&apos;s Total</p>
                    </div>

                    {/* Year-to-Date Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Year-to-Date</h3>
                            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-sm">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                            {stats.yearToDateTickets?.toLocaleString() ?? 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Total Tickets in {new Date().getFullYear()}</p>
                    </div>
                </div>



                {/* Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Status Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Tickets by Status</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Total: <span className="font-semibold text-gray-900">{totalStatusCount.toLocaleString()}</span> tickets
                                </p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-sm">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div className="h-[250px] w-full mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                        animationBegin={0}
                                        animationEasing="ease-out"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Custom Legend with Numbers and Percentages */}
                        <div className="grid grid-cols-2 gap-3">
                            {pieData.map((entry, index) => {
                                const percentage = totalStatusCount > 0
                                    ? ((entry.value / totalStatusCount) * 100).toFixed(1)
                                    : '0.0';
                                return (
                                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{entry.name}</div>
                                            <div className="text-xs text-gray-600">
                                                <span className="font-semibold">{entry.value.toLocaleString()}</span>
                                                <span className="text-gray-400 ml-1">({percentage}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Type Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Top Damage Types</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Breakdown by Category</p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm">
                                <Shield size={20} />
                            </div>
                        </div>
                        <div className="w-full" style={{ height: `${Math.max(350, stats.typeBreakdown.length * 28)}px` }}>
                            {stats.typeBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart
                                        data={barData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={140}
                                            tick={{ fontSize: 11 }}
                                            interval={0}
                                            tickFormatter={(value) => value.length > 20 ? value.substring(0, 18) + '...' : value}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#3B82F6"
                                            radius={[0, 4, 4, 0]}
                                            animationDuration={1500}
                                            animationBegin={300}
                                            animationEasing="ease-out"
                                        />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detailed Statistics - Comparison */}
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm mb-8">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-black">Detailed Statistics Comparison</h3>
                        <p className="text-sm text-gray-500">Type of Damage Statistics: Period Comparison</p>
                    </div>


                    {/* Comparison Table */}
                    {comparisonLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead>
                                    {/* Period Selectors Row */}
                                    <tr className="border-b border-gray-200">
                                        <th className="py-3 px-2"></th>
                                        <th className="py-3 px-2 bg-blue-50 border-l border-gray-200" colSpan={2}>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <span className="text-xs font-medium text-blue-700">Period 1:</span>
                                                <select
                                                    value={leftMonth}
                                                    onChange={(e) => setLeftMonth(parseInt(e.target.value))}
                                                    className="px-2 py-1 rounded border border-blue-300 bg-white text-xs text-black focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {months.map((m) => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={leftYear}
                                                    onChange={(e) => setLeftYear(parseInt(e.target.value))}
                                                    className="px-2 py-1 rounded border border-blue-300 bg-white text-xs text-black focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {years.map((y) => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                                <span className="text-xs text-blue-600">(Total: {leftTotal})</span>
                                            </div>
                                        </th>
                                        <th className="py-3 px-2 bg-green-50 border-l border-gray-200" colSpan={2}>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <span className="text-xs font-medium text-green-700">Period 2:</span>
                                                <select
                                                    value={rightMonth}
                                                    onChange={(e) => setRightMonth(parseInt(e.target.value))}
                                                    className="px-2 py-1 rounded border border-green-300 bg-white text-xs text-black focus:ring-2 focus:ring-green-500"
                                                >
                                                    {months.map((m) => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={rightYear}
                                                    onChange={(e) => setRightYear(parseInt(e.target.value))}
                                                    className="px-2 py-1 rounded border border-green-300 bg-white text-xs text-black focus:ring-2 focus:ring-green-500"
                                                >
                                                    {years.map((y) => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                                <span className="text-xs text-green-600">(Total: {rightTotal})</span>
                                            </div>
                                        </th>
                                    </tr>
                                    {/* Column Headers Row */}
                                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">
                                        <th className="py-3 px-2 font-medium">Damage Type</th>
                                        <th className="py-3 px-2 font-medium text-center bg-blue-50 border-l border-gray-200" colSpan={2}>
                                            {leftMonth === 0 ? 'All Time' : `${months.find(m => m.value === leftMonth)?.label} ${leftYear}`}
                                        </th>
                                        <th className="py-3 px-2 font-medium text-center bg-green-50 border-l border-gray-200" colSpan={2}>
                                            {rightMonth === 0 ? 'All Time' : `${months.find(m => m.value === rightMonth)?.label} ${rightYear}`}
                                        </th>
                                    </tr>
                                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                                        <th className="py-2 px-2"></th>
                                        <th className="py-2 px-2 text-center bg-blue-50/50 border-l border-gray-200">Count</th>
                                        <th className="py-2 px-2 text-center bg-blue-50/50">%</th>
                                        <th className="py-2 px-2 text-center bg-green-50/50 border-l border-gray-200">Count</th>
                                        <th className="py-2 px-2 text-center bg-green-50/50">%</th>
                                    </tr>
                                </thead>
                                <tbody className="text-black text-sm divide-y divide-gray-50">
                                    {(() => {
                                        const allTypes = new Set([
                                            ...leftData.map(d => d.type),
                                            ...rightData.map(d => d.type)
                                        ]);
                                        const sortedTypes = Array.from(allTypes).sort((a, b) => {
                                            const leftA = leftData.find(d => d.type === a)?.count || 0;
                                            const leftB = leftData.find(d => d.type === b)?.count || 0;
                                            return leftB - leftA;
                                        });

                                        return sortedTypes.map((type) => {
                                            const left = leftData.find(d => d.type === type);
                                            const right = rightData.find(d => d.type === type);

                                            return (
                                                <tr key={type} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-2 font-medium">{type}</td>
                                                    <td className="py-3 px-2 text-center font-mono text-blue-600 bg-blue-50/30 border-l border-gray-100">
                                                        {left?.count?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-blue-500 bg-blue-50/30">
                                                        {left?.percentage?.toFixed(1) || 0}%
                                                    </td>
                                                    <td className="py-3 px-2 text-center font-mono text-green-600 bg-green-50/30 border-l border-gray-100">
                                                        {right?.count?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-green-500 bg-green-50/30">
                                                        {right?.percentage?.toFixed(1) || 0}%
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                    {leftData.length === 0 && rightData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-400">
                                                No data available for selected periods
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Additional Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Department Stats */}
                    {stats.departmentBreakdown && (
                        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
                            <h3 className="text-lg font-bold text-black mb-1">Department</h3>
                            <p className="text-sm text-gray-500 mb-4">Statistics by Department</p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="py-2 font-medium">Department</th>
                                            <th className="py-2 font-medium text-right">Count</th>
                                            <th className="py-2 font-medium text-right">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-black text-sm divide-y divide-gray-50">
                                        {stats.departmentBreakdown.map((item, index) => {
                                            const total = stats.totalTickets;
                                            const percent = total ? (item.count / total) * 100 : 0;
                                            return (
                                                <tr key={`dept-${item.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 font-medium">{item.name}</td>
                                                    <td className="py-2 text-right font-mono text-green-600">{item.count.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-600">{percent.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                        {stats.departmentBreakdown.length === 0 && (
                                            <tr><td colSpan={3} className="py-4 text-center text-gray-400">No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Area Stats */}
                    {stats.locationBreakdown && (
                        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
                            <h3 className="text-lg font-bold text-black mb-1">Area</h3>
                            <p className="text-sm text-gray-500 mb-4">Statistics by Location</p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="py-2 font-medium">Area</th>
                                            <th className="py-2 font-medium text-right">Count</th>
                                            <th className="py-2 font-medium text-right">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-black text-sm divide-y divide-gray-50">
                                        {stats.locationBreakdown.map((item, index) => {
                                            const total = stats.totalTickets;
                                            const percent = total ? (item.count / total) * 100 : 0;
                                            return (
                                                <tr key={`area-${item.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 font-medium">{item.name}</td>
                                                    <td className="py-2 text-right font-mono text-green-600">{item.count.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-600">{percent.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                        {stats.locationBreakdown.length === 0 && (
                                            <tr><td colSpan={3} className="py-4 text-center text-gray-400">No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Information By Stats */}
                    {stats.informationByBreakdown && (
                        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold text-black mb-1">Information by</h3>
                            <p className="text-sm text-gray-500 mb-4">Statistics by Information Source</p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="py-2 font-medium">Source</th>
                                            <th className="py-2 font-medium text-right">Count</th>
                                            <th className="py-2 font-medium text-right">Percentage</th>
                                            <th className="py-2 font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-black text-sm divide-y divide-gray-50">
                                        {stats.informationByBreakdown.map((item, index) => {
                                            const total = stats.totalTickets;
                                            const percent = total ? (item.count / total) * 100 : 0;
                                            return (
                                                <tr key={`${item.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 font-medium">{item.name}</td>
                                                    <td className="py-2 text-right font-mono text-green-600">{item.count.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-600">{percent.toFixed(1)}%</td>
                                                    <td className="py-2 w-1/3 pl-4">
                                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-purple-500 rounded-full"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {stats.informationByBreakdown.length === 0 && (
                                            <tr><td colSpan={4} className="py-4 text-center text-gray-400">No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Department by Status Breakdown */}
                {stats.departmentStatusBreakdown && stats.departmentStatusBreakdown.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm mb-8">
                        <h3 className="text-lg font-bold text-black mb-1">Department by Status</h3>
                        <p className="text-sm text-gray-500 mb-4">Detailed Breakdown of Tickets by Department and Status</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">
                                        <th className="py-3 px-4 font-semibold bg-gray-50">Department</th>
                                        <th className="py-3 px-4 font-semibold text-center bg-blue-50 border-l border-gray-200">New</th>
                                        <th className="py-3 px-4 font-semibold text-center bg-yellow-50 border-l border-gray-200">On Process</th>
                                        <th className="py-3 px-4 font-semibold text-center bg-orange-50 border-l border-gray-200">On Hold</th>
                                        <th className="py-3 px-4 font-semibold text-center bg-green-50 border-l border-gray-200">Done</th>
                                        <th className="py-3 px-4 font-semibold text-center bg-red-50 border-l border-gray-200">Cancel</th>
                                        <th className="py-3 px-4 font-semibold text-center bg-gray-100 border-l-2 border-gray-300">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-black text-sm divide-y divide-gray-100">
                                    {stats.departmentStatusBreakdown.map((item, index) => (
                                        <tr key={`deptStatus-${item.department}-${index}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 font-semibold">{item.department}</td>
                                            <td className="py-3 px-4 text-center font-mono text-blue-600 border-l border-gray-100">{item.NEW}</td>
                                            <td className="py-3 px-4 text-center font-mono text-yellow-600 border-l border-gray-100">{item.IN_PROGRESS}</td>
                                            <td className="py-3 px-4 text-center font-mono text-orange-600 border-l border-gray-100">{item.ON_HOLD}</td>
                                            <td className="py-3 px-4 text-center font-mono text-green-600 border-l border-gray-100">{item.DONE}</td>
                                            <td className="py-3 px-4 text-center font-mono text-red-600 border-l border-gray-100">{item.CANCEL}</td>
                                            <td className="py-3 px-4 text-center font-mono font-bold text-gray-700 border-l-2 border-gray-200 bg-gray-50">{item.total}</td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                        <td className="py-3 px-4">Total</td>
                                        <td className="py-3 px-4 text-center font-mono text-blue-700 border-l border-gray-200">
                                            {stats.departmentStatusBreakdown.reduce((sum, item) => sum + item.NEW, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-yellow-700 border-l border-gray-200">
                                            {stats.departmentStatusBreakdown.reduce((sum, item) => sum + item.IN_PROGRESS, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-orange-700 border-l border-gray-200">
                                            {stats.departmentStatusBreakdown.reduce((sum, item) => sum + item.ON_HOLD, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-green-700 border-l border-gray-200">
                                            {stats.departmentStatusBreakdown.reduce((sum, item) => sum + item.DONE, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-red-700 border-l border-gray-200">
                                            {stats.departmentStatusBreakdown.reduce((sum, item) => sum + item.CANCEL, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-gray-900 border-l-2 border-gray-300">
                                            {stats.totalTickets}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
