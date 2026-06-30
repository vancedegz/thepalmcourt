import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
const bookings = await p.booking.findMany({
  where: { startTime: "01:00", status: { not: "cancelled" } },
  orderBy: { createdAt: "desc" },
  select: { referenceNumber: true, date: true, startTime: true, endTime: true, courtId: true, createdAt: true }
})
console.log("01:00 bookings:", bookings.length)
for (const b of bookings) {
  console.log(`  ${b.referenceNumber} courtId=${b.courtId} date=${b.date.toISOString()} ${b.startTime}-${b.endTime} created=${b.createdAt.toISOString()}`)
}
await p.$disconnect()
