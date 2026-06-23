import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  // Protect /admin routes - only admin and staff
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.redirect(new URL("/book", req.url))
    }
  }

  // Protect /book, /my-bookings, /profile routes - authenticated users only
  if (
    pathname.startsWith("/book") ||
    pathname.startsWith("/my-bookings") ||
    pathname.startsWith("/profile")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/book/:path*", "/my-bookings/:path*", "/profile/:path*"],
}
