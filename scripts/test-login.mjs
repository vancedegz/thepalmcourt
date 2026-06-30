import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

const user = await p.user.findUnique({ where: { username: "customer" }, select: { passwordHash: true } })
if (!user) {
  console.log("User not found")
  process.exit(1)
}

for (const password of ["customer123", "password123", "password", "customer"]) {
  const match = await bcrypt.compare(password, user.passwordHash)
  console.log(`${password}: ${match}`)
}
await p.$disconnect()
