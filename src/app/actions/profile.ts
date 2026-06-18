"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getProfile() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
  })

  return user
}

export async function updateProfile(data: {
  firstName: string
  lastName: string
  email: string
  phone?: string
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    },
  })

  revalidatePath("/profile")
  return user
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect")
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newPasswordHash },
  })

  return { success: true }
}
