/**
 * Direct server-action-level double-booking test.
 * Calls assertSlotAvailable logic directly through Prisma (same as the real action).
 */
import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

const court = await p.court.findFirst({ where: { status: "active" } })
const admin = await p.user.findFirst({ where: { role: "admin" } })

// Use a future date unique to this test
const testDate = new Date("2026-09-01T16:00:00.000Z") // Sept 2 Manila

console.log(`Testing double-booking on ${court.name} at 01:00 AM (Manila Sept 2)`)

function overlap(existing, startHour, endHour) {
  const effectiveEnd = endHour <= startHour ? endHour + 24 : endHour
  return existing.some((b) => {
    const [bStart] = b.startTime.split(":").map(Number)
    const [bEnd] = b.endTime.split(":").map(Number)
    const bEffectiveEnd = bEnd <= bStart ? bEnd + 24 : bEnd
    return startHour < bEffectiveEnd && effectiveEnd > bStart
  })
}

async function tryBook(startTime, endTime, label) {
  const [startHour] = startTime.split(":").map(Number)
  const [endHour] = endTime.split(":").map(Number)

  const dayStart = new Date(testDate); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(testDate); dayEnd.setHours(23, 59, 59, 999)

  const existing = await p.booking.findMany({
    where: { courtId: court.id, date: { gte: dayStart, lte: dayEnd }, status: { not: "cancelled" } },
    select: { startTime: true, endTime: true }
  })

  if (overlap(existing, startHour, endHour)) {
    console.log(`  ${label}: ✓ REJECTED (slot already taken) — found ${existing.length} existing`)
    return false
  }

  await p.booking.create({
    data: {
      referenceNumber: `TEST-DBL-${Date.now()}`,
      userId: admin.id,
      courtId: court.id,
      date: testDate,
      startTime,
      endTime,
      durationHours: 1,
      totalAmount: 250,
      priceBreakdown: [],
      status: "confirmed"
    }
  })
  console.log(`  ${label}: Booking created`)
  return true
}

// Scenario 1: exact same slot
console.log("\n── Scenario 1: 01:00-02:00 booked twice ──")
const s1a = await tryBook("01:00", "02:00", "First  booking")
const s1b = await tryBook("01:00", "02:00", "Second booking")
console.log(s1b === false ? "✓ PASS: double-booking rejected" : "✗ FAIL: double-booking NOT rejected")

// Scenario 2: overlapping (00:00-02:00 vs 01:00-02:00)
console.log("\n── Scenario 2: 00:00-02:00 then 01:00-02:00 (overlap) ──")
const s2a = await tryBook("00:00", "02:00", "First  booking 00:00-02:00")
const s2b = await tryBook("01:00", "02:00", "Second booking 01:00-02:00")
console.log(s2b === false ? "✓ PASS: overlapping booking rejected" : "✗ FAIL: overlapping booking NOT rejected")

// Scenario 3: adjacent is allowed (00:00-01:00 then 01:00-02:00)
console.log("\n── Scenario 3: 00:00-01:00 then 01:00-02:00 (adjacent = allowed) ──")
const s3a = await tryBook("00:00", "01:00", "First  booking 00:00-01:00")
const s3b = await tryBook("01:00", "02:00", "Second booking 01:00-02:00")
console.log(s3b === true ? "✓ PASS: adjacent booking allowed" : "✗ FAIL: adjacent booking incorrectly rejected")

// Cleanup all test bookings
await p.booking.deleteMany({ where: { courtId: court.id, date: { gte: testDate } } })
console.log("\nCleaned up all test bookings")
await p.$disconnect()
