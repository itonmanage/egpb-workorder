"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
    Settings, Plus, Trash2, Edit2, Check, X,
    Upload, Download, ChevronLeft, Monitor,
    Wrench, MapPin, Tag, Building2,
    ToggleLeft, ToggleRight, AlertTriangle, RefreshCw,
    FileJson, CheckCircle2, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardMenu from '@/components/DashboardMenu';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import BellNotification from '@/components/BellNotification';

interface SystemOption {
    id: string;
    category: string;
    value: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

type TabId = 'IT_DAMAGE_TYPE' | 'IT_AREA' | 'ENGINEER_DAMAGE_TYPE' | 'ENGINEER_AREA' | 'DEPARTMENT';

interface Tab {
    id: TabId;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

const TABS: Tab[] = [
    {
        id: 'IT_DAMAGE_TYPE',
        label: 'IT Damage Types',
        description: 'ประเภทปัญหา IT',
        icon: <Monitor size={18} />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    {
        id: 'IT_AREA',
        label: 'IT Areas',
        description: 'พื้นที่ IT',
        icon: <MapPin size={18} />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
    },
    {
        id: 'ENGINEER_DAMAGE_TYPE',
        label: 'Engineer Damage Types',
        description: 'ประเภทปัญหาช่าง',
        icon: <Wrench size={18} />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
    },
    {
        id: 'ENGINEER_AREA',
        label: 'Engineer Areas',
        description: 'พื้นที่ช่าง',
        icon: <MapPin size={18} />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
    },
    {
        id: 'DEPARTMENT',
        label: 'Departments',
        description: 'แผนก',
        icon: <Building2 size={18} />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
    },
];

export default function AdminSettingsPage() {
    const router = useRouter();
    const pathname = usePathname();

    const [userRole, setUserRole] = useState('');
    const [username, setUsername] = useState('');

    const [activeTab, setActiveTab] = useState<TabId>('IT_DAMAGE_TYPE');
    const [options, setOptions] = useState<SystemOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Add form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Backup state
    const [importLoading, setImportLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'options' | 'backup'>('options');
    const [importMode, setImportMode] = useState<'data-only' | 'full'>('full');
    const [importResult, setImportResult] = useState<{
        format?: string; message?: string; executed?: number; skipped?: number;
        total?: number; errors?: { statement: string; error: string }[]; output?: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.title = 'EGPB Ticket - System Settings';
    }, []);

    useEffect(() => {
        const init = async () => {
            const result = await apiClient.auth.getUser();
            if (result.success && result.data?.user) {
                const role = result.data.user.role;
                if (role !== 'ADMIN') {
                    router.push('/dashboard');
                    return;
                }
                setUserRole(role);
                setUsername(result.data.user.username);
            } else {
                router.push('/login');
            }
        };
        init();
    }, [router]);

    const fetchOptions = useCallback(async (tab: TabId) => {
        setLoading(true);
        try {
            const res = await fetch(`/egpb/pyt/workorder/api/admin/settings/options?category=${tab}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                setOptions(data.data);
            } else {
                toast.error(data.error || 'Failed to load options');
            }
        } catch {
            toast.error('Failed to load options');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (username) {
            fetchOptions(activeTab);
            setShowAddForm(false);
            setNewLabel('');
            setEditingId(null);
        }
    }, [activeTab, username, fetchOptions]);

    const handleAdd = async () => {
        const trimmed = newLabel.trim();
        if (!trimmed) {
            toast.error('กรุณากรอกชื่อรายการ');
            return;
        }
        setAddLoading(true);
        try {
            const res = await fetch('/egpb/pyt/workorder/api/admin/settings/options', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeTab,
                    value: trimmed,
                    label: trimmed,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('เพิ่มรายการสำเร็จ');
                setNewLabel('');
                setShowAddForm(false);
                fetchOptions(activeTab);
            } else {
                toast.error(data.error || 'เพิ่มรายการไม่สำเร็จ');
            }
        } catch {
            toast.error('เพิ่มรายการไม่สำเร็จ');
        } finally {
            setAddLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        const trimmed = editLabel.trim();
        if (!trimmed) {
            toast.error('กรุณากรอกชื่อรายการ');
            return;
        }
        setEditLoading(true);
        try {
            const res = await fetch(`/egpb/pyt/workorder/api/admin/settings/options/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: trimmed }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('แก้ไขสำเร็จ');
                setEditingId(null);
                fetchOptions(activeTab);
            } else {
                toast.error(data.error || 'แก้ไขไม่สำเร็จ');
            }
        } catch {
            toast.error('แก้ไขไม่สำเร็จ');
        } finally {
            setEditLoading(false);
        }
    };

    const handleToggle = async (opt: SystemOption) => {
        try {
            const res = await fetch(`/egpb/pyt/workorder/api/admin/settings/options/${opt.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !opt.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(opt.isActive ? 'ปิดการใช้งานแล้ว' : 'เปิดการใช้งานแล้ว');
                fetchOptions(activeTab);
            } else {
                toast.error(data.error || 'ไม่สามารถเปลี่ยนสถานะได้');
            }
        } catch {
            toast.error('ไม่สามารถเปลี่ยนสถานะได้');
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (!confirm(`ยืนยันการลบ "${label}" ?`)) return;
        try {
            const res = await fetch(`/egpb/pyt/workorder/api/admin/settings/options/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                toast.success('ลบรายการสำเร็จ');
                fetchOptions(activeTab);
            } else {
                toast.error(data.error || 'ลบไม่สำเร็จ');
            }
        } catch {
            toast.error('ลบไม่สำเร็จ');
        }
    };

    const handleExport = async (type: 'full' | 'settings') => {
        setExportLoading(true);
        try {
            const res = await fetch(`/egpb/pyt/workorder/api/admin/backup?type=${type}`, {
                credentials: 'include',
            });
            if (!res.ok) {
                toast.error('Export ไม่สำเร็จ');
                return;
            }
            const blob = await res.blob();
            const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '')
                || `egpb-backup-${type}-${new Date().toISOString().split('T')[0]}.json`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export สำเร็จ');
        } catch {
            toast.error('Export ไม่สำเร็จ');
        } finally {
            setExportLoading(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isSql = file.name.endsWith('.sql');
        const isJson = file.name.endsWith('.json');

        if (!isSql && !isJson) {
            toast.error('กรุณาเลือกไฟล์ .sql หรือ .json เท่านั้น');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setImportLoading(true);
        setImportResult(null);

        try {
            if (isSql) {
                // SQL import via multipart/form-data
                const formData = new FormData();
                formData.append('file', file);
                formData.append('mode', importMode);
                const res = await fetch('/egpb/pyt/workorder/api/admin/backup/import-sql', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });
                const data = await res.json();
                if (data.success) {
                    setImportResult({
                        format: data.format,
                        message: data.message,
                        executed: data.executed,
                        skipped: data.skipped,
                        total: data.total,
                        errors: data.errors,
                        output: data.output,
                    });
                    toast.success(data.message || 'Import SQL สำเร็จ');
                } else {
                    setImportResult({ format: data.format, message: data.error });
                    toast.error(data.error || 'Import SQL ไม่สำเร็จ');
                }
            } else {
                // JSON import
                const text = await file.text();
                const json = JSON.parse(text);
                const res = await fetch('/egpb/pyt/workorder/api/admin/backup', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(json),
                });
                const data = await res.json();
                if (data.success) {
                    toast.success(data.message || 'Import JSON สำเร็จ');
                    fetchOptions(activeTab);
                } else {
                    toast.error(data.error || 'Import ไม่สำเร็จ');
                }
            }
        } catch {
            toast.error('ไฟล์ไม่ถูกต้อง กรุณาตรวจสอบ format ของไฟล์');
        } finally {
            setImportLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const currentTab = TABS.find(t => t.id === activeTab)!;
    const activeOptions = options.filter(o => o.isActive);
    const inactiveOptions = options.filter(o => !o.isActive);

    if (!username) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <DashboardMenu currentPath={pathname} />
                        <div className="text-lg sm:text-xl font-bold text-green-600 tracking-tight">
                            EGPB<span className="text-gray-900">Ticket</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 text-gray-400">
                            <span>/</span>
                            <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                                <Settings size={16} />
                                ตั้งค่าระบบ
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">กลับ Dashboard</span>
                        </Link>
                        <BellNotification userRole={userRole} username={username} />
                        <UserProfileDropdown
                            username={username}
                            userRole={userRole}
                            onLogout={async () => {
                                await apiClient.auth.signOut();
                                window.location.href = '/egpb/pyt/workorder/login';
                            }}
                        />
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <Settings size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบหลังบ้าน</h1>
                            <p className="text-sm text-gray-500">จัดการตัวเลือกและข้อมูลสำรองของระบบ</p>
                        </div>
                    </div>
                </div>

                {/* Section Switcher */}
                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveSection('options')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'options'
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Layers size={16} />
                        จัดการตัวเลือก
                    </button>
                    <button
                        onClick={() => setActiveSection('backup')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'backup'
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <FileJson size={16} />
                        Backup / Import
                    </button>
                </div>

                {/* =============== OPTIONS SECTION =============== */}
                {activeSection === 'options' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                        {/* Sidebar Tabs */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 h-fit">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">หมวดหมู่</p>
                            <div className="space-y-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeTab === tab.id
                                            ? `${tab.bgColor} ${tab.color} border ${tab.borderColor}`
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={activeTab === tab.id ? tab.color : 'text-gray-400'}>
                                            {tab.icon}
                                        </span>
                                        <div>
                                            <div>{tab.label}</div>
                                            <div className="text-xs font-normal opacity-60">{tab.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-4">
                            {/* Header Card */}
                            <div className={`${currentTab.bgColor} border ${currentTab.borderColor} rounded-2xl p-4 flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <span className={currentTab.color}>{currentTab.icon}</span>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">{currentTab.label}</h2>
                                        <p className="text-sm text-gray-500">
                                            {activeOptions.length} รายการที่ใช้งาน
                                            {inactiveOptions.length > 0 && ` · ${inactiveOptions.length} ปิดใช้งาน`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchOptions(activeTab)}
                                        className="p-2 text-gray-500 hover:bg-white/70 rounded-lg transition-colors"
                                        title="รีเฟรช"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <button
                                        onClick={() => { setShowAddForm(true); setNewLabel(''); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                                    >
                                        <Plus size={16} />
                                        เพิ่มรายการ
                                    </button>
                                </div>
                            </div>

                            {/* Add Form */}
                            {showAddForm && (
                                <div className="bg-white border-2 border-green-200 rounded-2xl p-4 shadow-sm">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Tag size={14} className="text-green-600" />
                                        เพิ่มรายการใหม่
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newLabel}
                                            onChange={e => setNewLabel(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
                                            placeholder="ชื่อรายการ..."
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleAdd}
                                            disabled={addLoading || !newLabel.trim()}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                        >
                                            {addLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                            บันทึก
                                        </button>
                                        <button
                                            onClick={() => setShowAddForm(false)}
                                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Options List */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="p-12 flex flex-col items-center gap-3 text-gray-400">
                                        <RefreshCw size={24} className="animate-spin" />
                                        <span className="text-sm">กำลังโหลด...</span>
                                    </div>
                                ) : options.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center gap-3 text-gray-400">
                                        <Tag size={32} className="opacity-30" />
                                        <span className="text-sm">ยังไม่มีรายการ</span>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {/* Active Options */}
                                        {activeOptions.map((opt, idx) => (
                                            <div key={opt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                                                <span className="text-xs text-gray-300 w-5 text-right font-mono">{idx + 1}</span>
                                                {editingId === opt.id ? (
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={editLabel}
                                                            onChange={e => setEditLabel(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') handleEdit(opt.id); if (e.key === 'Escape') setEditingId(null); }}
                                                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleEdit(opt.id)}
                                                            disabled={editLoading}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            {editLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                                            <span className="text-sm text-gray-800 font-medium truncate">{opt.label}</span>
                                                            <span className="text-xs text-gray-400 truncate hidden sm:block">({opt.value})</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingId(opt.id); setEditLabel(opt.label); }}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="แก้ไข"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggle(opt)}
                                                                className="p-1.5 text-green-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="ปิดการใช้งาน"
                                                            >
                                                                <ToggleRight size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(opt.id, opt.label)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="ลบ"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {/* Inactive Options */}
                                        {inactiveOptions.length > 0 && (
                                            <>
                                                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">ปิดการใช้งาน</span>
                                                </div>
                                                {inactiveOptions.map((opt, idx) => (
                                                    <div key={opt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group opacity-50">
                                                        <span className="text-xs text-gray-300 w-5 text-right font-mono">{activeOptions.length + idx + 1}</span>
                                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                                            <span className="text-sm text-gray-500 truncate line-through">{opt.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleToggle(opt)}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="เปิดการใช้งาน"
                                                            >
                                                                <ToggleLeft size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(opt.id, opt.label)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="ลบ"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Info Note */}
                            <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <span>รายการที่เพิ่มที่นี่จะปรากฏในฟอร์มสร้าง Ticket ทันที หากยังไม่มีรายการในระบบ จะใช้ค่า Default จาก constants</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* =============== BACKUP SECTION =============== */}
                {activeSection === 'backup' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Export Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Download size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Export Backup</h3>
                                        <p className="text-xs text-gray-500">ดาวน์โหลดข้อมูลสำรองเป็นไฟล์ JSON</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <button
                                    onClick={() => handleExport('settings')}
                                    disabled={exportLoading}
                                    className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                                >
                                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Settings size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Export Settings Only</p>
                                        <p className="text-xs text-gray-500">ตัวเลือก Type of Damage และ Area ทั้งหมด</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleExport('full')}
                                    disabled={exportLoading}
                                    className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                                >
                                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                        <FileJson size={16} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Full Backup</p>
                                        <p className="text-xs text-gray-500">Settings + Tickets + Engineer Tickets ทั้งหมด</p>
                                    </div>
                                </button>
                                {exportLoading && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <RefreshCw size={14} className="animate-spin" />
                                        กำลัง Export...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Import Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                        <Upload size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Import Backup</h3>
                                        <p className="text-xs text-gray-500">นำเข้าข้อมูลสำรองจากไฟล์ .sql (pg_dump) หรือ .json</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">

                                {/* Restore Mode Selector (for .sql only) */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-2">โหมด Restore (สำหรับไฟล์ .sql)</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setImportMode('data-only')}
                                            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${importMode === 'data-only'
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                                            }`}
                                        >
                                            <CheckCircle2 size={15} />
                                            <div className="text-left">
                                                <p className="font-medium">Data Only</p>
                                                <p className={`text-xs ${importMode === 'data-only' ? 'text-green-100' : 'text-gray-400'}`}>นำเข้าข้อมูลอย่างเดียว (แนะนำ)</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setImportMode('full')}
                                            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${importMode === 'full'
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
                                            }`}
                                        >
                                            <AlertTriangle size={15} />
                                            <div className="text-left">
                                                <p className="font-medium">Full Restore</p>
                                                <p className={`text-xs ${importMode === 'full' ? 'text-orange-100' : 'text-gray-400'}`}>สร้าง schema + ข้อมูลใหม่ทั้งหมด</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".sql,.json"
                                    onChange={handleImport}
                                    className="hidden"
                                    id="import-file"
                                    disabled={importLoading}
                                />
                                <label
                                    htmlFor="import-file"
                                    className={`w-full flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed rounded-xl transition-all
                                        ${importLoading
                                            ? 'border-green-300 bg-green-50 cursor-not-allowed'
                                            : 'border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                                        }`}
                                >
                                    {importLoading ? (
                                        <>
                                            <RefreshCw size={28} className="text-green-500 animate-spin" />
                                            <span className="text-sm text-green-600 font-medium">กำลัง Import... (อาจใช้เวลาสักครู่)</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                <Upload size={24} className="text-gray-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกไฟล์</p>
                                                <p className="text-xs text-gray-400 mt-1">รองรับ <span className="font-semibold text-green-600">.sql</span> (pg_dump) และ <span className="font-semibold text-blue-600">.json</span></p>
                                            </div>
                                        </>
                                    )}
                                </label>

                                {/* Import Result */}
                                {importResult && (
                                    <div className={`rounded-xl border overflow-hidden ${importResult.errors && importResult.errors.length > 0 ? 'border-amber-200' : 'border-green-200'}`}>
                                        <div className={`flex items-center gap-2 px-4 py-3 ${importResult.errors && importResult.errors.length > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                                            <CheckCircle2 size={16} className="text-green-600" />
                                            <span className="text-sm font-semibold text-gray-700">ผลลัพธ์การ Import</span>
                                            {importResult.format && (
                                                <span className="ml-auto text-xs px-2 py-0.5 bg-white rounded-full border border-gray-200 text-gray-500">
                                                    {importResult.format === 'custom' ? 'pg_dump custom format' : importResult.format === 'plain' ? 'plain SQL' : importResult.format}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <p className="text-sm text-gray-700">{importResult.message}</p>
                                            {importResult.total !== undefined && (
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-gray-600">ทั้งหมด: <strong>{importResult.total}</strong></span>
                                                    <span className="text-green-700">สำเร็จ: <strong>{importResult.executed}</strong></span>
                                                    <span className="text-amber-700">ข้าม: <strong>{importResult.skipped}</strong></span>
                                                </div>
                                            )}
                                            {importResult.output && (
                                                <details>
                                                    <summary className="text-xs text-gray-500 cursor-pointer font-medium">ดู pg_restore output</summary>
                                                    <pre className="mt-2 text-xs bg-gray-900 text-green-300 p-3 rounded-lg overflow-x-auto max-h-40 font-mono leading-relaxed">
                                                        {importResult.output}
                                                    </pre>
                                                </details>
                                            )}
                                            {importResult.errors && importResult.errors.length > 0 && (
                                                <details>
                                                    <summary className="text-xs text-amber-700 cursor-pointer font-medium">ดู errors ({importResult.errors.length})</summary>
                                                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                                        {importResult.errors.map((err, i) => (
                                                            <div key={i} className="text-xs bg-white rounded p-2 border border-amber-200">
                                                                <p className="text-gray-500 font-mono truncate">{err.statement}</p>
                                                                <p className="text-red-600">{err.error}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-xs text-amber-700 space-y-1">
                                            <p className="font-semibold">หมายเหตุ:</p>
                                            <p>• <strong>.sql (pg_dump)</strong> — ใช้ pg_restore restore ข้อมูลโดยตรง</p>
                                            <p>• <strong>Data Only</strong> — นำเข้าเฉพาะ rows ไม่สร้าง/ลบ schema</p>
                                            <p>• <strong>Full Restore</strong> — สร้าง schema ใหม่ + ข้อมูล (ระวัง: ข้อมูลเดิมอาจถูก overwrite)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Format Reference - SQL */}
                        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <h3 className="text-sm font-semibold text-gray-700">ตัวอย่าง Format ที่รองรับ</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                        <span className="w-5 h-5 bg-green-100 text-green-700 rounded text-center font-mono leading-5">S</span>
                                        SQL Format (.sql)
                                    </p>
                                    <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
{`-- PostgreSQL dump
INSERT INTO tickets (id, title, ...)
VALUES ('uuid', 'ชื่อ ticket', ...);

INSERT INTO engineer_tickets (...)
VALUES (...);

UPDATE tickets
SET status = 'DONE'
WHERE id = 'uuid';`}
                                    </pre>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                        <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-center font-mono leading-5">J</span>
                                        JSON Format (.json)
                                    </p>
                                    <pre className="bg-gray-900 text-blue-400 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
{`{
  "exportedAt": "...",
  "version": "1.0",
  "systemOptions": [
    {
      "category": "IT_DAMAGE_TYPE",
      "value": "Hardware",
      "label": "Hardware",
      "isActive": true
    }
  ]
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
