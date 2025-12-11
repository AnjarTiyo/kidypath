import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role
  const { pathname } = req.nextUrl

  // Public routes
  const isAuthPage = pathname.startsWith('/auth')
  const isUnauthorizedPage = pathname === '/unauthorized'

  // If user is not logged in and trying to access protected routes
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If user is logged in and on auth page, redirect to home
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Role-based access control
  if (isLoggedIn && !isAuthPage && !isUnauthorizedPage) {
    // Admin routes
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Teacher routes
    if (pathname.startsWith('/teacher') && userRole !== 'teacher') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Parent routes
    if (pathname.startsWith('/parent') && userRole !== 'parent') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
