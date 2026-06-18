"use client"

import Link from "next/link"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, X } from "lucide-react"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-gray-900 sticky top-0 z-40 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/book" className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src="https://hyrwy9xec9.ufs.sh/f/0efuR0hwb0QyWwEIYatMroMZ2QKbfuBX34Y5cNptxEj6a9DR"
                  alt="The Palm Court"
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
                />
                <span className="text-lg sm:text-xl font-bold text-[#16a34a]">The Palm Court</span>
              </Link>
            </div>
            {/* Desktop nav */}
            <div className="flex items-center space-x-1">
              <Link href="/book">
                <Button variant="ghost" className="text-white hover:text-[#4ade80]">Book Court</Button>
              </Link>
              <Link href="/my-bookings">
                <Button variant="ghost" className="text-white hover:text-[#4ade80]">My Bookings</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="text-white hover:text-[#4ade80]">Profile</Button>
              </Link>
              {session && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1 text-white">
                        <Avatar className="h-8 w-8 border border-gray-600">
                          <AvatarFallback className="bg-gray-700 text-white text-sm font-bold">
                            {session.user.firstName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 shadow-lg" align="end">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-white">
                            {session.user.firstName}
                          </p>
                          <p className="w-[200px] truncate text-sm text-gray-300">
                            {session.user.email}
                          </p>
                          <Badge variant="secondary" className="w-fit">
                            {session.user.role}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-white hover:bg-gray-700"
                        onClick={() => signOut()}
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="border-red-400 text-red-400 hover:bg-red-900/30 hover:text-red-300 text-xs ml-1"
                  >
                    Sign Out
                  </Button>
                </>
              )}
            </div>
            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" className="text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800 px-4 py-3 space-y-2">
            <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white hover:text-[#4ade80]">Book Court</Button>
            </Link>
            <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white hover:text-[#4ade80]">My Bookings</Button>
            </Link>
            <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white hover:text-[#4ade80]">Profile</Button>
            </Link>
            {session && (
              <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300" onClick={() => { setMobileMenuOpen(false); signOut(); }}>
                Sign out
              </Button>
            )}
          </div>
        )}
      </nav>
      <main>{children}</main>
    </div>
  )
}
