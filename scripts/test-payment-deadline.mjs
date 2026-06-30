import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

const customer = await p.user.findFirst({ where: { role: "customer" } })
const court = await p.court.findFirst({ where: { status: "active" } })

const testDate = new Date("2026-10-01T08:00:00.000Z")
const deadline = new Date(Date.now() + 15 * 60 * 1000)

const booking = await p.booking.create({
  data: {
    referenceNumber: `TEST-DEADLINE-${Date.now()}`,
    userId: customer.id,
    courtId: court.id,
    date: testDate,
    startTime: "10:00",
    endTime: "11:00",
    durationHours: 1,
    totalAmount: 250,
    priceBreakdown: [],
    status: "pending",
    paymentDeadline: deadline,
  },
})

console.log("Created booking:", booking.referenceNumber)
console.log("paymentDeadline:", booking.paymentDeadline?.toISOString())
console.log("Matches expected ~15 min:", Math.abs(booking.paymentDeadline.getTime() - deadline.getTime()) < 2000)

// Cleanup
await p.booking.delete({ where: { id: booking.id } })
console.log("Cleaned up")
await p.$disconnect()
