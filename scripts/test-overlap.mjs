import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

// Simulate what assertSlotAvailable does for a 1:00 AM slot on "today" (July 2 Manila)
// input.date is what the client sends: new Date() from addDays(currentDate,1) in Manila
// That's July 2 Manila = July 1 16:00 UTC (approx, depends on exact time)

const inputDate = new Date("2026-07-01T16:00:00.000Z") // July 2 Manila midnight as sent by client

console.log("input.date:", inputDate.toISOString())

const dayStart = new Date(inputDate)
dayStart.setHours(0, 0, 0, 0)
const dayEnd = new Date(inputDate)
dayEnd.setHours(23, 59, 59, 999)

console.log("dayStart (server UTC setHours):", dayStart.toISOString())
console.log("dayEnd   (server UTC setHours):", dayEnd.toISOString())

// What's actually in the DB for court 1 bookings at 1:00 AM?
const allBookings = await p.booking.findMany({
  where: { startTime: "01:00" },
  select: { referenceNumber: true, date: true, startTime: true, endTime: true, courtId: true }
})
console.log("\nAll 1:00 AM bookings in DB:")
for (const b of allBookings) {
  console.log(`  ${b.referenceNumber}: date=${b.date.toISOString()} start=${b.startTime} end=${b.endTime}`)
}

// Now test what the range query finds
const courts = await p.court.findMany({ take: 1, select: { id: true, name: true } })
const courtId = courts[0].id

const found = await p.booking.findMany({
  where: {
    courtId,
    date: { gte: dayStart, lte: dayEnd },
    status: { not: "cancelled" }
  },
  select: { referenceNumber: true, date: true, startTime: true, endTime: true }
})
console.log(`\nBookings found by assertSlotAvailable range query for court ${courts[0].name}:`, found.length)
for (const b of found) {
  console.log(`  ${b.referenceNumber}: ${b.date.toISOString()} ${b.startTime}-${b.endTime}`)
}

await p.$disconnect()
