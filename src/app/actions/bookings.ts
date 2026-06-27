"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { requireUser, requireStaff } from "@/lib/authz"
import { calculatePrice } from "./settings"
import type { Prisma } from "@prisma/client"
import { createBookingSchema, createAdminBookingSchema } from "@/lib/validation"

type PriceBreakdownItem = { hour: string; price: number; tier: string }

type BookingInput = {
  courtId: string
  date: Date
  startTime: string
  endTime: string
}

function generateReferenceNumber() {
  const dateStr = format(new Date(), "yyyyMMdd")
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `PB-${dateStr}-${randomNum}`
}

async function priceBooking(input: BookingInput) {
  const [startHour] = input.startTime.split(":").map(Number)
  const [endHour] = input.endTime.split(":").map(Number)
  const durationHours = endHour - startHour
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    throw new Error("Invalid time range")
  }
  const { totalAmount, priceBreakdown } = await calculatePrice(
    input.startTime,
    input.endTime,
    input.date
  )
  return { durationHours, totalAmount, priceBreakdown }
}

async function assertSlotAvailable(
  tx: Prisma.TransactionClient,
  input: BookingInput
) {
  const existing = await tx.booking.findMany({
    where: { courtId: input.courtId, date: input.date, status: { not: "cancelled" } },
    select: { startTime: true, endTime: true },
  })
  // Zero-padded "HH:00" strings compare correctly lexicographically.
  const overlaps = existing.some(
    (b) => input.startTime < b.endTime && input.endTime > b.startTime
  )
  if (overlaps) {
    throw new Error("Selected time slot is no longer available")
  }
}

async function createBookingWithPayment(
  tx: Prisma.TransactionClient,
  data: BookingInput & {
    userId: string
    status?: "pending" | "confirmed"
  }
) {
  const priced = await priceBooking(data)
  await assertSlotAvailable(tx, data)

  const booking = await tx.booking.create({
    data: {
      referenceNumber: generateReferenceNumber(),
      userId: data.userId,
      courtId: data.courtId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: priced.durationHours,
      totalAmount: priced.totalAmount,
      priceBreakdown: priced.priceBreakdown,
      status: data.status ?? "pending",
    },
  })

  await tx.payment.create({
    data: {
      bookingId: booking.id,
      userId: data.userId,
      amount: priced.totalAmount,
      status: "pending",
    },
  })

  return booking
}

export async function createBooking(data: {
  courtId: string
  date: Date
  startTime: string
  endTime: string
  durationHours: number
  totalAmount: number
  priceBreakdown: PriceBreakdownItem[]
}) {
  const session = await requireUser()

  const parsed = createBookingSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking data")
  }

  const booking = await prisma.$transaction(async (tx) => {
    return createBookingWithPayment(tx, {
      ...data,
      userId: session.user.id,
    })
  })

  revalidatePath("/my-bookings")
  return booking
}

export async function createMultipleBookings(
  bookings: {
    courtId: string
    date: Date
    startTime: string
    endTime: string
    durationHours: number
    totalAmount: number
    priceBreakdown: PriceBreakdownItem[]
  }[]
) {
  const session = await requireUser()

  for (const data of bookings) {
    const parsed = createBookingSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking data")
    }
  }

  const createdBookings = await prisma.$transaction(async (tx) => {
    const results = []
    for (const data of bookings) {
      const booking = await createBookingWithPayment(tx, {
        ...data,
        userId: session.user.id,
      })
      results.push(booking)
    }
    return results
  })

  revalidatePath("/my-bookings")
  return createdBookings
}

export async function cancelBooking(bookingId: string) {
  await requireStaff()

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/my-bookings")
}

export async function confirmBooking(bookingId: string) {
  await requireStaff()

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "confirmed" },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/admin/calendar")
  revalidatePath("/my-bookings")
}

export async function getMyBookings() {
  const session = await requireUser()

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      court: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return bookings
}

export async function getAllBookings(page = 1, pageSize = 20) {
  await requireStaff()

  const skip = Math.max(0, (page - 1) * pageSize)
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: {
        court: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.booking.count(),
  ])

  return { bookings, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function getBookingsByDateRange(startDate: Date, endDate: Date) {
  await requireStaff()

  const bookings = await prisma.booking.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: "cancelled" },
    },
    include: {
      court: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      payments: true,
    },
    orderBy: { startTime: "asc" },
  })

  return bookings
}

export async function getAvailableSlots(courtId: string, date: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      courtId,
      date,
      status: { not: "cancelled" },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  })

  return bookings
}

export async function createAdminBooking(data: {
  courtId: string
  date: Date
  startTime: string
  endTime: string
  durationHours: number
  totalAmount: number
  priceBreakdown: PriceBreakdownItem[]
  userId?: string
  guestName?: string
  guestPhone?: string
}) {
  await requireStaff()

  const parsed = createAdminBookingSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking data")
  }

  const booking = await prisma.$transaction(async (tx) => {
    let userId = data.userId

    // If no existing user, create a guest user for walk-in
    if (!userId && data.guestName) {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const guestUser = await tx.user.create({
        data: {
          username: `guest_${timestamp}_${randomStr}`,
          email: `guest_${timestamp}@palm.court`,
          passwordHash: "guest",
          firstName: data.guestName.trim(),
          lastName: "",
          phone: data.guestPhone?.trim() || null,
          role: "customer",
        },
      })
      userId = guestUser.id
    }

    if (!userId) {
      throw new Error("Either select an existing user or enter a guest name")
    }

    return createBookingWithPayment(tx, {
      ...data,
      userId,
    })
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/my-bookings")
  return booking
}
