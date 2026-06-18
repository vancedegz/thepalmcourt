"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getBusinessSettings() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: 1 },
  })
  return settings
}

export async function updateBusinessSettings(data: {
  name: string
  logoUrl?: string
  email: string
  phone: string
  address: string
  openingTime: string
  closingTime: string
  defaultPricePerHour: number
  bookingRules?: string
  paymentInstructions?: string
  bankDetails?: string
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin") {
    throw new Error("Only administrators can update settings")
  }

  const settings = await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  })

  revalidatePath("/admin/settings")
  return settings
}

export async function getPricingTiers() {
  const tiers = await prisma.pricingTier.findMany({
    orderBy: { startTime: "asc" },
  })
  return tiers
}

export async function upsertPricingTier(data: {
  id?: number
  name: string
  startTime: string
  endTime: string
  pricePerHour: number
  isActive: boolean
  daysOfWeek: string[]
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin") {
    throw new Error("Only administrators can manage pricing")
  }

  if (data.id) {
    const tier = await prisma.pricingTier.update({
      where: { id: data.id },
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        pricePerHour: data.pricePerHour,
        isActive: data.isActive,
        daysOfWeek: data.daysOfWeek,
      },
    })
    revalidatePath("/admin/pricing")
    return tier
  } else {
    const tier = await prisma.pricingTier.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        pricePerHour: data.pricePerHour,
        isActive: data.isActive,
        daysOfWeek: data.daysOfWeek,
      },
    })
    revalidatePath("/admin/pricing")
    return tier
  }
}

export async function deletePricingTier(tierId: number) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin") {
    throw new Error("Only administrators can delete pricing tiers")
  }

  await prisma.pricingTier.delete({
    where: { id: tierId },
  })

  revalidatePath("/admin/pricing")
}

export async function calculatePrice(startTime: string, endTime: string, date: Date) {
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  
  const tiers = await prisma.pricingTier.findMany({
    where: {
      isActive: true,
      daysOfWeek: { has: dayOfWeek },
    },
  })

  const settings = await prisma.businessSettings.findUnique({
    where: { id: 1 },
  })

  const defaultPrice = settings?.defaultPricePerHour || 250

  // Parse times
  const [startHour] = startTime.split(":").map(Number)
  const [endHour] = endTime.split(":").map(Number)
  
  const priceBreakdown = []
  let totalAmount = 0

  for (let hour = startHour; hour < endHour; hour++) {
    const hourStr = `${hour.toString().padStart(2, "0")}:00`
    
    // Find matching tier
    const matchingTier = tiers.find((tier) => {
      const [tierStartHour] = tier.startTime.split(":").map(Number)
      const [tierEndHour] = tier.endTime.split(":").map(Number)
      return hour >= tierStartHour && hour < tierEndHour
    })

    const price = matchingTier?.pricePerHour || defaultPrice
    const tierName = matchingTier?.name || "Default"

    priceBreakdown.push({
      hour: hourStr,
      price,
      tier: tierName,
    })

    totalAmount += price
  }

  return { totalAmount, priceBreakdown }
}
