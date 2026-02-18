'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Users, Plus, Edit, Trash2, Search, ChevronLeft, X, Eye, EyeOff, Info, Crown, Wrench, Settings, UserCircle, Filter, Download, CheckSquare, Square, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ROLE_TO_DEPARTMENT_MAP } from '@/lib/constants';

interface User {
    id: string;
    username: string;
    fullName?: string;
    position?: string;
    department?: string;
    telephoneExtension?: string;
    role: string;
    createdAt: string;
    // Security fields
    isLocked?: boolean;
    lockedAt?: string | null;
    failedAttempts?: number;
}

// Role configuration with icons and colors
const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; gradient: string; badge: string }> = {
    ADMIN: { label: 'Admin', icon: Crown, gradient: 'from-red-500 to-pink-500', badge: 'bg-gradient-to-r from-red-500 to-pink-500 text-white' },
    IT_ADMIN: { label: 'IT Admin', icon: Wrench, gradient: 'from-blue-500 to-cyan-500', badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' },
    ENGINEER_ADMIN: { label: 'Engineer Admin', icon: Settings, gradient: 'from-green-500 to-emerald-500', badge: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' },
    EXE_AC: { label: 'Executive & Accounting', icon: UserCircle, gradient: 'from-amber-400 to-yellow-400', badge: 'bg-amber-100 text-amber-800' },
    FB: { label: 'F&B', icon: UserCircle, gradient: 'from-orange-400 to-red-400', badge: 'bg-orange-100 text-orange-800' },
    BANQUET: { label: 'Banquet', icon: UserCircle, gradient: 'from-purple-400 to-pink-400', badge: 'bg-purple-100 text-purple-800' },
    FRONT_OFFICE: { label: 'Front Office', icon: UserCircle, gradient: 'from-cyan-400 to-blue-400', badge: 'bg-cyan-100 text-cyan-800' },
    HK: { label: 'Housekeeping', icon: UserCircle, gradient: 'from-teal-400 to-cyan-400', badge: 'bg-teal-100 text-teal-800' },
    HR: { label: 'Human Resources', icon: UserCircle, gradient: 'from-indigo-400 to-purple-400', badge: 'bg-indigo-100 text-indigo-800' },
    JURISTIC: { label: 'Juristic', icon: UserCircle, gradient: 'from-violet-400 to-purple-400', badge: 'bg-violet-100 text-violet-800' },
    KITCHEN: { label: 'Kitchen', icon: UserCircle, gradient: 'from-red-400 to-orange-400', badge: 'bg-red-100 text-red-800' },
    RSVN_SALE: { label: 'Reservation & Sales & Marketing', icon: UserCircle, gradient: 'from-pink-400 to-rose-400', badge: 'bg-pink-100 text-pink-800' },
    SEC: { label: 'Security', icon: UserCircle, gradient: 'from-slate-400 to-gray-400', badge: 'bg-slate-100 text-slate-800' },
    ENG: { label: 'Engineer', icon: UserCircle, gradient: 'from-green-400 to-teal-400', badge: 'bg-green-100 text-green-800' },
    USER: { label: 'User', icon: UserCircle, gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-200 text-gray-700' },
};


// Generate avatar gradient based on username
const getAvatarGradient = (username: string) => {
    const colors = [
        'from-purple-400 to-pink-400',
        'from-blue-400 to-cyan-400',
        'from-green-400 to-teal-400',
        'from-yellow-400 to-orange-400',
        'from-red-400 to-pink-400',
        'from-indigo-400 to-purple-400',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
};

export default function ManageUsers() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

    // Bulk selection state
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // View Details Modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewUser, setViewUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        position: '',
        department: '',
        telephoneExtension: '',
        password: '',
        role: 'USER',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Calculate statistics from total role counts
    const stats = useMemo(() => {
        return {
            total: totalUsers,
            admins: (roleCounts.ADMIN || 0) + (roleCounts.IT_ADMIN || 0) + (roleCounts.ENGINEER_ADMIN || 0),
            itAdmins: roleCounts.IT_ADMIN || 0,
            engineerAdmins: roleCounts.ENGINEER_ADMIN || 0,
            regularUsers: totalUsers - ((roleCounts.ADMIN || 0) + (roleCounts.IT_ADMIN || 0) + (roleCounts.ENGINEER_ADMIN || 0)),
        };
    }, [totalUsers, roleCounts]);

    const fetchUsers = useCallback(async () => {
        try {
            const filters: { search?: string; page?: number; limit?: number; role?: string } = {
                page: currentPage,
                limit: 10,
            };
            if (searchQuery) filters.search = searchQuery;
            if (roleFilter) filters.role = roleFilter;

            const result = await apiClient.users.list(filters);
            if (result.success && result.data) {
                setUsers(result.data.users || []);
                if (result.data.pagination) {
                    setTotalPages(result.data.pagination.totalPages);
                    setTotalUsers(result.data.pagination.total);
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, [searchQuery, currentPage, roleFilter]);

    // Fetch all users for statistics (without pagination)
    const fetchRoleCounts = useCallback(async () => {
        try {
            const result = await apiClient.users.list({ limit: 10000 }); // Get all users
            if (result.success && result.data) {
                const counts: Record<string, number> = {};
                result.data.users.forEach(user => {
                    counts[user.role] = (counts[user.role] || 0) + 1;
                });
                setRoleCounts(counts);
            }
        } catch (error) {
            console.error('Error fetching role counts:', error);
        }
    }, []);

    useEffect(() => {
        document.title = 'EGPB Ticket - Manage Users';

        const init = async () => {
            const result = await apiClient.auth.getUser();
            if (result.success && result.data?.user) {
                const user = result.data.user;
                setCurrentUser(user);

                // Check if user has permission
                if (user.role !== 'ADMIN' && user.role !== 'IT_ADMIN') {
                    router.push('/dashboard');
                    return;
                }

                await Promise.all([fetchUsers(), fetchRoleCounts()]);
            } else {
                router.push('/login');
            }
            setLoading(false);
        };

        init();
    }, [router, fetchUsers, fetchRoleCounts]);

    const prevSearchQuery = useRef(searchQuery);
    const prevRoleFilter = useRef(roleFilter);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                if (prevSearchQuery.current !== searchQuery || prevRoleFilter.current !== roleFilter) {
                    setCurrentPage(1);
                    prevSearchQuery.current = searchQuery;
                    prevRoleFilter.current = roleFilter;
                }
                fetchUsers();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, roleFilter, loading, fetchUsers]);

    const handleOpenCreateModal = () => {
        setModalMode('create');
        setSelectedUser(null);
        setFormData({
            username: '',
            fullName: '',
            position: '',
            department: '',
            telephoneExtension: '',
            password: '',
            role: 'USER',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleOpenEditModal = (user: User) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            username: user.username,
            fullName: user.fullName || '',
            position: user.position || '',
            department: user.department || '',
            telephoneExtension: user.telephoneExtension || '',
            password: '',
            role: user.role,
        });
        setFormError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormError('');
        setShowPassword(false);
    };

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showModal) {
                    handleCloseModal();
                } else if (showViewModal) {
                    handleCloseViewModal();
                }
            }
        };

        if (showModal || showViewModal) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [showModal, showViewModal]);

    const handleOpenViewModal = (user: User) => {
        setViewUser(user);
        setShowViewModal(true);
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            if (modalMode === 'create') {
                if (!formData.username || !formData.password) {
                    setFormError('Username and password are required');
                    setFormLoading(false);
                    return;
                }

                const result = await apiClient.users.create(formData);

                if (result.success) {
                    await Promise.all([fetchUsers(), fetchRoleCounts()]);
                    handleCloseModal();
                } else {
                    setFormError(result.error || 'Failed to create user');
                }
            } else {
                if (!selectedUser) return;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updateData: any = {
                    username: formData.username,
                    fullName: formData.fullName,
                    position: formData.position,
                    department: formData.department,
                    telephoneExtension: formData.telephoneExtension,
                    role: formData.role,
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                const result = await apiClient.users.update(selectedUser.id, updateData);

                if (result.success) {
                    await Promise.all([fetchUsers(), fetchRoleCounts()]);
                    handleCloseModal();
                } else {
                    setFormError(result.error || 'Failed to update user');
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setFormError(error.message || 'An error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (user.id === currentUser?.id) {
            toast.error('Cannot delete yourself!');
            return;
        }

        // Show confirmation toast with action buttons
        toast.error(`Delete user "${user.username}"?`, {
            action: {
                label: 'Delete',
                onClick: async () => {
                    try {
                        const result = await apiClient.users.delete(user.id);

                        if (result.success) {
                            await Promise.all([fetchUsers(), fetchRoleCounts()]);
                            toast.success('User deleted successfully');
                        } else {
                            toast.error(result.error || 'Failed to delete user');
                        }
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        toast.error('An error occurred while deleting user');
                    }
                },
            },
        });
    };

    // Bulk selection handlers
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedUsers(new Set());
            setSelectAll(false);
        } else {
            const allUserIds = new Set(users.map(u => u.id));
            setSelectedUsers(allUserIds);
            setSelectAll(true);
        }
    };

    const handleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
        setSelectAll(newSelected.size === users.length);
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedUsers.size === 0) return;

        const selectedUsernames = users
            .filter(u => selectedUsers.has(u.id))
            .map(u => u.username)
            .join(', ');

        // Show confirmation toast
        toast.error(`Delete ${selectedUsers.size} user(s)?`, {
            description: selectedUsernames,
            action: {
                label: 'Delete All',
                onClick: async () => {
                    try {
                        const deletePromises = Array.from(selectedUsers).map(userId =>
                            apiClient.users.delete(userId)
                        );

                        await Promise.all(deletePromises);
                        await Promise.all([fetchUsers(), fetchRoleCounts()]);
                        setSelectedUsers(new Set());
                        setSelectAll(false);
                        toast.success(`${selectedUsers.size} user(s) deleted successfully`);
                    } catch (error) {
                        console.error('Error deleting users:', error);
                        toast.error('An error occurred while deleting users');
                    }
                },
            },
        });
    };

    // Export to CSV handler
    const handleExport = () => {
        const csvData = users.map(user => ({
            Username: user.username,
            'Full Name': user.fullName || '',
            Position: user.position || '',
            Department: user.department || ROLE_TO_DEPARTMENT_MAP[user.role] || '',
            Role: ROLE_CONFIG[user.role]?.label || user.role,
            'Created At': new Date(user.createdAt).toLocaleDateString('en-GB'),
        }));

        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Get department from role
    const getDepartment = (user: User) => {
        return user.department || ROLE_TO_DEPARTMENT_MAP[user.role] || '-';
    };

    // Unlock user account
    const handleUnlockUser = async (user: User) => {
        if (!confirm(`ต้องการปลดล็อค user "${user.username}" หรือไม่?`)) {
            return;
        }

        try {
            const result = await apiClient.admin.unlockUser(user.id);
            if (result.success) {
                toast.success(`ปลดล็อค user "${user.username}" สำเร็จ`);
                await fetchUsers();
            } else {
                toast.error(result.error || 'ไม่สามารถปลดล็อค user ได้');
            }
        } catch (error) {
            console.error('Error unlocking user:', error);
            toast.error('เกิดข้อผิดพลาดในการปลดล็อค user');
        }
    };

    // Lock user account manually
    const handleLockUser = async (user: User) => {
        if (user.id === currentUser?.id) {
            toast.error('ไม่สามารถล็อคบัญชีของตัวเองได้');
            return;
        }

        if (!confirm(`ต้องการล็อค user "${user.username}" หรือไม่? User จะไม่สามารถ login ได้จนกว่าจะถูกปลดล็อค`)) {
            return;
        }

        try {
            const result = await apiClient.admin.lockUser(user.id);
            if (result.success) {
                toast.success(`ล็อค user "${user.username}" สำเร็จ`);
                await fetchUsers();
            } else {
                toast.error(result.error || 'ไม่สามารถล็อค user ได้');
            }
        } catch (error) {
            console.error('Error locking user:', error);
            toast.error('เกิดข้อผิดพลาดในการล็อค user');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-gray-700">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                            <ChevronLeft size={20} />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                            <p className="text-gray-600 mt-1">Create and manage user accounts</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                disabled={users.length === 0}
                                className="flex items-center px-6 py-3 bg-white border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={20} className="mr-2" />
                                Export Users
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium"
                            >
                                <Plus size={20} className="mr-2" />
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 py-6 md:py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                <Users className="text-white" size={28} />
                            </div>
                        </div>
                    </div>

                    {/* All Admins */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">All Admins</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.admins}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                                <Crown className="text-white" size={28} />
                            </div>
                        </div>
                    </div>

                    {/* IT Admins */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">IT Admins</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.itAdmins}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                <Wrench className="text-white" size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Engineer Admins */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Engineer Admins</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.engineerAdmins}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                                <Settings className="text-white" size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 appearance-none bg-white"
                            >
                                <option value="">All Roles</option>
                                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(searchQuery || roleFilter) && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Active filters:</span>
                            {searchQuery && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                                    Search: {searchQuery}
                                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            )}
                            {roleFilter && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                                    Role: {ROLE_CONFIG[roleFilter]?.label}
                                    <button onClick={() => setRoleFilter('')} className="hover:text-green-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setRoleFilter('');
                                }}
                                className="ml-auto text-sm text-gray-600 hover:text-gray-900"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedUsers.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                                {selectedUsers.size} user(s) selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={handleSelectAll}
                                            className="flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-700"
                                        >
                                            {selectAll ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <Users size={64} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-900 font-medium text-lg mb-2">No users found</p>
                                            <p className="text-sm text-gray-500">
                                                {searchQuery || roleFilter ? 'Try different filters' : 'Click "Add User" to create one'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.USER;
                                        const RoleIcon = roleConfig.icon;

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Checkbox Column */}
                                                <td className="px-6 py-5">
                                                    <button
                                                        onClick={() => handleSelectUser(user.id)}
                                                        className="flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-700"
                                                    >
                                                        {selectedUsers.has(user.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </button>
                                                </td>

                                                {/* User Column (Avatar + Username) */}
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`flex-shrink-0 h-12 w-12 bg-gradient-to-br ${getAvatarGradient(user.username)} rounded-full flex items-center justify-center shadow-md`}>
                                                            <span className="text-white font-bold text-lg">
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                                                                {user.isLocked && (
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                                                                        <Lock size={10} />
                                                                        Locked
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Full Name Column */}
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.fullName || '-'}</div>
                                                </td>

                                                {/* Department Column */}
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{getDepartment(user)}</div>
                                                </td>

                                                {/* Role Column */}
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${roleConfig.badge} shadow-sm`}>
                                                        <RoleIcon size={14} />
                                                        {roleConfig.label}
                                                    </span>
                                                </td>

                                                {/* Created At Column */}
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Lock/Unlock buttons */}
                                                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_ADMIN') && user.id !== currentUser.id && (
                                                            user.isLocked ? (
                                                                <button
                                                                    onClick={() => handleUnlockUser(user)}
                                                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="ปลดล็อค User"
                                                                >
                                                                    <Unlock size={18} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleLockUser(user)}
                                                                    className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                                                                    title="ล็อค User"
                                                                >
                                                                    <Lock size={18} />
                                                                </button>
                                                            )
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenViewModal(user)}
                                                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Info size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditModal(user)}
                                                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_ADMIN') && user.id !== currentUser.id && (
                                                            <button
                                                                onClick={() => handleDelete(user)}
                                                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Page</span>
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
                                className="w-16 px-2 py-1 text-center text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">of {totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>

            {/* Create/Edit Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {modalMode === 'create' ? 'Add New User' : 'Edit User'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Row 1: Username & Full Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Position & Department */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                        <input
                                            type="text"
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Telephone & Role */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telephone Extension</label>
                                        <input
                                            type="text"
                                            value={formData.telephoneExtension}
                                            onChange={(e) => setFormData({ ...formData, telephoneExtension: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                            required
                                        >
                                            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                                <option key={key} value={key}>{config.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 4: Password - Full Width */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {modalMode === 'edit' && '(leave blank to keep current)'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                            required={modalMode === 'create'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Account Lock Status - Only show in edit mode and for non-self users */}
                                {modalMode === 'edit' && selectedUser && selectedUser.id !== currentUser?.id && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะบัญชี</label>
                                        <div className={`p-4 rounded-xl ${selectedUser.isLocked ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {selectedUser.isLocked ? (
                                                        <>
                                                            <div className="p-2 bg-red-100 rounded-lg">
                                                                <Lock size={20} className="text-red-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-red-900">บัญชีถูกล็อค</p>
                                                                <p className="text-sm text-red-700">
                                                                    ผู้ใช้ไม่สามารถ login ได้
                                                                    {selectedUser.lockedAt && (
                                                                        <> • ล็อคเมื่อ {new Date(selectedUser.lockedAt).toLocaleString('th-TH')}</>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="p-2 bg-green-100 rounded-lg">
                                                                <Unlock size={20} className="text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-green-900">บัญชีปกติ</p>
                                                                <p className="text-sm text-green-700">ผู้ใช้สามารถ login ได้</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectedUser.isLocked ? handleUnlockUser(selectedUser) : handleLockUser(selectedUser)}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedUser.isLocked
                                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                                        }`}
                                                >
                                                    {selectedUser.isLocked ? 'ปลดล็อค' : 'ล็อคบัญชี'}
                                                </button>
                                            </div>
                                        </div>
                                        {selectedUser.failedAttempts && selectedUser.failedAttempts > 0 && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                จำนวนครั้งที่ login ผิด: {selectedUser.failedAttempts} ครั้ง
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 transition-all shadow-md"
                                    disabled={formLoading}
                                >
                                    {formLoading ? 'Saving...' : (modalMode === 'create' ? 'Create User' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showViewModal && viewUser && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={handleCloseViewModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                            <button onClick={handleCloseViewModal} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Avatar */}
                            <div className="flex justify-center mb-6">
                                <div className={`h-24 w-24 bg-gradient-to-br ${getAvatarGradient(viewUser.username)} rounded-full flex items-center justify-center shadow-lg`}>
                                    <span className="text-white font-bold text-4xl">
                                        {viewUser.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Username */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Username</label>
                                <p className="text-gray-900 font-semibold">{viewUser.username}</p>
                            </div>

                            {/* Full Name */}
                            {viewUser.fullName && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Full Name</label>
                                    <p className="text-gray-900 font-semibold">{viewUser.fullName}</p>
                                </div>
                            )}

                            {/* Position and Department */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Position</label>
                                    <p className="text-gray-900 font-semibold">{viewUser.position || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Department</label>
                                    <p className="text-gray-900 font-semibold">{viewUser.department || '-'}</p>
                                </div>
                            </div>

                            {/* Telephone Extension */}
                            {viewUser.telephoneExtension && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Telephone</label>
                                    <p className="text-gray-900 font-semibold">{viewUser.telephoneExtension}</p>
                                </div>
                            )}

                            {/* Role */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Role</label>
                                <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${ROLE_CONFIG[viewUser.role]?.badge || ROLE_CONFIG.USER.badge} shadow-sm mt-1`}>
                                    {(() => {
                                        const RoleIcon = ROLE_CONFIG[viewUser.role]?.icon || ROLE_CONFIG.USER.icon;
                                        return <RoleIcon size={14} />;
                                    })()}
                                    {ROLE_CONFIG[viewUser.role]?.label || viewUser.role}
                                </span>
                            </div>

                            {/* Created At */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Created At</label>
                                <p className="text-gray-900 font-semibold">
                                    {new Date(viewUser.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            {/* User ID */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">User ID</label>
                                <p className="text-gray-900 font-mono text-xs break-all">{viewUser.id}</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={handleCloseViewModal}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
