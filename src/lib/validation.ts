import { z } from "zod"

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, underscores, dots, and hyphens"),
  email: z.string().email("Invalid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  phone: z.string().max(40).optional().or(z.literal("")),
})

export const bookingInputSchema = z.object({
  courtId: z.string().min(1, "Court is required"),
  date: z.coerce.date(),
  startTime: z
    .string()
    .regex(/^\d{2}:00$/, "Start time must be on the hour (HH:00)"),
  endTime: z
    .string()
    .regex(/^\d{2}:00$/, "End time must be on the hour (HH:00)"),
})

export const priceBreakdownItemSchema = z.object({
  hour: z.string(),
  price: z.number().nonnegative(),
  tier: z.string(),
})

export const createBookingSchema = bookingInputSchema.extend({
  durationHours: z.number().positive(),
  totalAmount: z.number().nonnegative(),
  priceBreakdown: z.array(priceBreakdownItemSchema).min(1),
})

export const createAdminBookingSchema = createBookingSchema.extend({
  userId: z.string().optional(),
  guestName: z.string().max(120).optional(),
  guestPhone: z.string().max(40).optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  price: z.coerce.number().nonnegative("Price must be a non-negative number"),
  type: z.enum(["sale", "rent"]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  stock: z.coerce.number().int().nonnegative().optional(),
})

export const pricingTierSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "Name is required").max(80),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
  pricePerHour: z.coerce.number().positive("Price per hour must be positive"),
  isActive: z.boolean(),
  daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
})

export const businessSettingsSchema = z.object({
  name: z.string().min(1, "Business name is required").max(120),
  logoUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required").max(40),
  address: z.string().min(1, "Address is required").max(300),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Opening time must be HH:MM"),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Closing time must be HH:MM"),
  timezone: z.string().min(1, "Timezone is required").max(60).default("Asia/Manila"),
  defaultPricePerHour: z.coerce.number().positive("Default price must be positive"),
  bookingRules: z.string().max(5000).optional().or(z.literal("")),
  paymentInstructions: z.string().max(5000).optional().or(z.literal("")),
  bankDetails: z.string().max(5000).optional().or(z.literal("")),
})

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  priceAtSale: z.coerce.number().nonnegative(),
})

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  customerName: z.string().max(120).optional().or(z.literal("")),
  customerPhone: z.string().max(40).optional().or(z.literal("")),
  paymentMethod: z.enum(["cash", "card", "gcash", "other"]),
  discount: z.coerce.number().nonnegative().optional(),
})

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  phone: z.string().max(40).optional().or(z.literal("")),
  role: z.enum(["customer", "staff", "admin"]),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CreateAdminBookingInput = z.infer<typeof createAdminBookingSchema>
export type ProductInput = z.infer<typeof productSchema>
export type PricingTierInput = z.infer<typeof pricingTierSchema>
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
