import { auth } from "@/lib/auth"
import type { Session } from "next-auth"

export async function requireUser(): Promise<Session> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireStaff(): Promise<Session> {
  const session = await requireUser()
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Forbidden")
  }
  return session
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireUser()
  if (session.user.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}
