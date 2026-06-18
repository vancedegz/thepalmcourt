"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-gray-900 sticky top-0 z-40 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src="https://hyrwy9xec9.ufs.sh/f/0efuR0hwb0QyWwEIYatMroMZ2QKbfuBX34Y5cNptxEj6a9DR"
                  alt="The Palm Court"
                  className="h-9 w-9 sm:h-12 sm:w-12 object-contain"
                />
                <span className="text-lg sm:text-xl font-bold text-[#16a34a]">The Palm Court</span>
              </Link>
            </div>
            {/* Desktop nav */}
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-[#4ade80]">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#16a34a] hover:bg-[#0e8c3a] text-white">Sign Up</Button>
              </Link>
            </div>
            {/* Mobile hamburger */}
            <div className="sm:hidden">
              <Button variant="ghost" size="sm" className="text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-700 bg-gray-800 px-4 py-3 space-y-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white hover:text-[#4ade80]">Login</Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full justify-start bg-[#16a34a] text-white">Sign Up</Button>
            </Link>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </div>
  )
}
