'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Shield, Unlock, RefreshCw, ChevronLeft, Clock, AlertTriangle, Globe, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface BlockedIP {
    id: string;
    ipAddress: string;
    reason: string;
    blockedAt: string;
    expiresAt: string;
    failedCount: number;
    timeRemaining: number;
}

export default function SecurityDashboard() {
    const router = useRouter();
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [unblockingId, setUnblockingId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

    const fetchBlockedIPs = useCallback(async () => {
        try {
            const response = await apiClient.admin.getBlockedIPs();
            if (response.success && response.data) {
                setBlockedIPs(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching blocked IPs:', error);
            toast.error('ไม่สามารถโหลดข้อมูล Blocked IPs ได้');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await apiClient.auth.getUser();
            if (response.success && response.data?.user) {
                setCurrentUser(response.data.user);
                // Check if user has admin access
                if (!['ADMIN', 'IT_ADMIN'].includes(response.data.user.role)) {
                    toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                    router.push('/dashboard');
                }
            }
        } catch {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (currentUser && ['ADMIN', 'IT_ADMIN'].includes(currentUser.role)) {
            fetchBlockedIPs();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchBlockedIPs, 30000);
            return () => clearInterval(interval);
        }
    }, [currentUser, fetchBlockedIPs]);

    const handleUnblock = async (ip: BlockedIP) => {
        if (!confirm(`ต้องการปลดบล็อค IP ${ip.ipAddress} หรือไม่?`)) {
            return;
        }

        setUnblockingId(ip.id);
        try {
            const response = await apiClient.admin.unblockIP(ip.id);
            if (response.success) {
                toast.success(`ปลดบล็อค IP ${ip.ipAddress} สำเร็จ`);
                setBlockedIPs(prev => prev.filter(b => b.id !== ip.id));
            }
        } catch (error) {
            console.error('Error unblocking IP:', error);
            toast.error('ไม่สามารถปลดบล็อค IP ได้');
        } finally {
            setUnblockingId(null);
        }
    };

    const formatTimeRemaining = (seconds: number) => {
        if (seconds <= 0) return 'หมดอายุแล้ว';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes > 0) {
            return `${minutes} นาที ${secs} วินาที`;
        }
        return `${secs} วินาที`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'too_many_failed_logins':
                return 'Login ผิดเกินกำหนด';
            case 'manual_block':
                return 'บล็อคโดย Admin';
            default:
                return reason;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl text-white">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Security Dashboard</h1>
                                    <p className="text-sm text-gray-500">จัดการ IP ที่ถูกบล็อค</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => fetchBlockedIPs()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>รีเฟรช</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">IP ที่ถูกบล็อค</p>
                                <p className="text-2xl font-bold text-gray-900">{blockedIPs.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">เวลาบล็อคเริ่มต้น</p>
                                <p className="text-2xl font-bold text-gray-900">10 นาที</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Globe className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">จำนวนครั้งก่อนบล็อค</p>
                                <p className="text-2xl font-bold text-gray-900">10 ครั้ง</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blocked IPs Table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">รายการ IP ที่ถูกบล็อค</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            IP ที่ถูกบล็อคจะถูกปลดอัตโนมัติเมื่อหมดเวลา หรือ Admin สามารถปลดได้ทันที
                        </p>
                    </div>

                    {blockedIPs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">ไม่มี IP ถูกบล็อค</h3>
                            <p className="text-gray-500 mt-1">ระบบปลอดภัย ไม่มี IP ที่ถูกบล็อคในขณะนี้</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            IP Address
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            สาเหตุ
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            จำนวนครั้งที่ผิด
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            เวลาที่บล็อค
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            เวลาที่เหลือ
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            การดำเนินการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {blockedIPs.map((ip) => (
                                        <tr key={ip.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 rounded-lg">
                                                        <X className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    <span className="font-mono font-medium text-gray-900">
                                                        {ip.ipAddress}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                                                    {getReasonLabel(ip.reason)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900">{ip.failedCount} ครั้ง</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatDate(ip.blockedAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${ip.timeRemaining <= 0 ? 'text-gray-400' : 'text-orange-600'}`}>
                                                    {formatTimeRemaining(ip.timeRemaining)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleUnblock(ip)}
                                                    disabled={unblockingId === ip.id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {unblockingId === ip.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Unlock className="w-4 h-4" />
                                                    )}
                                                    ปลดบล็อค
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-blue-50 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900">เกี่ยวกับระบบ Rate Limiting</h3>
                            <ul className="mt-2 text-sm text-blue-800 space-y-1">
                                <li>• IP จะถูกบล็อคอัตโนมัติหลังจาก login ผิด <strong>10 ครั้ง</strong></li>
                                <li>• ระยะเวลาบล็อค: <strong>10 นาที</strong> (หมดอายุอัตโนมัติ)</li>
                                <li>• Admin สามารถปลดบล็อคได้ทันทีผ่านหน้านี้</li>
                                <li>• สำหรับ User ที่ถูก Lock บัญชี ให้ไปที่หน้า Manage Users</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
