"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { requireAdmin, requireStaff } from "@/lib/authz"

export async function searchUsers(query: string) {
  await requireStaff()
  if (!query.trim() || query.trim().length < 2) return []
  const q = query.trim()
  const users = await prisma.user.findMany({
    where: {
      role: "customer",
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  })
  return users
}

export async function getAllUsers() {
  await requireAdmin()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return users
}

export async function createUser(data: {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: "customer" | "staff" | "admin"
}) {
  await requireAdmin()
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
  })

  if (existingUser) {
    throw new Error("User with this username or email already exists")
  }

  const passwordHash = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      role: data.role,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  })

  revalidatePath("/admin/users")
  return user
}

export async function updateUserRole(userId: string, role: "customer" | "staff" | "admin") {
  await requireAdmin()
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      username: true,
      role: true,
    },
  })

  revalidatePath("/admin/users")
  return user
}

export async function toggleUserStatus(userId: string) {
  await requireAdmin()
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  const newStatus = currentUser.status === "active" ? "inactive" : "active"

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
    select: {
      id: true,
      username: true,
      status: true,
    },
  })

  revalidatePath("/admin/users")
  return user
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()
  const passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  revalidatePath("/admin/users")
  return { success: true }
}
