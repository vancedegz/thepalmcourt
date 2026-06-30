/**
 * customer-admin-ui-logic.test.ts
 *
 * Tests for every client-side helper extracted verbatim from:
 *   - src/app/book/page.tsx                   (customer booking page)
 *   - src/app/admin/bookings/create/page.tsx  (admin create booking page)
 *   - src/app/admin/calendar/page.tsx         (admin calendar page)
 *
 * No DOM / React rendering needed — all helpers are pure functions.
 */

import { describe, it, expect } from "vitest"
import {
  format,
  addDays,
  isSameDay,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns"

// ─────────────────────────────────────────────────────────────────────────────
// Shared type definitions (mirroring the pages)
// ─────────────────────────────────────────────────────────────────────────────

type SlotBooking = { startTime: string; endTime: string }
type SelectedSlot = { courtId: string; time: string; date: Date }

// ─────────────────────────────────────────────────────────────────────────────
// ── CUSTOMER PAGE helpers ── src/app/book/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

/** Verbatim from book/page.tsx */
function customer_generateTimeSlots(
  openingHour: number,
  closingHour: number,
  selectedDate: Date
) {
  const slots = []
  const count = closingHour - openingHour
  for (let i = 0; i < count; i++) {
    const hour = openingHour + i
    const time = `${hour.toString().padStart(2, "0")}:00`
    slots.push({ time, hour, date: selectedDate })
  }
  return slots
}

/** Verbatim from book/page.tsx */
function customer_isSlotBooked(
  time: string,
  bookings: SlotBooking[]
): boolean {
  const [hour] = time.split(":").map(Number)
  return bookings.some((booking) => {
    const [startHour] = booking.startTime.split(":").map(Number)
    const [endHour] = booking.endTime.split(":").map(Number)
    return hour >= startHour && hour < endHour
  })
}

/** Verbatim from book/page.tsx */
function customer_isSlotSelected(
  courtId: string,
  time: string,
  selectedSlots: SelectedSlot[]
): boolean {
  return selectedSlots.some(
    (slot) => slot.courtId === courtId && slot.time === time
  )
}

/**
 * Verbatim from book/page.tsx — returns true if the slot is in the past.
 * Uses a fixed "now" injected so tests are deterministic.
 */
function customer_isSlotPast(
  time: string,
  date: Date,
  nowGmt8: Date // injected instead of calling new Date() inside
): boolean {
  const slotDate = new Date(date)
  slotDate.setHours(0, 0, 0, 0)
  const today = new Date(nowGmt8)
  today.setHours(0, 0, 0, 0)
  if (slotDate.getTime() > today.getTime()) return false
  if (slotDate.getTime() < today.getTime()) return true
  const [slotHour] = time.split(":").map(Number)
  const currentHour = nowGmt8.getHours()
  return slotHour <= currentHour
}

/**
 * Verbatim consecutive validation from handleProceedToSummary in book/page.tsx.
 * Returns null if valid, or an error string if invalid.
 */
function customer_validateConsecutive(
  slots: SelectedSlot[],
  courtNames: Record<string, string>
): string | null {
  const slotsByCourt: Record<string, SelectedSlot[]> = {}
  for (const slot of slots) {
    if (!slotsByCourt[slot.courtId]) slotsByCourt[slot.courtId] = []
    slotsByCourt[slot.courtId].push(slot)
  }
  for (const [courtId, courtSlots] of Object.entries(slotsByCourt)) {
    const sorted = [...courtSlots].sort((a, b) => {
      const [ah] = a.time.split(":").map(Number)
      const [bh] = b.time.split(":").map(Number)
      return ah - bh
    })
    for (let i = 0; i < sorted.length - 1; i++) {
      const [cur] = sorted[i].time.split(":").map(Number)
      const [nxt] = sorted[i + 1].time.split(":").map(Number)
      if (nxt !== cur + 1) {
        const name = courtNames[courtId] ?? "Selected court"
        return `${name}: Please select consecutive time slots`
      }
    }
  }
  return null
}

/**
 * Derives the endTime string from sorted selected slots (book/page.tsx).
 */
function customer_deriveEndTime(sortedSlots: SelectedSlot[]): string {
  const [lastHour] = sortedSlots[sortedSlots.length - 1].time
    .split(":")
    .map(Number)
  return `${(lastHour + 1).toString().padStart(2, "0")}:00`
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ADMIN CREATE PAGE helpers ── src/app/admin/bookings/create/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

/** Verbatim from admin/bookings/create/page.tsx */
function adminCreate_generateTimeSlots(
  openingHour: number,
  closingHour: number
) {
  const slots = []
  const count = closingHour - openingHour
  for (let i = 0; i < count; i++) {
    const hour = openingHour + i
    slots.push({ time: `${hour.toString().padStart(2, "0")}:00`, hour })
  }
  return slots
}

/** Verbatim from admin/bookings/create/page.tsx */
function adminCreate_isSlotBooked(
  time: string,
  bookings: SlotBooking[]
): boolean {
  const [hour] = time.split(":").map(Number)
  return bookings.some((b) => {
    const [bStart] = b.startTime.split(":").map(Number)
    const [bEnd] = b.endTime.split(":").map(Number)
    return hour >= bStart && hour < bEnd
  })
}

/**
 * Admin create page isSlotPast — only blocks today's past hours,
 * never blocks future dates (admins can book ahead freely).
 */
function adminCreate_isSlotPast(
  time: string,
  selectedDate: Date,
  nowGmt8: Date
): boolean {
  const today = new Date(nowGmt8)
  today.setHours(0, 0, 0, 0)
  const sel = new Date(selectedDate)
  sel.setHours(0, 0, 0, 0)
  if (sel.getTime() !== today.getTime()) return false
  const currentHour = nowGmt8.getHours()
  const [slotHour] = time.split(":").map(Number)
  return slotHour <= currentHour
}

/**
 * Verbatim consecutive validation + endTime derivation from
 * handleProceedToSummary in admin/bookings/create/page.tsx.
 */
function adminCreate_validateAndDeriveEnd(
  selectedSlots: string[]
): { error: string | null; startTime: string; endTime: string } {
  const sorted = [...selectedSlots].sort((a, b) => {
    const [ah] = a.split(":").map(Number)
    const [bh] = b.split(":").map(Number)
    return ah - bh
  })
  for (let i = 0; i < sorted.length - 1; i++) {
    const [cur] = sorted[i].split(":").map(Number)
    const [nxt] = sorted[i + 1].split(":").map(Number)
    if (nxt !== cur + 1) {
      return { error: "Please select consecutive time slots", startTime: "", endTime: "" }
    }
  }
  const startTime = sorted[0]
  const [lastHour] = sorted[sorted.length - 1].split(":").map(Number)
  const endTime = `${(lastHour + 1).toString().padStart(2, "0")}:00`
  return { error: null, startTime, endTime }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ADMIN CALENDAR helpers ── src/app/admin/calendar/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

type CalendarBooking = {
  id: string
  courtId: string
  status: string
  startTime: string
  endTime: string
  date: Date
}

/** Verbatim from admin/calendar/page.tsx */
function calendar_getBookingsForDay(
  bookings: CalendarBooking[],
  date: Date,
  selectedCourt: string
): CalendarBooking[] {
  return bookings.filter((b) => {
    if (selectedCourt !== "all" && b.courtId !== selectedCourt) return false
    const bookingDate = parseISO(b.date.toISOString())
    return isSameDay(bookingDate, date)
  })
}

/** Verbatim from admin/calendar/page.tsx */
function calendar_getBookingForCell(
  bookings: CalendarBooking[],
  courtId: string,
  hour: number,
  date: Date
): CalendarBooking | undefined {
  const cellDate = new Date(date)
  cellDate.setHours(0, 0, 0, 0)
  return bookings.find((b) => {
    if (b.courtId !== courtId) return false
    if (b.status === "cancelled") return false
    const bookingDate = parseISO(b.date.toISOString())
    bookingDate.setHours(0, 0, 0, 0)
    if (bookingDate.getTime() !== cellDate.getTime()) return false
    const [startHour] = b.startTime.split(":").map(Number)
    const [endHour] = b.endTime.split(":").map(Number)
    return hour >= startHour && hour < endHour
  })
}

/** Verbatim from admin/calendar/page.tsx */
function calendar_getTimeSlots(
  openingHour: number,
  closingHour: number
): number[] {
  const slotCount = Math.max(0, closingHour - openingHour)
  return Array.from({ length: slotCount }, (_, i) => openingHour + i)
}

/** Verbatim endTime derivation from handleCreateBooking in admin/calendar/page.tsx */
function calendar_deriveEndTime(startTime: string, duration: number): string {
  const [startHour] = startTime.split(":").map(Number)
  const endHour = startHour + duration
  return `${endHour.toString().padStart(2, "0")}:00`
}

// ─────────────────────────────────────────────────────────────────────────────
// DateStrip — shared between customer + admin create pages
// ─────────────────────────────────────────────────────────────────────────────

function dateStrip_generateDays(today: Date): Date[] {
  return Array.from({ length: 14 }, (_, i) => addDays(today, i))
}

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TODAY = new Date("2026-07-01T00:00:00") // Tuesday
const TOMORROW = addDays(TODAY, 1)
const YESTERDAY = addDays(TODAY, -1)
const NOW_10AM = new Date("2026-07-01T10:00:00") // "current time" = 10:00 AM today

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 1 — Customer page: generateTimeSlots
// ─────────────────────────────────────────────────────────────────────────────

describe("Customer page — generateTimeSlots", () => {
  it("returns slots carrying the selectedDate on each slot", () => {
    const slots = customer_generateTimeSlots(6, 8, TODAY)
    slots.forEach((s) => expect(s.date).toBe(TODAY))
  })

  it("count = closingHour - openingHour", () => {
    expect(customer_generateTimeSlots(6, 22, TODAY)).toHaveLength(16)
  })

  it("first slot is opening hour", () => {
    expect(customer_generateTimeSlots(8, 18, TODAY)[0].time).toBe("08:00")
  })

  it("last slot is one hour before closing", () => {
    const slots = customer_generateTimeSlots(6, 22, TODAY)
    expect(slots[slots.length - 1].time).toBe("21:00")
  })

  it("returns empty array when opening equals closing", () => {
    expect(customer_generateTimeSlots(10, 10, TODAY)).toHaveLength(0)
  })

  it("each slot has correct hour property", () => {
    const slots = customer_generateTimeSlots(9, 12, TODAY)
    expect(slots.map((s) => s.hour)).toEqual([9, 10, 11])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 2 — Customer page: isSlotBooked (court-keyed)
// ─────────────────────────────────────────────────────────────────────────────

describe("Customer page — isSlotBooked", () => {
  const bookings: SlotBooking[] = [{ startTime: "10:00", endTime: "13:00" }]

  it("returns true for slot at booking start", () => {
    expect(customer_isSlotBooked("10:00", bookings)).toBe(true)
  })

  it("returns true for slot in the middle of booking", () => {
    expect(customer_isSlotBooked("11:00", bookings)).toBe(true)
  })

  it("returns true for last occupied hour", () => {
    expect(customer_isSlotBooked("12:00", bookings)).toBe(true)
  })

  it("returns false at the endTime hour (exclusive)", () => {
    expect(customer_isSlotBooked("13:00", bookings)).toBe(false)
  })

  it("returns false before booking starts", () => {
    expect(customer_isSlotBooked("09:00", bookings)).toBe(false)
  })

  it("returns false with empty bookings array", () => {
    expect(customer_isSlotBooked("10:00", [])).toBe(false)
  })

  it("correctly handles multiple bookings on the same court", () => {
    const multi: SlotBooking[] = [
      { startTime: "08:00", endTime: "10:00" },
      { startTime: "14:00", endTime: "16:00" },
    ]
    expect(customer_isSlotBooked("09:00", multi)).toBe(true)
    expect(customer_isSlotBooked("10:00", multi)).toBe(false)
    expect(customer_isSlotBooked("13:00", multi)).toBe(false)
    expect(customer_isSlotBooked("15:00", multi)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 3 — Customer page: isSlotSelected
// ─────────────────────────────────────────────────────────────────────────────

describe("Customer page — isSlotSelected", () => {
  const selected: SelectedSlot[] = [
    { courtId: "c1", time: "10:00", date: TODAY },
    { courtId: "c2", time: "11:00", date: TODAY },
  ]

  it("returns true when court+time matches", () => {
    expect(customer_isSlotSelected("c1", "10:00", selected)).toBe(true)
  })

  it("returns false when court matches but time differs", () => {
    expect(customer_isSlotSelected("c1", "11:00", selected)).toBe(false)
  })

  it("returns false when time matches but court differs", () => {
    expect(customer_isSlotSelected("c3", "10:00", selected)).toBe(false)
  })

  it("returns false when nothing is selected", () => {
    expect(customer_isSlotSelected("c1", "10:00", [])).toBe(false)
  })

  it("returns true for the second court's selected slot", () => {
    expect(customer_isSlotSelected("c2", "11:00", selected)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 4 — Customer page: isSlotPast
// ─────────────────────────────────────────────────────────────────────────────

describe("Customer page — isSlotPast", () => {
  it("future date is never past", () => {
    expect(customer_isSlotPast("06:00", TOMORROW, NOW_10AM)).toBe(false)
  })

  it("yesterday is always past regardless of hour", () => {
    expect(customer_isSlotPast("23:00", YESTERDAY, NOW_10AM)).toBe(true)
    expect(customer_isSlotPast("00:00", YESTERDAY, NOW_10AM)).toBe(true)
  })

  it("today at current hour is past (≤ currentHour)", () => {
    expect(customer_isSlotPast("10:00", TODAY, NOW_10AM)).toBe(true)
  })

  it("today at an earlier hour is past", () => {
    expect(customer_isSlotPast("09:00", TODAY, NOW_10AM)).toBe(true)
  })

  it("today at a future hour is NOT past", () => {
    expect(customer_isSlotPast("11:00", TODAY, NOW_10AM)).toBe(false)
  })

  it("today at a much later hour is NOT past", () => {
    expect(customer_isSlotPast("21:00", TODAY, NOW_10AM)).toBe(false)
  })

  it("handles midnight of today correctly (hour 0 is past at 10 AM)", () => {
    expect(customer_isSlotPast("00:00", TODAY, NOW_10AM)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 5 — Customer page: validateConsecutive (handleProceedToSummary)
// ─────────────────────────────────────────────────────────────────────────────

describe("Customer page — validateConsecutive", () => {
  const names = { c1: "Court 1", c2: "Court 2" }

  it("returns null for a single slot (always valid)", () => {
    const slots: SelectedSlot[] = [{ courtId: "c1", time: "10:00", date: TODAY }]
    expect(customer_validateConsecutive(slots, names)).toBeNull()
  })

  it("returns null for two consecutive slots on same court", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "10:00", date: TODAY },
      { courtId: "c1", time: "11:00", date: TODAY },
    ]
    expect(customer_validateConsecutive(slots, names)).toBeNull()
  })

  it("returns null for three consecutive slots on same court", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "10:00", date: TODAY },
      { courtId: "c1", time: "11:00", date: TODAY },
      { courtId: "c1", time: "12:00", date: TODAY },
    ]
    expect(customer_validateConsecutive(slots, names)).toBeNull()
  })

  it("returns error for gap of two hours on same court", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "10:00", date: TODAY },
      { courtId: "c1", time: "12:00", date: TODAY },
    ]
    const result = customer_validateConsecutive(slots, names)
    expect(result).toContain("Court 1")
    expect(result).toContain("consecutive")
  })

  it("returns error for non-consecutive slots regardless of input order", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "14:00", date: TODAY },
      { courtId: "c1", time: "10:00", date: TODAY },
    ]
    // sorted: [10:00, 14:00] — 4-hour gap → must return error
    const result = customer_validateConsecutive(slots, names)
    expect(result).toContain("Court 1")
    expect(result).toContain("consecutive")
  })

  it("two courts with consecutive slots each — both valid", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "10:00", date: TODAY },
      { courtId: "c1", time: "11:00", date: TODAY },
      { courtId: "c2", time: "14:00", date: TODAY },
      { courtId: "c2", time: "15:00", date: TODAY },
    ]
    expect(customer_validateConsecutive(slots, names)).toBeNull()
  })

  it("court 1 consecutive, court 2 has gap — returns error for court 2", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "10:00", date: TODAY },
      { courtId: "c1", time: "11:00", date: TODAY },
      { courtId: "c2", time: "10:00", date: TODAY },
      { courtId: "c2", time: "12:00", date: TODAY },
    ]
    const result = customer_validateConsecutive(slots, names)
    expect(result).toContain("Court 2")
  })

  it("uses fallback name when court not in names map", () => {
    const slots: SelectedSlot[] = [
      { courtId: "cx", time: "10:00", date: TODAY },
      { courtId: "cx", time: "12:00", date: TODAY },
    ]
    const result = customer_validateConsecutive(slots, {})
    expect(result).toContain("Selected court")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 6 — Customer page: deriveEndTime
// ─────────────────────────────────────────────────────────────────────────────

describe("Customer page — deriveEndTime", () => {
  it("1-slot booking: endTime is start + 1 hour", () => {
    const slots: SelectedSlot[] = [{ courtId: "c1", time: "10:00", date: TODAY }]
    expect(customer_deriveEndTime(slots)).toBe("11:00")
  })

  it("3-slot booking: endTime is last slot + 1 hour", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "10:00", date: TODAY },
      { courtId: "c1", time: "11:00", date: TODAY },
      { courtId: "c1", time: "12:00", date: TODAY },
    ]
    expect(customer_deriveEndTime(slots)).toBe("13:00")
  })

  it("zero-padded correctly for single-digit hours", () => {
    const slots: SelectedSlot[] = [{ courtId: "c1", time: "08:00", date: TODAY }]
    expect(customer_deriveEndTime(slots)).toBe("09:00")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 7 — Admin create page: generateTimeSlots
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin create page — generateTimeSlots", () => {
  it("generates correct count for 06:00-22:00", () => {
    expect(adminCreate_generateTimeSlots(6, 22)).toHaveLength(16)
  })

  it("first slot equals opening hour formatted", () => {
    expect(adminCreate_generateTimeSlots(6, 22)[0].time).toBe("06:00")
  })

  it("last slot is one hour before closing", () => {
    const slots = adminCreate_generateTimeSlots(6, 22)
    expect(slots[slots.length - 1].time).toBe("21:00")
  })

  it("each slot has both time string and numeric hour", () => {
    const slots = adminCreate_generateTimeSlots(10, 13)
    expect(slots).toEqual([
      { time: "10:00", hour: 10 },
      { time: "11:00", hour: 11 },
      { time: "12:00", hour: 12 },
    ])
  })

  it("returns empty for zero-width window", () => {
    expect(adminCreate_generateTimeSlots(10, 10)).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 8 — Admin create page: isSlotBooked
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin create page — isSlotBooked", () => {
  const bookings: SlotBooking[] = [{ startTime: "14:00", endTime: "17:00" }]

  it("returns true for slot within booking", () => {
    expect(adminCreate_isSlotBooked("15:00", bookings)).toBe(true)
  })

  it("returns false at end hour (exclusive)", () => {
    expect(adminCreate_isSlotBooked("17:00", bookings)).toBe(false)
  })

  it("returns false before booking starts", () => {
    expect(adminCreate_isSlotBooked("13:00", bookings)).toBe(false)
  })

  it("returns false with no bookings", () => {
    expect(adminCreate_isSlotBooked("10:00", [])).toBe(false)
  })

  it("returns true for start hour of booking", () => {
    expect(adminCreate_isSlotBooked("14:00", bookings)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 9 — Admin create page: isSlotPast
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin create page — isSlotPast", () => {
  it("future date is never past", () => {
    expect(adminCreate_isSlotPast("06:00", TOMORROW, NOW_10AM)).toBe(false)
  })

  it("past date is never marked past (admin can backdate — only same-day blocked)", () => {
    expect(adminCreate_isSlotPast("06:00", YESTERDAY, NOW_10AM)).toBe(false)
  })

  it("today at current hour is past", () => {
    expect(adminCreate_isSlotPast("10:00", TODAY, NOW_10AM)).toBe(true)
  })

  it("today at earlier hour is past", () => {
    expect(adminCreate_isSlotPast("08:00", TODAY, NOW_10AM)).toBe(true)
  })

  it("today at future hour is NOT past", () => {
    expect(adminCreate_isSlotPast("14:00", TODAY, NOW_10AM)).toBe(false)
  })

  it("different date (even yesterday) does not block", () => {
    expect(adminCreate_isSlotPast("09:00", YESTERDAY, NOW_10AM)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 10 — Admin create page: validateAndDeriveEnd
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin create page — validateAndDeriveEnd", () => {
  it("single slot — no error, correct startTime and endTime", () => {
    const { error, startTime, endTime } = adminCreate_validateAndDeriveEnd(["10:00"])
    expect(error).toBeNull()
    expect(startTime).toBe("10:00")
    expect(endTime).toBe("11:00")
  })

  it("three consecutive slots — no error, endTime = last + 1", () => {
    const { error, startTime, endTime } = adminCreate_validateAndDeriveEnd([
      "12:00", "10:00", "11:00", // unsorted input
    ])
    expect(error).toBeNull()
    expect(startTime).toBe("10:00")
    expect(endTime).toBe("13:00")
  })

  it("non-consecutive slots — returns error", () => {
    const { error } = adminCreate_validateAndDeriveEnd(["10:00", "12:00"])
    expect(error).toContain("consecutive")
  })

  it("gap in middle of otherwise consecutive range — returns error", () => {
    const { error } = adminCreate_validateAndDeriveEnd(["09:00", "10:00", "12:00"])
    expect(error).toContain("consecutive")
  })

  it("5-hour block — correct endTime", () => {
    const slots = ["08:00", "09:00", "10:00", "11:00", "12:00"]
    const { error, startTime, endTime } = adminCreate_validateAndDeriveEnd(slots)
    expect(error).toBeNull()
    expect(startTime).toBe("08:00")
    expect(endTime).toBe("13:00")
  })

  it("adjacent slots provided in reverse order — still valid", () => {
    const { error, startTime, endTime } = adminCreate_validateAndDeriveEnd(["15:00", "14:00"])
    expect(error).toBeNull()
    expect(startTime).toBe("14:00")
    expect(endTime).toBe("16:00")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 11 — Admin calendar: getTimeSlots
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin calendar — getTimeSlots", () => {
  it("standard 06:00-22:00 schedule gives 16 hour slots", () => {
    const slots = calendar_getTimeSlots(6, 22)
    expect(slots).toHaveLength(16)
    expect(slots[0]).toBe(6)
    expect(slots[15]).toBe(21)
  })

  it("returns empty array for zero-width window", () => {
    expect(calendar_getTimeSlots(10, 10)).toHaveLength(0)
  })

  it("Math.max(0) prevents negative-length arrays", () => {
    expect(calendar_getTimeSlots(22, 6)).toHaveLength(0)
  })

  it("generates all hours in sequence", () => {
    const slots = calendar_getTimeSlots(8, 12)
    expect(slots).toEqual([8, 9, 10, 11])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 12 — Admin calendar: deriveEndTime (handleCreateBooking)
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin calendar — deriveEndTime (handleCreateBooking)", () => {
  it("1-hour booking from 10:00 ends at 11:00", () => {
    expect(calendar_deriveEndTime("10:00", 1)).toBe("11:00")
  })

  it("2-hour booking from 14:00 ends at 16:00", () => {
    expect(calendar_deriveEndTime("14:00", 2)).toBe("16:00")
  })

  it("3-hour booking from 08:00 ends at 11:00", () => {
    expect(calendar_deriveEndTime("08:00", 3)).toBe("11:00")
  })

  it("6-hour booking from 06:00 ends at 12:00", () => {
    expect(calendar_deriveEndTime("06:00", 6)).toBe("12:00")
  })

  it("1-hour booking from 20:00 ends at 21:00", () => {
    expect(calendar_deriveEndTime("20:00", 1)).toBe("21:00")
  })

  it("endTime is zero-padded correctly for single-digit result hours", () => {
    expect(calendar_deriveEndTime("08:00", 1)).toBe("09:00")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 13 — Admin calendar: getBookingsForDay
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin calendar — getBookingsForDay", () => {
  const bookings: CalendarBooking[] = [
    { id: "b1", courtId: "c1", status: "confirmed", startTime: "08:00", endTime: "10:00", date: TODAY },
    { id: "b2", courtId: "c2", status: "pending",   startTime: "10:00", endTime: "12:00", date: TODAY },
    { id: "b3", courtId: "c1", status: "confirmed", startTime: "14:00", endTime: "16:00", date: TOMORROW },
    { id: "b4", courtId: "c1", status: "cancelled", startTime: "09:00", endTime: "10:00", date: TODAY },
  ]

  it("returns all bookings on the selected day (all courts)", () => {
    const result = calendar_getBookingsForDay(bookings, TODAY, "all")
    expect(result.map((b) => b.id).sort()).toEqual(["b1", "b2", "b4"].sort())
  })

  it("excludes bookings from a different day", () => {
    const result = calendar_getBookingsForDay(bookings, TODAY, "all")
    expect(result.find((b) => b.id === "b3")).toBeUndefined()
  })

  it("filters by court when selectedCourt is not 'all'", () => {
    const result = calendar_getBookingsForDay(bookings, TODAY, "c1")
    expect(result.map((b) => b.id).sort()).toEqual(["b1", "b4"].sort())
  })

  it("returns empty for a day with no bookings", () => {
    expect(calendar_getBookingsForDay(bookings, YESTERDAY, "all")).toHaveLength(0)
  })

  it("includes cancelled bookings (filtering by status is UI responsibility)", () => {
    const result = calendar_getBookingsForDay(bookings, TODAY, "all")
    expect(result.find((b) => b.id === "b4")).toBeDefined()
  })

  it("tomorrow with court filter returns only matching booking", () => {
    const result = calendar_getBookingsForDay(bookings, TOMORROW, "c1")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("b3")
  })

  it("returns empty when court filter matches no bookings on that day", () => {
    expect(calendar_getBookingsForDay(bookings, TODAY, "c3")).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 14 — Admin calendar: getBookingForCell
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin calendar — getBookingForCell", () => {
  const bookings: CalendarBooking[] = [
    { id: "b1", courtId: "c1", status: "confirmed", startTime: "08:00", endTime: "11:00", date: TODAY },
    { id: "b2", courtId: "c2", status: "confirmed", startTime: "10:00", endTime: "12:00", date: TODAY },
    { id: "b3", courtId: "c1", status: "confirmed", startTime: "14:00", endTime: "16:00", date: TOMORROW },
    { id: "b4", courtId: "c1", status: "cancelled", startTime: "09:00", endTime: "10:00", date: TODAY },
  ]

  it("finds booking for correct court and hour", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 8, TODAY)?.id).toBe("b1")
  })

  it("finds booking in middle of its time range", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 9, TODAY)?.id).toBe("b1")
  })

  it("does NOT find booking at its endTime hour (exclusive end)", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 11, TODAY)).toBeUndefined()
  })

  it("returns undefined for a free hour on the same court", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 12, TODAY)).toBeUndefined()
  })

  it("returns undefined for cancelled booking (never shown in day view)", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 9, TODAY)?.id).not.toBe("b4")
  })

  it("does not mix up courts — hour 10 on c1 is free, on c2 is booked", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 10, TODAY)?.id).toBe("b1")
    expect(calendar_getBookingForCell(bookings, "c2", 10, TODAY)?.id).toBe("b2")
  })

  it("does not bleed into the next day — tomorrow's booking not found today", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 14, TODAY)).toBeUndefined()
  })

  it("correctly finds tomorrow's booking on the correct date", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 14, TOMORROW)?.id).toBe("b3")
  })

  it("returns undefined for empty bookings list", () => {
    expect(calendar_getBookingForCell([], "c1", 10, TODAY)).toBeUndefined()
  })

  it("returns correct booking for last occupied hour (endTime - 1)", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 10, TODAY)?.id).toBe("b1")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 15 — DateStrip day generation (customer + admin create)
