import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
const customers = await p.user.findMany({ where: { role: "customer" }, select: { username: true, firstName: true, email: true, passwordHash: true } })
console.log("Customer users:", customers)
await p.$disconnect()
