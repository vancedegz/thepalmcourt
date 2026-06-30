import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

// Fix any booking with endTime "24:00" -> "00:00"
const bad = await p.booking.findMany({ where: { endTime: "24:00" } })
console.log("Bookings with endTime 24:00:", bad.length)
for (const b of bad) {
  await p.booking.update({ where: { id: b.id }, data: { endTime: "00:00" } })
  console.log(`Fixed ${b.referenceNumber}: endTime 24:00 -> 00:00`)
}

// Also show what's currently in DB
const all = await p.booking.findMany({
  orderBy: { createdAt: "desc" }, take: 10,
  select: { referenceNumber: true, date: true, startTime: true, endTime: true, status: true }
})
console.log("\nAll recent bookings:")
for (const b of all) {
  const dateManila = new Date(b.date).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "short", timeStyle: "short" })
  console.log(`${b.referenceNumber}: manila=${dateManila} start=${b.startTime} end=${b.endTime} status=${b.status}`)
}
await p.$disconnect()
