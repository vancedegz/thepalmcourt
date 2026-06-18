import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      firstName: string
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    firstName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    firstName: string
  }
}
