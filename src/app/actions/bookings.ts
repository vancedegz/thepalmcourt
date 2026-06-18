"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"

export async function createBooking(data: {
  courtId: string
  date: Date
  startTime: string
  endTime: string
  durationHours: number
  totalAmount: number
  priceBreakdown: any[]
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Generate reference number
  const dateStr = format(new Date(), "yyyyMMdd")
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const referenceNumber = `PB-${dateStr}-${randomNum}`

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      referenceNumber,
      userId: session.user.id,
      courtId: data.courtId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      totalAmount: data.totalAmount,
      priceBreakdown: data.priceBreakdown,
      status: "pending",
    },
  })

  // Create payment record
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: session.user.id,
      amount: data.totalAmount,
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
    priceBreakdown: any[]
  }[]
) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const createdBookings = []

  for (const data of bookings) {
    const dateStr = format(new Date(), "yyyyMMdd")
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const referenceNumber = `PB-${dateStr}-${randomNum}`

    const booking = await prisma.booking.create({
      data: {
        referenceNumber,
        userId: session.user.id,
        courtId: data.courtId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationHours: data.durationHours,
        totalAmount: data.totalAmount,
        priceBreakdown: data.priceBreakdown,
        status: "pending",
      },
    })

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: session.user.id,
        amount: data.totalAmount,
        status: "pending",
      },
    })

    createdBookings.push(booking)
  }

  revalidatePath("/my-bookings")
  return createdBookings
}

export async function cancelBooking(bookingId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Only admin/staff can cancel bookings
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Only administrators can cancel bookings")
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/my-bookings")
}

export async function getMyBookings() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

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
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Unauthorized")
  }

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
  priceBreakdown: any[]
  userId?: string
  guestName?: string
  guestPhone?: string
}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
    throw new Error("Unauthorized")
  }

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

  // Generate reference number
  const dateStr = format(new Date(), "yyyyMMdd")
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const referenceNumber = `PB-${dateStr}-${randomNum}`

  const booking = await prisma.booking.create({
    data: {
      referenceNumber,
      userId,
      courtId: data.courtId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      totalAmount: data.totalAmount,
      priceBreakdown: data.priceBreakdown,
      status: "pending",
    },
  })

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId,
      amount: data.totalAmount,
      status: "pending",
    },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/my-bookings")
  return booking
}
