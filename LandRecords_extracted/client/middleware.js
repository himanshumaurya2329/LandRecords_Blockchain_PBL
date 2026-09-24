import { NextResponse } from 'next/server';
import { auth } from '@/utils/auth';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // API routes that need special handling
    const isApiRoute = pathname.startsWith('/api/');

    if (isApiRoute) {
        // Let API routes handle their own authentication
        return NextResponse.next();
    }

    if (!isPublicRoute) {
        // Check if user is authenticated
        if (!auth.isAuthenticated()) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Role-based route protection
        const user = auth.getUser();
        if (user) {
            // Org1 routes
            if (pathname.startsWith('/dashboard/user') && !auth.canCreateApplications()) {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }

            // Org2 routes
            if (pathname.startsWith('/dashboard/') && auth.isInOrg('org2') && !auth.canVerifyApplications()) {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }

            // Org3 routes
            if (pathname.startsWith('/dashboard/') && auth.isInOrg('org3') && !auth.canApproveApplications()) {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};