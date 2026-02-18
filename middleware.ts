import { NextResponse, type NextRequest } from 'next/server'
import { rateLimiter } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
    // Create response
    const response = NextResponse.next()

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    const { pathname } = request.nextUrl

    // CSRF Protection & Rate Limiting for API routes
    if (pathname.startsWith('/api/')) {
        // Rate Limiting (100 req/min)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        const isAllowed = await rateLimiter.check(100, ip);

        if (!isAllowed) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }

        // Only check state-changing methods
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            const origin = request.headers.get('origin')
            const referer = request.headers.get('referer')
            const host = request.headers.get('host')

            // If origin is present, it must match host
            if (origin) {
                const originHost = origin.replace(/^https?:\/\//, '')
                if (originHost !== host) {
                    return new NextResponse('CSRF Error: Origin mismatch', { status: 403 })
                }
            }
            // If no origin, check referer
            else if (referer) {
                const refererHost = new URL(referer).host
                if (refererHost !== host) {
                    return new NextResponse('CSRF Error: Referer mismatch', { status: 403 })
                }
            }
            // If neither (and not a safe method like GET/HEAD), it's suspicious but we might allow it 
            // depending on strictness. For strict CSRF, we might block if both missing.
            // For now, next.js server actions handle specific CSRF, this is a general layer.
        }

        return response
    }

    // Skip middleware for uploads folder
    if (pathname.startsWith('/uploads/')) {
        return response
    }

    // List of public paths that don't require authentication
    const publicPaths = ['/', '/login', '/register']
    const isPublicPath = publicPaths.includes(pathname)

    // Allow public paths
    if (isPublicPath) {
        return response
    }

    // Check if user is authenticated
    if (!token) {
        // Redirect to login if not authenticated
        // Use clone() to preserve base path configuration
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        return NextResponse.redirect(loginUrl);
    }

    // Token exists, allow request to continue
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
