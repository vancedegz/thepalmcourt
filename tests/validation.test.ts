import { describe, it, expect } from "vitest"
import {
  registerSchema,
  createBookingSchema,
  productSchema,
  pricingTierSchema,
  businessSettingsSchema,
  createUserSchema,
  resetPasswordSchema,
} from "@/lib/validation"

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      username: "johndoe",
      email: "john@example.com",
      password: "Password1",
      firstName: "John",
      lastName: "Doe",
      phone: "+639171234567",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({
      username: "johndoe",
      email: "john@example.com",
      password: "abc1",
      firstName: "John",
      lastName: "Doe",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a password without an uppercase letter", () => {
    const result = registerSchema.safeParse({
      username: "johndoe",
      email: "john@example.com",
      password: "password1",
      firstName: "John",
      lastName: "Doe",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      username: "johndoe",
      email: "not-an-email",
      password: "Password1",
      firstName: "John",
      lastName: "Doe",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a username with invalid characters", () => {
    const result = registerSchema.safeParse({
      username: "john doe!",
      email: "john@example.com",
      password: "Password1",
      firstName: "John",
      lastName: "Doe",
    })
    expect(result.success).toBe(false)
  })
})

describe("createBookingSchema", () => {
  it("accepts a valid booking", () => {
    const result = createBookingSchema.safeParse({
      courtId: "court-1",
      date: new Date("2026-01-01"),
      startTime: "10:00",
      endTime: "12:00",
      durationHours: 2,
      totalAmount: 500,
      priceBreakdown: [{ hour: "10:00", price: 250, tier: "Morning" }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects a non-hourly start time", () => {
    const result = createBookingSchema.safeParse({
      courtId: "court-1",
      date: new Date("2026-01-01"),
      startTime: "10:30",
      endTime: "12:00",
      durationHours: 2,
      totalAmount: 500,
      priceBreakdown: [{ hour: "10:00", price: 250, tier: "Morning" }],
    })
    expect(result.success).toBe(false)
  })
})

describe("productSchema", () => {
  it("accepts a valid product", () => {
    const result = productSchema.safeParse({
      name: "Pickleball Paddle",
      description: "Premium paddle",
      price: 1500,
      type: "sale",
      imageUrl: "https://example.com/image.png",
      stock: 10,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a negative price", () => {
    const result = productSchema.safeParse({
      name: "Pickleball Paddle",
      price: -100,
      type: "sale",
      stock: 10,
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid product type", () => {
    const result = productSchema.safeParse({
      name: "Pickleball Paddle",
      price: 100,
      type: "subscription",
      stock: 10,
    })
    expect(result.success).toBe(false)
  })
})

describe("pricingTierSchema", () => {
  it("accepts a valid tier", () => {
    const result = pricingTierSchema.safeParse({
      name: "Morning",
      startTime: "06:00",
      endTime: "12:00",
      pricePerHour: 200,
      isActive: true,
      daysOfWeek: ["monday"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty daysOfWeek array", () => {
    const result = pricingTierSchema.safeParse({
      name: "Morning",
      startTime: "06:00",
      endTime: "12:00",
      pricePerHour: 200,
      isActive: true,
      daysOfWeek: [],
    })
    expect(result.success).toBe(false)
  })
})

describe("businessSettingsSchema", () => {
  it("accepts valid settings with timezone", () => {
    const result = businessSettingsSchema.safeParse({
      name: "The Palm Court",
      email: "info@example.com",
      phone: "+639171234567",
      address: "123 Main St",
      openingTime: "06:00",
      closingTime: "22:00",
      timezone: "Asia/Manila",
      defaultPricePerHour: 250,
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid time format", () => {
    const result = businessSettingsSchema.safeParse({
      name: "The Palm Court",
      email: "info@example.com",
      phone: "+639171234567",
      address: "123 Main St",
      openingTime: "6:00",
      closingTime: "22:00",
      defaultPricePerHour: 250,
    })
    expect(result.success).toBe(false)
  })
})

describe("createUserSchema", () => {
  it("accepts a valid admin user", () => {
    const result = createUserSchema.safeParse({
      username: "admin2",
      email: "admin2@example.com",
      password: "AdminPass1",
      firstName: "Admin",
      lastName: "Two",
      role: "admin",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid role", () => {
    const result = createUserSchema.safeParse({
      username: "admin2",
      email: "admin2@example.com",
      password: "AdminPass1",
      firstName: "Admin",
      lastName: "Two",
      role: "superadmin",
    })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("accepts a strong password", () => {
    const result = resetPasswordSchema.safeParse({ password: "StrongPass1" })
    expect(result.success).toBe(true)
  })

  it("rejects a password without a number", () => {
    const result = resetPasswordSchema.safeParse({ password: "StrongPass" })
    expect(result.success).toBe(false)
  })
})
