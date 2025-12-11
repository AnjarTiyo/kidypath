import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

  // If user is not logged in and not on auth page, redirect to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If user is logged in and on auth page, redirect to home
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
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
