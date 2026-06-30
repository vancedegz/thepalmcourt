/**
 * booking-logic.test.ts
 *
 * Pure-logic tests for the slot/pricing/calendar helpers — no database required.
 * We inline the same algorithms used in the server actions and client pages so
 * every scenario can be verified in isolation.
 */

import { describe, it, expect } from "vitest"
import { formatTime } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers inlined from src/app/actions/settings.ts  (calculatePrice core)
// ---------------------------------------------------------------------------

type PricingTier = {
  name: string
  startTime: string
  endTime: string
  pricePerHour: number
  isActive: boolean
  daysOfWeek: string[]
}

function calcPrice(
  startTime: string,
  endTime: string,
  date: Date,
  tiers: PricingTier[],
  defaultPrice = 250
) {
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const activeTiers = tiers.filter(
    (t) => t.isActive && t.daysOfWeek.includes(dayOfWeek)
  )

  const [startHour] = startTime.split(":").map(Number)
  const [endHour] = endTime.split(":").map(Number)
  const hourCount = endHour - startHour

  const priceBreakdown: { hour: string; price: number; tier: string }[] = []
  let totalAmount = 0

  for (let i = 0; i < hourCount; i++) {
    const hour = startHour + i
    const hourStr = `${hour.toString().padStart(2, "0")}:00`

    const matchingTier = activeTiers.find((tier) => {
      const [ts] = tier.startTime.split(":").map(Number)
      const [te] = tier.endTime.split(":").map(Number)
      return hour >= ts && hour < te
    })

    const price = matchingTier?.pricePerHour ?? defaultPrice
    const tierName = matchingTier?.name ?? "Default"
    priceBreakdown.push({ hour: hourStr, price, tier: tierName })
    totalAmount += price
  }

  return { totalAmount, priceBreakdown }
}

// ---------------------------------------------------------------------------
// Helpers inlined from server action — assertSlotAvailable core
// ---------------------------------------------------------------------------

type ExistingBooking = { startTime: string; endTime: string }

function hasOverlap(
  startTime: string,
  endTime: string,
  existing: ExistingBooking[]
): boolean {
  const [startHour] = startTime.split(":").map(Number)
  const [endHour] = endTime.split(":").map(Number)
  return existing.some((b) => {
    const [bStart] = b.startTime.split(":").map(Number)
    const [bEnd] = b.endTime.split(":").map(Number)
    return startHour < bEnd && endHour > bStart
  })
}

// ---------------------------------------------------------------------------
// Helpers inlined from client pages — isSlotBooked, isSlotPast, generateTimeSlots, consecutive check
// ---------------------------------------------------------------------------

type SlotBooking = { startTime: string; endTime: string }

function isSlotBooked(time: string, bookings: SlotBooking[]): boolean {
  const [hour] = time.split(":").map(Number)
  return bookings.some((b) => {
    const [bStart] = b.startTime.split(":").map(Number)
    const [bEnd] = b.endTime.split(":").map(Number)
    return hour >= bStart && hour < bEnd
  })
}

function generateTimeSlots(openingHour: number, closingHour: number): string[] {
  const count = closingHour - openingHour
  return Array.from({ length: count }, (_, i) => {
    const h = openingHour + i
    return `${h.toString().padStart(2, "0")}:00`
  })
}

function areConsecutive(times: string[]): boolean {
  const sorted = [...times].sort((a, b) => {
    const [ah] = a.split(":").map(Number)
    const [bh] = b.split(":").map(Number)
    return ah - bh
  })
  for (let i = 0; i < sorted.length - 1; i++) {
    const [cur] = sorted[i].split(":").map(Number)
    const [nxt] = sorted[i + 1].split(":").map(Number)
    if (nxt !== cur + 1) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Convenience date builders
// ---------------------------------------------------------------------------
const MON = new Date("2026-06-29T00:00:00") // Monday
const TUE = new Date("2026-06-30T00:00:00") // Tuesday
const SAT = new Date("2026-07-04T00:00:00") // Saturday
const SUN = new Date("2026-07-05T00:00:00") // Sunday

// ---------------------------------------------------------------------------
// ✦ SUITE 1 — formatTime utility
// ---------------------------------------------------------------------------
describe("formatTime", () => {
  it("formats midnight (00:00) as 12:00 AM", () => {
    expect(formatTime("00:00")).toBe("12:00 AM")
  })

  it("formats noon (12:00) as 12:00 PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM")
  })

  it("formats 06:00 as 6:00 AM", () => {
    expect(formatTime("06:00")).toBe("6:00 AM")
  })

  it("formats 13:00 as 1:00 PM", () => {
    expect(formatTime("13:00")).toBe("1:00 PM")
  })

  it("formats 23:00 as 11:00 PM", () => {
    expect(formatTime("23:00")).toBe("11:00 PM")
  })
})

