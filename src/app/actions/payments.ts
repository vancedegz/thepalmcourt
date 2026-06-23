"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function uploadPaymentScreenshot(bookingId: string, screenshotUrl: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  })

  if (!booking) {
    throw new Error("Booking not found")
  }

  if (booking.userId !== session.user.id) {
    throw new Error("Forbidden")
  }

  const payment = booking.payments[0]
  if (!payment) {
    throw new Error("Payment not found")
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { screenshotUrl },
  })

  revalidatePath("/my-bookings")
  return { success: true }
}

export async function verifyPayment(paymentId: string, approved: boolean, adminNotes?: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Only administrators can verify payments")
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: approved ? "verified" : "rejected",
        adminNotes,
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
      },
    })

    // Update booking status if payment is verified
    if (approved) {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "confirmed" },
      })
    }

    return payment
  })

  revalidatePath("/admin/payments")
  revalidatePath("/admin/bookings")
  return result
}

export async function getPendingPayments() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Unauthorized")
  }

  const payments = await prisma.payment.findMany({
    where: { status: "pending" },
    include: {
      booking: {
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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return payments
}

export async function getAllPayments(page = 1, pageSize = 20) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Unauthorized")
  }

  const skip = Math.max(0, (page - 1) * pageSize)
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      include: {
        booking: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.payment.count(),
  ])

  return { payments, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
