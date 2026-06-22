"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireStaff } from "@/lib/authz"

export async function getAllSales() {
  await requireStaff()
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
  })
  return sales
}

export async function createSale(data: {
  productId: string
  quantity: number
  unitPrice: number
  customerName: string
  customerPhone?: string
  notes?: string
}) {
  await requireStaff()
  const totalPrice = data.unitPrice * data.quantity

  // Deduct stock
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  })

  if (!product) {
    throw new Error("Product not found")
  }

  if (product.stock < data.quantity) {
    throw new Error(`Only ${product.stock} units available in stock`)
  }

  const sale = await prisma.sale.create({
    data: {
      productId: data.productId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      notes: data.notes || null,
    },
  })

  // Decrease stock
  await prisma.product.update({
    where: { id: data.productId },
    data: { stock: { decrement: data.quantity } },
  })

  revalidatePath("/admin/pos")
  revalidatePath("/admin/pos/history")
  return sale
}

export async function cancelSale(saleId: string) {
  await requireStaff()
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  })

  if (!sale) {
    throw new Error("Sale not found")
  }

  if (sale.status === "cancelled") {
    throw new Error("Sale is already cancelled")
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { status: "cancelled" },
  })

  // Restore stock
  await prisma.product.update({
    where: { id: sale.productId },
    data: { stock: { increment: sale.quantity } },
  })

  revalidatePath("/admin/pos")
  revalidatePath("/admin/pos/history")
  return { success: true }
}

export async function createBatchSales(
  items: {
    productId: string
    quantity: number
    unitPrice: number
  }[],
  customerName: string,
  customerPhone?: string,
  notes?: string
) {
  await requireStaff()
  if (!items.length) throw new Error("Cart is empty")
  if (!customerName.trim()) throw new Error("Customer name is required")

  // Validate all items have enough stock first
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { name: true, stock: true },
    })
    if (!product) throw new Error("Product not found")
    if (product.stock < item.quantity) {
      throw new Error(`${product.name}: only ${product.stock} units available`)
    }
  }

  // Create all sales and deduct stock
  for (const item of items) {
    const totalPrice = item.unitPrice * item.quantity
    await prisma.sale.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        notes: notes?.trim() || null,
      },
    })
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  revalidatePath("/admin/pos")
  revalidatePath("/admin/pos/history")
  return { success: true }
}

export async function getTodaySales() {
  await requireStaff()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
  })

  return sales
}
