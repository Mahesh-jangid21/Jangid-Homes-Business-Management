import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isLoggedIn = !!token
    const isOnLoginPage = req.nextUrl.pathname === '/login'
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
    const isSetupRoute = req.nextUrl.pathname.startsWith('/api/setup')

    // Allow auth routes and setup route
    if (isAuthRoute || isSetupRoute) {
        return NextResponse.next()
    }

    // Protect API routes
    if (isApiRoute && !isLoggedIn) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    // Redirect to login if not authenticated
    if (!isLoggedIn && !isOnLoginPage) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect to home if already logged in and on login page
    if (isLoggedIn && isOnLoginPage) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)',
    ],
}
