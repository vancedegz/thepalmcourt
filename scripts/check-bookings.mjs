import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
const bookings = await p.booking.findMany({
  orderBy: { createdAt: "desc" },
  take: 10,
  include: { court: true, user: { select: { firstName: true, lastName: true, username: true } } }
})
console.log("Total recent bookings:", bookings.length)
for (const b of bookings) {
  console.log({
    ref: b.referenceNumber,
    date: b.date.toISOString().split("T")[0],
    start: b.startTime,
    end: b.endTime,
    court: b.court.name,
    user: b.user.firstName + " " + b.user.lastName + " (" + b.user.username + ")",
    status: b.status,
    created: b.createdAt.toISOString()
  })
}
await p.$disconnect()
