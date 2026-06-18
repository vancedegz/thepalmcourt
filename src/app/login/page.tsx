"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PublicLayout from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, User, Lock } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid username or password")
      } else {
        // Redirect based on user role
        const session = await fetch("/api/auth/session").then(res => res.json())
        if (session?.user?.role === "admin" || session?.user?.role === "staff") {
          router.push("/admin")
        } else {
          router.push("/book")
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#e8f5e9] via-white to-[#fff7ed]">
        <Card className="w-full max-w-md border-2 border-primary/10 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <CardHeader className="text-center pt-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-primary/20 p-1 shadow-lg">
                <img
                  src="https://hyrwy9xec9.ufs.sh/f/0efuR0hwb0QyWwEIYatMroMZ2QKbfuBX34Y5cNptxEj6a9DR"
                  alt="The Palm Court"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-[#16a34a]">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your The Palm Court account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#16a34a]" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-primary/20 focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#16a34a]" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-primary/20 focus:border-primary focus:ring-primary"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all py-6" disabled={isLoading}>
                <LogIn className="h-5 w-5 mr-2" />
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-[#16a34a] font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
              <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="font-semibold mb-2 text-gray-700">Test Credentials:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-medium text-[#16a34a]">admin</p>
                    <p className="text-[10px]">admin123</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#f97316]">staff</p>
                    <p className="text-[10px]">staff123</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#0a7c32]">customer</p>
                    <p className="text-[10px]">customer123</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
