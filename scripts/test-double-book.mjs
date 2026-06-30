import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

const court = await p.court.findFirst({ where: { status: "active" } })
console.log("Testing on court:", court.name, court.id)

// Use a date far in the future to avoid conflicts with existing bookings
const testDate = new Date("2026-08-15T16:00:00.000Z") // Aug 16 Manila

// First booking: 01:00-02:00 on Aug 16 Manila
const b1 = await p.booking.create({
  data: {
    referenceNumber: "TEST-OVERLAP-001",
    userId: (await p.user.findFirst({ where: { role: "admin" } })).id,
    courtId: court.id,
    date: testDate,
    startTime: "01:00",
    endTime: "02:00",
    durationHours: 1,
    totalAmount: 250,
    priceBreakdown: [],
    status: "confirmed"
  }
})
console.log("Created first booking:", b1.referenceNumber, b1.startTime, "-", b1.endTime)

// Now simulate assertSlotAvailable for same slot
const [startHour] = "01:00".split(":").map(Number)
const [endHour] = "02:00".split(":").map(Number)
const effectiveEnd = endHour <= startHour ? endHour + 24 : endHour

const dayStart = new Date(testDate)
dayStart.setHours(0, 0, 0, 0)
const dayEnd = new Date(testDate)
dayEnd.setHours(23, 59, 59, 999)

console.log("\ndayStart:", dayStart.toISOString())
console.log("dayEnd:  ", dayEnd.toISOString())

const existing = await p.booking.findMany({
  where: {
    courtId: court.id,
    date: { gte: dayStart, lte: dayEnd },
    status: { not: "cancelled" }
  },
  select: { startTime: true, endTime: true, referenceNumber: true }
})
console.log("Existing bookings found:", existing.length, existing.map(e => `${e.referenceNumber} ${e.startTime}-${e.endTime}`))

const overlaps = existing.some((b) => {
  const [bStart] = b.startTime.split(":").map(Number)
  const [bEnd] = b.endTime.split(":").map(Number)
  const bEffectiveEnd = bEnd <= bStart ? bEnd + 24 : bEnd
  const result = startHour < bEffectiveEnd && effectiveEnd > bStart
  console.log(`  Check ${b.startTime}-${b.endTime}: ${startHour} < ${bEffectiveEnd} && ${effectiveEnd} > ${bStart} = ${result}`)
  return result
})

console.log("\nOverlap detected:", overlaps)
if (overlaps) {
  console.log("✓ CORRECT: Double booking would be rejected")
} else {
  console.log("✗ BUG: Double booking would slip through!")
}

// Cleanup
await p.booking.delete({ where: { id: b1.id } })
console.log("\nCleaned up test booking")
await p.$disconnect()
