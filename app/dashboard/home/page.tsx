"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { BASE_PATH } from '@/lib/constants';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import BellNotification from '@/components/BellNotification';
import DashboardMenu from '@/components/DashboardMenu';
import {
    Loader2
} from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Initial Load & Auth Check
    useEffect(() => {
        document.title = 'EGPB Ticket - Home';
        const init = async () => {
            try {
                const result = await apiClient.auth.getUser();
                if (result.success && result.data?.user) {
                    const user = result.data.user;
                    setUsername(user.username);
                    setUserRole(user.role);
                    setIsAdmin(user.role === 'ADMIN' || user.role === 'IT_ADMIN');
                    setLoading(false);
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            }
        };
        init();
    }, [router]);

    const handleLogout = async () => {
        await apiClient.auth.signOut();
        window.location.href = '/egpb/pyt/workorder/login';
    };



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin h-8 w-8 text-green-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Dashboard Navbar */}
            <nav className="bg-white border-b border-green-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <DashboardMenu currentPath={pathname} />
                    <div className="text-xl font-bold text-green-600 tracking-tighter cursor-default">
                        EGPB<span className="text-black">Ticket</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <span className="hidden md:inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                            Admin Mode
                        </span>
                    )}
                    <BellNotification />
                    <UserProfileDropdown
                        username={username}
                        userRole={userRole}
                        onLogout={handleLogout}
                    />
                </div>
            </nav>

            <main className="flex-1 relative">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url('${BASE_PATH}/home-bg4.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.5
                    }}
                />

                {/* Content */}
                <div className="relative z-10 w-full px-6 py-8 h-full">
                    <div className="flex flex-col items-start justify-start h-[60vh] text-left">
                        <h1 className="text-4xl font-bold text-white mb-4">Welcome to EGPB Ticket System</h1>
                        <p className="text-lg text-white max-w-2xl">
                            Select a dashboard from the menu to get started.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
