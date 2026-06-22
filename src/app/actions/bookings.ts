"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { requireUser, requireStaff } from "@/lib/authz"
import { calculatePrice } from "./settings"

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

async function assertSlotAvailable(input: BookingInput) {
  const existing = await prisma.booking.findMany({
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

  const priced = await priceBooking(data)
  await assertSlotAvailable(data)

  const booking = await prisma.booking.create({
    data: {
      referenceNumber: generateReferenceNumber(),
      userId: session.user.id,
      courtId: data.courtId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: priced.durationHours,
      totalAmount: priced.totalAmount,
      priceBreakdown: priced.priceBreakdown,
      status: "pending",
    },
  })

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: session.user.id,
      amount: priced.totalAmount,
      status: "pending",
    },
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

  const createdBookings = []

  for (const data of bookings) {
    const priced = await priceBooking(data)
    await assertSlotAvailable(data)

    const booking = await prisma.booking.create({
      data: {
        referenceNumber: generateReferenceNumber(),
        userId: session.user.id,
        courtId: data.courtId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationHours: priced.durationHours,
        totalAmount: priced.totalAmount,
        priceBreakdown: priced.priceBreakdown,
        status: "pending",
      },
    })

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: session.user.id,
        amount: priced.totalAmount,
        status: "pending",
      },
    })

    createdBookings.push(booking)
  }

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

export async function getAllBookings() {
  await requireStaff()

  const bookings = await prisma.booking.findMany({
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

  const priced = await priceBooking(data)
  await assertSlotAvailable(data)

  let userId = data.userId

  // If no existing user, create a guest user for walk-in
  if (!userId && data.guestName) {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const guestUser = await prisma.user.create({
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

  const booking = await prisma.booking.create({
    data: {
      referenceNumber: generateReferenceNumber(),
      userId,
      courtId: data.courtId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: priced.durationHours,
      totalAmount: priced.totalAmount,
      priceBreakdown: priced.priceBreakdown,
      status: "pending",
    },
  })

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId,
      amount: priced.totalAmount,
      status: "pending",
    },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/my-bookings")
  return booking
}