// ---------------------------------------------------------------------------
// ✦ SUITE 2 — generateTimeSlots
// ---------------------------------------------------------------------------
describe("generateTimeSlots", () => {
  it("generates correct count for standard 06:00-22:00 schedule", () => {
    const slots = generateTimeSlots(6, 22)
    expect(slots).toHaveLength(16)
    expect(slots[0]).toBe("06:00")
    expect(slots[15]).toBe("21:00")
  })

  it("first slot is always the opening hour", () => {
    expect(generateTimeSlots(8, 18)[0]).toBe("08:00")
  })

  it("last slot is one hour before closing", () => {
    const slots = generateTimeSlots(6, 22)
    expect(slots[slots.length - 1]).toBe("21:00")
  })

  it("generates zero slots when opening equals closing", () => {
    expect(generateTimeSlots(22, 22)).toHaveLength(0)
  })

  it("generates a single slot for a 1-hour window", () => {
    const slots = generateTimeSlots(10, 11)
    expect(slots).toEqual(["10:00"])
  })

  it("generates correct slots for a 24-hour window", () => {
    const slots = generateTimeSlots(0, 24)
    expect(slots).toHaveLength(24)
    expect(slots[0]).toBe("00:00")
    expect(slots[23]).toBe("23:00")
  })
})

