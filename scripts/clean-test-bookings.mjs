import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
const r = await p.booking.deleteMany({
  where: { user: { username: { startsWith: "guest_" } } }
})
console.log("Deleted", r.count, "guest bookings")
await p.$disconnect()
