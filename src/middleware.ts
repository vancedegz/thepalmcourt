import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Protect /admin routes - only admin and staff
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.redirect(new URL("/book", request.url))
    }
  }

  // Protect /book and /my-bookings routes - authenticated users only
  if (pathname.startsWith("/book") || pathname.startsWith("/my-bookings") || pathname.startsWith("/profile")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/book/:path*", "/my-bookings/:path*", "/profile/:path*"]
}