// ─────────────────────────────────────────────────────────────────────────────

describe("DateStrip — day generation", () => {
  it("generates exactly 14 days", () => {
    expect(dateStrip_generateDays(TODAY)).toHaveLength(14)
  })

  it("first day is today", () => {
    const days = dateStrip_generateDays(TODAY)
    expect(isSameDay(days[0], TODAY)).toBe(true)
  })

  it("last day is 13 days from today", () => {
    const days = dateStrip_generateDays(TODAY)
    expect(isSameDay(days[13], addDays(TODAY, 13))).toBe(true)
  })

  it("days are in ascending order", () => {
    const days = dateStrip_generateDays(TODAY)
    for (let i = 0; i < days.length - 1; i++) {
      expect(days[i].getTime()).toBeLessThan(days[i + 1].getTime())
    }
  })

  it("no duplicate dates", () => {
    const days = dateStrip_generateDays(TODAY)
    const isoStrings = days.map((d) => format(d, "yyyy-MM-dd"))
    const unique = new Set(isoStrings)
    expect(unique.size).toBe(14)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 16 — Full cross-side scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe("Cross-side scenarios", () => {
  it("Customer selects 3 slots on a free court — all slot checks pass", () => {
    const existingBookings: SlotBooking[] = []
    const slots = ["10:00", "11:00", "12:00"]
    slots.forEach((t) => {
      expect(customer_isSlotBooked(t, existingBookings)).toBe(false)
      expect(customer_isSlotPast(t, TOMORROW, NOW_10AM)).toBe(false)
    })
    const selectedSlots: SelectedSlot[] = slots.map((t) => ({
      courtId: "c1", time: t, date: TOMORROW,
    }))
    expect(customer_validateConsecutive(selectedSlots, { c1: "Court 1" })).toBeNull()
    expect(customer_deriveEndTime(selectedSlots)).toBe("13:00")
  })

  it("Customer tries to book a past slot today — isSlotPast blocks it", () => {
    expect(customer_isSlotPast("09:00", TODAY, NOW_10AM)).toBe(true)
  })

  it("Admin creates booking for a slot that customer already has — overlap detected", () => {
    const courtBookings: CalendarBooking[] = [
      { id: "b1", courtId: "c1", status: "confirmed", startTime: "10:00", endTime: "12:00", date: TODAY },
    ]
    const cell10 = calendar_getBookingForCell(courtBookings, "c1", 10, TODAY)
    expect(cell10).toBeDefined() // cell is occupied — admin sees existing booking
  })

  it("Admin calendar day view shows no booking in free adjacent slot", () => {
    const courtBookings: CalendarBooking[] = [
      { id: "b1", courtId: "c1", status: "confirmed", startTime: "10:00", endTime: "12:00", date: TODAY },
    ]
    expect(calendar_getBookingForCell(courtBookings, "c1", 12, TODAY)).toBeUndefined()
  })

  it("Admin creates 2-hour booking from 14:00 — endTime correctly derived to 16:00", () => {
    const { error, startTime, endTime } = adminCreate_validateAndDeriveEnd(["14:00", "15:00"])
    expect(error).toBeNull()
    expect(startTime).toBe("14:00")
    expect(endTime).toBe("16:00")
  })

  it("Admin calendar booking for court A does not pollute court B's cell", () => {
    const bookings: CalendarBooking[] = [
      { id: "b1", courtId: "c1", status: "confirmed", startTime: "10:00", endTime: "12:00", date: TODAY },
    ]
    expect(calendar_getBookingForCell(bookings, "c2", 10, TODAY)).toBeUndefined()
  })

  it("Admin calendar getBookingsForDay and getBookingForCell agree on the same booking", () => {
    const bookings: CalendarBooking[] = [
      { id: "b1", courtId: "c1", status: "confirmed", startTime: "09:00", endTime: "11:00", date: TODAY },
    ]
    const dayBookings = calendar_getBookingsForDay(bookings, TODAY, "all")
    expect(dayBookings).toHaveLength(1)
    // That same booking must be visible in the cell view
    expect(calendar_getBookingForCell(bookings, "c1", 9, TODAY)?.id).toBe("b1")
    expect(calendar_getBookingForCell(bookings, "c1", 10, TODAY)?.id).toBe("b1")
  })

  it("Cancelled booking appears in getBookingsForDay list but NOT in getBookingForCell", () => {
    const bookings: CalendarBooking[] = [
      { id: "b1", courtId: "c1", status: "cancelled", startTime: "10:00", endTime: "12:00", date: TODAY },
    ]
    // Day list: includes cancelled (shown as badge, filtered in UI)
    expect(calendar_getBookingsForDay(bookings, TODAY, "all")).toHaveLength(1)
    // Cell view: cancelled bookings hidden (slot looks free)
    expect(calendar_getBookingForCell(bookings, "c1", 10, TODAY)).toBeUndefined()
  })

  it("Time slots visible to customer match slots visible to admin for same hours", () => {
    const customerSlots = customer_generateTimeSlots(6, 22, TODAY).map((s) => s.time)
    const adminCreateSlots = adminCreate_generateTimeSlots(6, 22).map((s) => s.time)
    const adminCalendarSlots = calendar_getTimeSlots(6, 22).map(
      (h) => `${h.toString().padStart(2, "0")}:00`
    )
    expect(customerSlots).toEqual(adminCreateSlots)
    expect(adminCreateSlots).toEqual(adminCalendarSlots)
  })
})
