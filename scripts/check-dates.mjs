import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

// Show raw date values from DB
const bookings = await p.booking.findMany({
  orderBy: { createdAt: "desc" },
  take: 5,
  select: { referenceNumber: true, date: true, startTime: true, endTime: true, status: true }
})

console.log("=== Raw DB dates (UTC) ===")
for (const b of bookings) {
  console.log(`${b.referenceNumber}: date=${b.date.toISOString()} start=${b.startTime} end=${b.endTime} status=${b.status}`)
}

// Simulate what the calendar day view queries when viewing July 2 Manila
// In Manila (UTC+8), July 2 00:00 = July 1 16:00 UTC
const july2Manila = new Date("2026-07-02T00:00:00+08:00")
const july2ManilaEnd = new Date("2026-07-02T23:59:59+08:00")
console.log("\n=== Calendar query for July 2 Manila ===")
console.log("start (UTC):", july2Manila.toISOString())
console.log("end   (UTC):", july2ManilaEnd.toISOString())

const found = await p.booking.findMany({
  where: {
    date: { gte: july2Manila, lte: july2ManilaEnd },
    status: { not: "cancelled" }
  },
  select: { referenceNumber: true, date: true, startTime: true }
})
console.log("Bookings found for July 2 Manila:", found.length)
for (const b of found) {
  console.log(` - ${b.referenceNumber}: ${b.date.toISOString()} ${b.startTime}`)
}

// Simulate July 1 Manila
const july1Manila = new Date("2026-07-01T00:00:00+08:00")
const july1ManilaEnd = new Date("2026-07-01T23:59:59+08:00")
console.log("\n=== Calendar query for July 1 Manila ===")
console.log("start (UTC):", july1Manila.toISOString())
console.log("end   (UTC):", july1ManilaEnd.toISOString())

const found1 = await p.booking.findMany({
  where: {
    date: { gte: july1Manila, lte: july1ManilaEnd },
    status: { not: "cancelled" }
  },
  select: { referenceNumber: true, date: true, startTime: true }
})
console.log("Bookings found for July 1 Manila:", found1.length)
for (const b of found1) {
  console.log(` - ${b.referenceNumber}: ${b.date.toISOString()} ${b.startTime}`)
}

await p.$disconnect()
