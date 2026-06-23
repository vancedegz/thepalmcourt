"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto border-2 border-red-100">
          <span className="text-2xl">!</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t complete this request. Please try again.
          </p>
        </div>
        <Button onClick={reset} className="bg-[#16a34a] hover:bg-[#0e8c3a] text-white">
          Try again
        </Button>
      </div>
    </div>
  )
}
