"use client";

import Link from 'next/link';
import { ArrowRight, User, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Username Validation
        if (username.length < 4) {
            setError('Username must be at least 4 characters long.');
            setLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            setError('Username must contain only English letters and numbers.');
            setLoading(false);
            return;
        }

        try {
            // Use apiClient to register (Note: API needs to support public registration if this page is public)
            // Currently app/api/auth/register handles this.
            const result = await apiClient.auth.signUp('', username, password);

            if (!result.success) {
                throw new Error(result.error || 'Registration failed');
            }

            // Redirect to dashboard or login
            router.push('/login');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50/50 dark:bg-background p-4 sm:p-6">
            <div className="w-full max-w-md bg-white dark:bg-green-900/20 rounded-3xl shadow-xl border border-green-100 dark:border-green-900 overflow-hidden">
                <div className="p-6 sm:p-8 md:p-10">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block text-2xl font-bold text-primary tracking-tighter mb-2">
                            EGPB<span className="text-foreground">Ticket</span>
                        </Link>
                        <h1 className="text-xl font-semibold text-foreground">Create an Account</h1>
                        <p className="text-sm text-muted-foreground mt-1">Join us to report and track issues</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-start">
                            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleRegister}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="johndoe123"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-1">Min. 4 characters, English letters & numbers only.</p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                            {!loading && <ArrowRight size={18} className="ml-2" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/" className="text-primary font-medium hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
