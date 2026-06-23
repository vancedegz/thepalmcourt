"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireStaff } from "@/lib/authz"
import { productSchema } from "@/lib/validation"

export async function getAllProducts() {
  await requireStaff()
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  })
  return products
}

export async function createProduct(data: {
  name: string
  description?: string
  price: number
  type: "sale" | "rent"
  imageUrl?: string
  stock: number
}) {
  await requireStaff()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product data")
  }
  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      type: parsed.data.type,
      imageUrl: parsed.data.imageUrl || null,
      stock: parsed.data.stock ?? 0,
    },
  })
  revalidatePath("/admin/pos")
  return product
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string
    description?: string
    price?: number
    type?: "sale" | "rent"
    imageUrl?: string
    stock?: number
    isActive?: boolean
  }
) {
  await requireStaff()
  const parsed = productSchema.partial().safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product data")
  }
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      type: parsed.data.type,
      imageUrl: parsed.data.imageUrl,
      stock: parsed.data.stock,
      isActive: data.isActive,
    },
  })
  revalidatePath("/admin/pos")
  return product
}

export async function deleteProduct(productId: string) {
  await requireStaff()
  await prisma.product.delete({
    where: { id: productId },
  })
  revalidatePath("/admin/pos")
  return { success: true }
}

export async function toggleProductStatus(productId: string) {
  await requireStaff()
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { isActive: true },
  })

  if (!product) {
    throw new Error("Product not found")
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  })

  revalidatePath("/admin/pos")
  return updated
}
