"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { getBusinessSettings } from "@/app/actions/settings"
import { SITE } from "@/lib/constants"
import type { BusinessSettings } from "@prisma/client"

interface BusinessSettingsContextValue {
  settings: Pick<BusinessSettings, "name" | "logoUrl" | "email" | "phone" | "address" | "openingTime" | "closingTime" | "timezone" | "defaultPricePerHour" | "bookingRules" | "paymentInstructions" | "bankDetails"> | null
  loading: boolean
}

const BusinessSettingsContext = createContext<BusinessSettingsContextValue>({
  settings: null,
  loading: true,
})

export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettingsContextValue["settings"]>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getBusinessSettings()
        if (!cancelled && data) {
          setSettings({
            name: data.name,
            logoUrl: data.logoUrl,
            email: data.email,
            phone: data.phone,
            address: data.address,
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            timezone: data.timezone,
            defaultPricePerHour: data.defaultPricePerHour,
            bookingRules: data.bookingRules,
            paymentInstructions: data.paymentInstructions,
            bankDetails: data.bankDetails,
          })
        }
      } catch {
        // fallback to SITE constants via the hook
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <BusinessSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </BusinessSettingsContext.Provider>
  )
}

export function useBusinessSettings() {
  const ctx = useContext(BusinessSettingsContext)
  const name = ctx.settings?.name ?? SITE.name
  const logoUrl = ctx.settings?.logoUrl ?? SITE.logoUrl
  const timezone = ctx.settings?.timezone ?? SITE.defaultTimezone
  return {
    ...ctx,
    name,
    logoUrl,
    timezone,
  }
}
