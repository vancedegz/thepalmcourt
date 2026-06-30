import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
const u = await p.user.findUnique({ where: { username: "customer" }, select: { status: true, role: true, passwordHash: true } })
console.log(u)
await p.$disconnect()
