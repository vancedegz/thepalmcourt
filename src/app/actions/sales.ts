"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireStaff } from "@/lib/authz"
import { z } from "zod"

const singleSaleSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be non-negative"),
  customerName: z.string().min(1, "Customer name is required").max(120),
  customerPhone: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

const batchSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().nonnegative(),
      })
    )
    .min(1, "Cart is empty"),
  customerName: z.string().min(1, "Customer name is required").max(120),
  customerPhone: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

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
  const parsed = singleSaleSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid sale data")
  }
  const { productId, quantity, unitPrice, customerName, customerPhone, notes } = parsed.data
  const totalPrice = unitPrice * quantity

  const sale = await prisma.$transaction(async (tx) => {
    // Lock the product row by reading it inside the transaction
    const product = await tx.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new Error("Product not found")
    }

    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} units available in stock`)
    }

    const created = await tx.sale.create({
      data: {
        productId,
        quantity,
        unitPrice,
        totalPrice,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        notes: notes?.trim() || null,
      },
    })

    // Decrease stock
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    })

    return created
  })

  revalidatePath("/admin/pos")
  revalidatePath("/admin/pos/history")
  return sale
}

export async function cancelSale(saleId: string) {
  await requireStaff()

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
    })

    if (!sale) {
      throw new Error("Sale not found")
    }

    if (sale.status === "cancelled") {
      throw new Error("Sale is already cancelled")
    }

    await tx.sale.update({
      where: { id: saleId },
      data: { status: "cancelled" },
    })

    // Restore stock
    await tx.product.update({
      where: { id: sale.productId },
      data: { stock: { increment: sale.quantity } },
    })
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

  const parsed = batchSaleSchema.safeParse({
    items,
    customerName,
    customerPhone,
    notes,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid sale data")
  }

  await prisma.$transaction(async (tx) => {
    // Validate all items have enough stock first (with row locks via tx)
    for (const item of parsed.data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { name: true, stock: true },
      })
      if (!product) throw new Error("Product not found")
      if (product.stock < item.quantity) {
        throw new Error(`${product.name}: only ${product.stock} units available`)
      }
    }

    // Create all sales and deduct stock
    for (const item of parsed.data.items) {
      const totalPrice = item.unitPrice * item.quantity
      await tx.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
          customerName: parsed.data.customerName.trim(),
          customerPhone: parsed.data.customerPhone?.trim() || null,
          notes: parsed.data.notes?.trim() || null,
        },
      })
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }
  })

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
