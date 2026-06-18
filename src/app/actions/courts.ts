"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCourts() {
  const courts = await prisma.court.findMany({
    orderBy: { number: "asc" },
  })
  return courts
}

export async function getActiveCourts() {
  const courts = await prisma.court.findMany({
    where: { status: "active" },
    orderBy: { number: "asc" },
  })
  return courts
}

export async function upsertCourt(data: {
  id?: string
  name: string
  number: number
  description?: string
  status: "active" | "maintenance"
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("Only administrators can manage courts")
  }

  if (data.id) {
    const court = await prisma.court.update({
      where: { id: data.id },
      data: {
        name: data.name,
        number: data.number,
        description: data.description,
        status: data.status,
      },
    })
    revalidatePath("/admin/courts")
    return court
  } else {
    const court = await prisma.court.create({
      data: {
        name: data.name,
        number: data.number,
        description: data.description,
        status: data.status,
      },
    })
    revalidatePath("/admin/courts")
    return court
  }
}

export async function deleteCourt(courtId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "admin") {
    throw new Error("Only administrators can delete courts")
  }

  await prisma.court.delete({
    where: { id: courtId },
  })

  revalidatePath("/admin/courts")
}
