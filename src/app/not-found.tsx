import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/constants"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f5e9] via-white to-[#fff7ed] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-7xl font-bold text-[#16a34a]">404</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <Button className="bg-[#16a34a] hover:bg-[#0e8c3a] text-white">
            Back to {SITE.name}
          </Button>
        </Link>
      </div>
    </div>
  )
}
