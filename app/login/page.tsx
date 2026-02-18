"use client";

import { useState, useEffect, Suspense } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timeout = searchParams.get('timeout');
    if (timeout === 'true') {
      setInfoMessage('You have been logged out due to inactivity (30 mins).');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    setInfoMessage(null);

    try {
      const result = await apiClient.auth.signIn(username, password, remember);

      if (!result.success) {
        // Check for additional warning info from API
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result as any;

        // Check for locked account
        if (data.code === 'ACCOUNT_LOCKED') {
          throw new Error('Your account has been locked due to too many failed login attempts. Please contact Admin.');
        }

        // Check for IP blocked
        if (data.code === 'IP_BLOCKED') {
          throw new Error('Your IP address has been temporarily blocked. Please try again later.');
        }

        // Check for rate limited
        if (data.code === 'RATE_LIMITED') {
          throw new Error(`Too many login attempts. Please wait ${data.retryAfter || 60} seconds before trying again.`);
        }

        // Check for remaining attempts warning
        if (data.remainingAttempts !== undefined && data.remainingAttempts <= 3) {
          setWarning(`⚠️ Warning: ${data.remainingAttempts} attempt(s) remaining before your account is locked.`);
        }

        throw new Error(result.error || 'Login failed');
      }

      // Redirect to dashboard on success
      router.push('/dashboard/home');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f3f4f6] relative overflow-hidden px-4 sm:px-6">
      {/* Background Image/Gradient Effect - Cisco Style */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-[#f3f4f6]"></div>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-lg shadow-2xl z-10 p-6 sm:p-8 md:p-10 border-t-4 border-green-600">
        <div className="text-center mb-8">
          {/* Logo Area */}
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-2">
              E
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">EGPB<span className="text-green-600">Ticket</span></span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Sign In</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Please enter your details.</p>
        </div>

        {infoMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 text-blue-600 text-sm rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            {infoMessage}
          </div>
        )}

        {/* Warning for remaining attempts */}
        {warning && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            {warning}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            {/* Forgot password link could go here */}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            &copy; 2025 EGPB Ticket System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
