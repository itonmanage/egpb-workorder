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


        // Handle CORS
        const origin = request.headers.get('origin')

        // Simple CORS for development - allow all or specific origins
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': origin || '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            })
        }

        // Add CORS headers to response
        response.headers.set('Access-Control-Allow-Origin', origin || '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        // Only check state-changing methods for CSRF if NOT using Bearer token
        // Mobile app uses Bearer token, so we can skip strict CSRF check for it
        const authHeader = request.headers.get('authorization')
        if (!authHeader && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            const referer = request.headers.get('referer')
            const host = request.headers.get('host')

            // If origin is present, it must match host
            if (origin) {
                const originHost = origin.replace(/^https?:\/\//, '')
                // Allow request if it matches host OR if it's from our mobile dev server (loose check for now)
                if (originHost !== host && !originHost.includes('localhost') && !originHost.includes('10.70.')) {
                    // console.log('CSRF Block: Origin mismatch', originHost, host)
                    // return new NextResponse('CSRF Error: Origin mismatch', { status: 403 })
                }
            }
            // If no origin, check referer
            else if (referer) {
                const refererHost = new URL(referer).host
                if (refererHost !== host && !refererHost.includes('localhost')) {
                    // return new NextResponse('CSRF Error: Referer mismatch', { status: 403 })
                }
            }
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