// ---------------------------------------------------------------------------
// ✦ SUITE 3 — isSlotBooked
// ---------------------------------------------------------------------------
describe("isSlotBooked", () => {
  const bookings: SlotBooking[] = [
    { startTime: "08:00", endTime: "10:00" },
    { startTime: "14:00", endTime: "16:00" },
  ]

  it("returns true for a slot at the start of a booking", () => {
    expect(isSlotBooked("08:00", bookings)).toBe(true)
  })

  it("returns true for a slot in the middle of a booking", () => {
    expect(isSlotBooked("09:00", bookings)).toBe(true)
  })

  it("returns false for a slot at the end hour (exclusive end)", () => {
    expect(isSlotBooked("10:00", bookings)).toBe(false)
  })

  it("returns false for a completely free slot", () => {
    expect(isSlotBooked("11:00", bookings)).toBe(false)
  })

  it("returns true for first hour of second booking", () => {
    expect(isSlotBooked("14:00", bookings)).toBe(true)
  })

  it("returns true for last occupied hour of second booking", () => {
    expect(isSlotBooked("15:00", bookings)).toBe(true)
  })

  it("returns false when there are no bookings", () => {
    expect(isSlotBooked("10:00", [])).toBe(false)
  })

  it("returns false for a slot just before a booking starts", () => {
    expect(isSlotBooked("07:00", bookings)).toBe(false)
  })

  it("handles a full-day single booking (00:00-24:00 equivalent)", () => {
    const fullDay: SlotBooking[] = [{ startTime: "06:00", endTime: "22:00" }]
    for (let h = 6; h < 22; h++) {
      expect(isSlotBooked(`${h.toString().padStart(2, "0")}:00`, fullDay)).toBe(true)
    }
    expect(isSlotBooked("05:00", fullDay)).toBe(false)
    expect(isSlotBooked("22:00", fullDay)).toBe(false)
  })

  it("handles adjacent bookings correctly (no gap)", () => {
    const adj: SlotBooking[] = [
      { startTime: "08:00", endTime: "10:00" },
      { startTime: "10:00", endTime: "12:00" },
    ]
    expect(isSlotBooked("09:00", adj)).toBe(true)
    expect(isSlotBooked("10:00", adj)).toBe(true)
    expect(isSlotBooked("11:00", adj)).toBe(true)
    expect(isSlotBooked("12:00", adj)).toBe(false)
  })

  it("handles single-hour bookings", () => {
    const single: SlotBooking[] = [{ startTime: "15:00", endTime: "16:00" }]
    expect(isSlotBooked("15:00", single)).toBe(true)
    expect(isSlotBooked("14:00", single)).toBe(false)
    expect(isSlotBooked("16:00", single)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ✦ SUITE 4 — hasOverlap (assertSlotAvailable core)
// ---------------------------------------------------------------------------
describe("hasOverlap", () => {
  const existing: ExistingBooking[] = [
    { startTime: "10:00", endTime: "12:00" },
    { startTime: "15:00", endTime: "17:00" },
  ]

  it("detects exact duplicate booking", () => {
    expect(hasOverlap("10:00", "12:00", existing)).toBe(true)
  })

  it("detects partial overlap at start", () => {
    expect(hasOverlap("09:00", "11:00", existing)).toBe(true)
  })

  it("detects partial overlap at end", () => {
    expect(hasOverlap("11:00", "13:00", existing)).toBe(true)
  })

  it("detects booking fully contained within existing", () => {
    expect(hasOverlap("10:30", "11:30", existing)).toBe(true) // hour-level: 10→11 → overlap
  })

  it("detects existing booking fully contained within new booking", () => {
    expect(hasOverlap("09:00", "13:00", existing)).toBe(true)
  })

  it("allows booking immediately after an existing one", () => {
    expect(hasOverlap("12:00", "14:00", existing)).toBe(false)
  })

  it("allows booking immediately before an existing one", () => {
    expect(hasOverlap("08:00", "10:00", existing)).toBe(false)
  })

  it("allows booking in the gap between two existing bookings", () => {
    expect(hasOverlap("12:00", "15:00", existing)).toBe(false)
  })

  it("allows booking after all existing bookings", () => {
    expect(hasOverlap("17:00", "19:00", existing)).toBe(false)
  })

  it("returns false when there are no existing bookings", () => {
    expect(hasOverlap("10:00", "12:00", [])).toBe(false)
  })

  it("detects overlap spanning both existing bookings", () => {
    expect(hasOverlap("09:00", "18:00", existing)).toBe(true)
  })

  it("detects overlap with only the second booking", () => {
    expect(hasOverlap("14:00", "16:00", existing)).toBe(true)
  })

  it("1-hour booking that exactly fills a free slot between bookings", () => {
    const packed: ExistingBooking[] = [
      { startTime: "10:00", endTime: "11:00" },
      { startTime: "12:00", endTime: "13:00" },
    ]
    expect(hasOverlap("11:00", "12:00", packed)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ✦ SUITE 5 — areConsecutive
// ---------------------------------------------------------------------------
describe("areConsecutive", () => {
  it("returns true for a single slot", () => {
    expect(areConsecutive(["10:00"])).toBe(true)
  })

  it("returns true for two adjacent slots", () => {
    expect(areConsecutive(["10:00", "11:00"])).toBe(true)
  })

  it("returns true for three consecutive slots", () => {
    expect(areConsecutive(["10:00", "11:00", "12:00"])).toBe(true)
  })

  it("returns true regardless of input order", () => {
    expect(areConsecutive(["12:00", "10:00", "11:00"])).toBe(true)
  })

  it("returns false for a gap of two hours", () => {
    expect(areConsecutive(["10:00", "12:00"])).toBe(false)
  })

  it("returns false for completely non-consecutive slots", () => {
    expect(areConsecutive(["08:00", "12:00", "16:00"])).toBe(false)
  })

  it("returns false for gap in the middle of otherwise consecutive list", () => {
    expect(areConsecutive(["09:00", "10:00", "12:00"])).toBe(false)
  })

  it("returns true for large consecutive block (8 hours)", () => {
    const block = Array.from({ length: 8 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`)
    expect(areConsecutive(block)).toBe(true)
  })

  it("returns true for an empty list (edge case)", () => {
    expect(areConsecutive([])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ✦ SUITE 6 — calcPrice (price calculation logic)
// ---------------------------------------------------------------------------
describe("calcPrice — no tiers (all default)", () => {
  const noTiers: PricingTier[] = []

  it("1-hour booking uses the default price", () => {
    const { totalAmount, priceBreakdown } = calcPrice("10:00", "11:00", MON, noTiers, 300)
    expect(totalAmount).toBe(300)
    expect(priceBreakdown).toHaveLength(1)
    expect(priceBreakdown[0].tier).toBe("Default")
  })

  it("multi-hour booking multiplies default price correctly", () => {
    const { totalAmount } = calcPrice("08:00", "11:00", MON, noTiers, 250)
    expect(totalAmount).toBe(750)
  })

  it("single-slot breakdown has correct hour label", () => {
    const { priceBreakdown } = calcPrice("14:00", "15:00", TUE, noTiers, 200)
    expect(priceBreakdown[0].hour).toBe("14:00")
    expect(priceBreakdown[0].price).toBe(200)
  })

  it("produces zero total for zero-duration (startHour === endHour)", () => {
    const { totalAmount, priceBreakdown } = calcPrice("10:00", "10:00", MON, noTiers, 300)
    expect(totalAmount).toBe(0)
    expect(priceBreakdown).toHaveLength(0)
  })
})

describe("calcPrice — single matching tier", () => {
  const morningTier: PricingTier = {
    name: "Morning",
    startTime: "06:00",
    endTime: "12:00",
    pricePerHour: 200,
    isActive: true,
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  }

  it("applies tier rate for every hour within tier window on weekday", () => {
    const { totalAmount, priceBreakdown } = calcPrice("08:00", "11:00", MON, [morningTier], 300)
    expect(totalAmount).toBe(600) // 3h × 200
    priceBreakdown.forEach((item) => expect(item.tier).toBe("Morning"))
  })

  it("falls back to default for slots outside tier window", () => {
    const { totalAmount, priceBreakdown } = calcPrice("13:00", "14:00", MON, [morningTier], 300)
    expect(totalAmount).toBe(300)
    expect(priceBreakdown[0].tier).toBe("Default")
  })

  it("tier does not apply on weekend when only weekdays listed", () => {
    const { totalAmount, priceBreakdown } = calcPrice("08:00", "10:00", SAT, [morningTier], 300)
    expect(totalAmount).toBe(600) // 2h × default 300
    priceBreakdown.forEach((item) => expect(item.tier).toBe("Default"))
  })

  it("tier applies on correct day at boundary start hour", () => {
    const { priceBreakdown } = calcPrice("06:00", "07:00", MON, [morningTier], 300)
    expect(priceBreakdown[0].tier).toBe("Morning")
  })

  it("tier does not apply at its own end hour (exclusive end)", () => {
    const { priceBreakdown } = calcPrice("12:00", "13:00", MON, [morningTier], 300)
    expect(priceBreakdown[0].tier).toBe("Default")
  })
})

describe("calcPrice — two tiers covering different windows", () => {
  const tiers: PricingTier[] = [
    {
      name: "Morning",
      startTime: "06:00",
      endTime: "12:00",
      pricePerHour: 150,
      isActive: true,
      daysOfWeek: ["monday"],
    },
    {
      name: "Afternoon",
      startTime: "12:00",
      endTime: "18:00",
      pricePerHour: 250,
      isActive: true,
      daysOfWeek: ["monday"],
    },
  ]

  it("booking spanning both tiers uses each tier correctly", () => {
    const { totalAmount, priceBreakdown } = calcPrice("10:00", "14:00", MON, tiers, 300)
    // 10:00-12:00 = 2h × 150, 12:00-14:00 = 2h × 250
    expect(totalAmount).toBe(2 * 150 + 2 * 250) // 800
    expect(priceBreakdown[0].tier).toBe("Morning")
    expect(priceBreakdown[1].tier).toBe("Morning")
    expect(priceBreakdown[2].tier).toBe("Afternoon")
    expect(priceBreakdown[3].tier).toBe("Afternoon")
  })

  it("booking fully within morning tier", () => {
    const { totalAmount } = calcPrice("08:00", "11:00", MON, tiers, 300)
    expect(totalAmount).toBe(450) // 3h × 150
  })

  it("booking fully within afternoon tier", () => {
    const { totalAmount } = calcPrice("13:00", "16:00", MON, tiers, 300)
    expect(totalAmount).toBe(750) // 3h × 250
  })

  it("booking starting right at morning tier boundary", () => {
    const { priceBreakdown } = calcPrice("06:00", "07:00", MON, tiers, 300)
    expect(priceBreakdown[0].price).toBe(150)
    expect(priceBreakdown[0].tier).toBe("Morning")
  })
})

describe("calcPrice — weekend tier", () => {
  const weekendTier: PricingTier = {
    name: "Weekend",
    startTime: "06:00",
    endTime: "22:00",
    pricePerHour: 400,
    isActive: true,
    daysOfWeek: ["saturday", "sunday"],
  }

  it("applies weekend pricing on Saturday", () => {
    const { totalAmount } = calcPrice("10:00", "13:00", SAT, [weekendTier], 250)
    expect(totalAmount).toBe(1200) // 3h × 400
  })

  it("applies weekend pricing on Sunday", () => {
    const { totalAmount } = calcPrice("09:00", "11:00", SUN, [weekendTier], 250)
    expect(totalAmount).toBe(800) // 2h × 400
  })

  it("does not apply weekend tier on Monday", () => {
    const { totalAmount } = calcPrice("10:00", "12:00", MON, [weekendTier], 250)
    expect(totalAmount).toBe(500) // 2h × default 250
  })
})

describe("calcPrice — inactive tier is ignored", () => {
  const inactiveTier: PricingTier = {
    name: "VIP",
    startTime: "08:00",
    endTime: "20:00",
    pricePerHour: 1000,
    isActive: false,
    daysOfWeek: ["monday"],
  }

  it("inactive tier falls back to default price", () => {
    const { totalAmount, priceBreakdown } = calcPrice("09:00", "11:00", MON, [inactiveTier], 250)
    expect(totalAmount).toBe(500)
    priceBreakdown.forEach((item) => expect(item.tier).toBe("Default"))
  })
})

describe("calcPrice — priceBreakdown structure", () => {
  it("each breakdown item has hour, price, and tier fields", () => {
    const { priceBreakdown } = calcPrice("10:00", "12:00", MON, [], 300)
    expect(priceBreakdown).toHaveLength(2)
    for (const item of priceBreakdown) {
      expect(item).toHaveProperty("hour")
      expect(item).toHaveProperty("price")
      expect(item).toHaveProperty("tier")
    }
  })

  it("hour labels increment correctly through the booking", () => {
    const { priceBreakdown } = calcPrice("08:00", "11:00", MON, [], 200)
    expect(priceBreakdown.map((i) => i.hour)).toEqual(["08:00", "09:00", "10:00"])
  })
})

// ---------------------------------------------------------------------------
// ✦ SUITE 7 — Full booking scenarios (slot availability + pricing combined)
// ---------------------------------------------------------------------------
describe("Full booking scenarios", () => {
  const defaultPrice = 250
  const tiers: PricingTier[] = [
    {
      name: "Morning",
      startTime: "06:00",
      endTime: "12:00",
      pricePerHour: 150,
      isActive: true,
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    {
      name: "Peak",
      startTime: "17:00",
      endTime: "22:00",
      pricePerHour: 350,
      isActive: true,
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    {
      name: "Weekend",
      startTime: "06:00",
      endTime: "22:00",
      pricePerHour: 400,
      isActive: true,
      daysOfWeek: ["saturday", "sunday"],
    },
  ]

  it("Scenario A — Customer books a 2-hour morning slot on a weekday: no conflict, correct price", () => {
    const existing: ExistingBooking[] = []
    expect(hasOverlap("08:00", "10:00", existing)).toBe(false)
    const { totalAmount } = calcPrice("08:00", "10:00", MON, tiers, defaultPrice)
    expect(totalAmount).toBe(300) // 2h × 150
  })

  it("Scenario B — Admin books peak-hour slot that already exists: conflict detected", () => {
    const existing: ExistingBooking[] = [{ startTime: "18:00", endTime: "20:00" }]
    expect(hasOverlap("18:00", "20:00", existing)).toBe(true)
  })

  it("Scenario C — Customer picks non-consecutive slots: validation rejects", () => {
    expect(areConsecutive(["09:00", "11:00"])).toBe(false)
  })

  it("Scenario D — Customer picks 3 consecutive slots, price spans morning + default", () => {
    // 11:00, 12:00, 13:00 — last morning hour then default
    const slots = ["11:00", "12:00", "13:00"]
    expect(areConsecutive(slots)).toBe(true)
    const { totalAmount, priceBreakdown } = calcPrice("11:00", "14:00", MON, tiers, defaultPrice)
    expect(priceBreakdown[0].tier).toBe("Morning") // 11:00
    expect(priceBreakdown[1].tier).toBe("Default")  // 12:00 (outside morning/peak)
    expect(priceBreakdown[2].tier).toBe("Default")  // 13:00
    expect(totalAmount).toBe(150 + 250 + 250) // 650
  })

  it("Scenario E — Weekend booking where selected slots are free and correctly priced", () => {
    const existing: ExistingBooking[] = [{ startTime: "10:00", endTime: "12:00" }]
    expect(hasOverlap("12:00", "14:00", existing)).toBe(false) // adjacent — no conflict
    const { totalAmount } = calcPrice("12:00", "14:00", SAT, tiers, defaultPrice)
    expect(totalAmount).toBe(800) // 2h × 400
  })

  it("Scenario F — Booking fills exact gap between two existing reservations", () => {
    const existing: ExistingBooking[] = [
      { startTime: "08:00", endTime: "10:00" },
      { startTime: "12:00", endTime: "14:00" },
    ]
    expect(hasOverlap("10:00", "12:00", existing)).toBe(false)
    const { totalAmount } = calcPrice("10:00", "12:00", MON, tiers, defaultPrice)
    expect(totalAmount).toBe(300) // 2h × 150 (still morning)
  })

  it("Scenario G — Booking partially overlaps the start of existing: conflict", () => {
    const existing: ExistingBooking[] = [{ startTime: "14:00", endTime: "16:00" }]
    expect(hasOverlap("13:00", "15:00", existing)).toBe(true)
  })

  it("Scenario H — Admin creates 1-hour peak slot, correct rate applied", () => {
    const existing: ExistingBooking[] = []
    expect(hasOverlap("19:00", "20:00", existing)).toBe(false)
    const { totalAmount } = calcPrice("19:00", "20:00", TUE, tiers, defaultPrice)
    expect(totalAmount).toBe(350)
  })

  it("Scenario I — Single slot selected (1 hour) is trivially consecutive", () => {
    expect(areConsecutive(["10:00"])).toBe(true)
  })

  it("Scenario J — Customer tries to book an already-fully-booked court all day", () => {
    const existing: ExistingBooking[] = [{ startTime: "06:00", endTime: "22:00" }]
    const slots = generateTimeSlots(6, 22)
    const allBooked = slots.every((s) => isSlotBooked(s, existing))
    expect(allBooked).toBe(true)
  })

  it("Scenario K — 5-hour evening booking spans default and peak tiers on weekday", () => {
    // 15:00-20:00: 15,16 = default (250), 17,18,19 = peak (350)
    expect(areConsecutive(["15:00", "16:00", "17:00", "18:00", "19:00"])).toBe(true)
    const { totalAmount, priceBreakdown } = calcPrice("15:00", "20:00", MON, tiers, defaultPrice)
    expect(priceBreakdown[0].tier).toBe("Default") // 15:00
    expect(priceBreakdown[1].tier).toBe("Default") // 16:00
    expect(priceBreakdown[2].tier).toBe("Peak")    // 17:00
    expect(priceBreakdown[3].tier).toBe("Peak")    // 18:00
    expect(priceBreakdown[4].tier).toBe("Peak")    // 19:00
    expect(totalAmount).toBe(2 * 250 + 3 * 350) // 1550
  })

  it("Scenario L — Two different courts, same time slot, no cross-court conflict", () => {
    // Each court has its own bookings list — no overlap between them
    const courtABookings: ExistingBooking[] = [{ startTime: "10:00", endTime: "12:00" }]
    const courtBBookings: ExistingBooking[] = []
    expect(hasOverlap("10:00", "12:00", courtABookings)).toBe(true)  // court A: blocked
    expect(hasOverlap("10:00", "12:00", courtBBookings)).toBe(false) // court B: free
  })

  it("Scenario M — Admin books 4 consecutive hours starting at opening time", () => {
    const slots = ["06:00", "07:00", "08:00", "09:00"]
    expect(areConsecutive(slots)).toBe(true)
    const { totalAmount } = calcPrice("06:00", "10:00", MON, tiers, defaultPrice)
    expect(totalAmount).toBe(4 * 150) // 600
  })

  it("Scenario N — Booking ending at exact closing hour (last available slot)", () => {
    // Closing is 22:00, last slot is 21:00–22:00 — no overlap with empty court
    expect(hasOverlap("21:00", "22:00", [])).toBe(false)
    const slots = generateTimeSlots(6, 22)
    expect(slots).toContain("21:00")
    expect(slots).not.toContain("22:00")
  })

  it("Scenario O — isSlotBooked correctly reflects all occupied slots for a full-day booking", () => {
    const fullDay: ExistingBooking[] = [{ startTime: "06:00", endTime: "22:00" }]
    const slots = generateTimeSlots(6, 22)
    const results = slots.map((s) => isSlotBooked(s, fullDay))
    expect(results.every(Boolean)).toBe(true)
  })
})
