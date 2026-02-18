import { NextRequest } from 'next/server';
import { getSession } from './auth';

export interface AuthResult {
    valid: boolean;
    payload?: {
        userId: string;
        username: string;
        role: string;
    };
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
    try {
        const token = request.cookies.get('auth-token')?.value;
        console.log('[verifyAuth] Token from cookie:', token ? 'EXISTS' : 'MISSING');
        console.log('[verifyAuth] All cookies:', request.cookies.getAll().map(c => c.name));

        if (!token) {
            console.log('[verifyAuth] No token found in cookies');
            return { valid: false };
        }

        const user = await getSession(token);
        console.log('[verifyAuth] User from session:', user ? user.id : 'NULL');

        if (!user) {
            console.log('[verifyAuth] Invalid session');
            return { valid: false };
        }

        console.log('[verifyAuth] Auth successful for user:', user.id, 'role:', user.role);
        return {
            valid: true,
            payload: {
                userId: user.id,
                username: user.username,
                role: user.role,
            },
        };
    } catch (error) {
        console.error('[verifyAuth] Error:', error);
        return { valid: false };
    }
}
