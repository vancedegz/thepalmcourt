"use client"

import { SessionProvider } from "next-auth/react"
import { BusinessSettingsProvider } from "@/lib/business-settings-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BusinessSettingsProvider>{children}</BusinessSettingsProvider>
    </SessionProvider>
  )
}
