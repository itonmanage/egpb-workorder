"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, Home, BarChart3, Wrench } from 'lucide-react';

interface MenuItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
}

interface DashboardMenuProps {
    currentPath: string;
}

export default function DashboardMenu({ currentPath }: DashboardMenuProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Define menu items based on role
    const getMenuItems = (): MenuItem[] => {
        const baseItems: MenuItem[] = [
            { label: 'Home', path: '/dashboard/home', icon: <Home size={18} /> },
        ];

        // All roles see both dashboards in same order: Engineer first, then IT
        const dashboardItems: MenuItem[] = [
            { label: 'Engineer Dashboard', path: '/dashboard/engineer', icon: <Wrench size={18} /> },
            { label: 'IT Dashboard', path: '/dashboard', icon: <BarChart3 size={18} /> },
        ];

        return [...baseItems, ...dashboardItems];
    };

    const menuItems = getMenuItems();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    // Close menu on ESC key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showMenu) {
                setShowMenu(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showMenu]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-300 text-black flex items-center gap-2 group border border-transparent hover:border-green-200"
            >
                <Menu size={24} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium hidden md:inline">Menu</span>
                <ChevronDown
                    size={16}
                    className={`transition-all duration-300 ${showMenu ? 'rotate-180 text-green-600' : ''}`}
                />
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fadeIn"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Menu Dropdown */}
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-green-100 z-50 overflow-hidden animate-slideDown">
                        <div className="p-2 space-y-1">
                            {menuItems.map((item) => {
                                const isActive = currentPath === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive
                                            ? 'border-l-4 border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm text-green-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setShowMenu(false)}
                                    >
                                        {isActive && (
                                            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                                        )}
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
