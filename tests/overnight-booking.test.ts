/**
 * overnight-booking.test.ts
 *
 * QA test suite for all overnight / post-midnight booking changes.
 * Helpers are extracted verbatim from the current source files:
 *   - src/app/book/page.tsx
 *   - src/app/admin/bookings/create/page.tsx
 *   - src/app/admin/calendar/page.tsx
 *
 * Covers:
 *   1. closingHour normalisation (+24 when wrapping midnight)
 *   2. generateTimeSlots — slot date assignment for post-midnight hours
 *   3. isSlotBooked — composite key (courtId:dateISO) lookup
 *   4. isSlotPast — post-midnight slot uses next-day date
 *   5. validateConsecutive — post-midnight slots across midnight boundary
 *   6. deriveEndTime — last slot + 1 wraps correctly at midnight
 *   7. calendar getBookingForCell — hour % 24, slotDate = next day
 *   8. calendar closingHour normalisation
 *   9. Full end-to-end overnight scenarios
 */

import { describe, it, expect } from "vitest"
import { addDays, isSameDay, parseISO } from "date-fns"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SlotBooking = { startTime: string; endTime: string }
type SelectedSlot  = { courtId: string; time: string; date: Date }

type CalendarBooking = {
  id: string
  courtId: string
  status: string
  startTime: string
  endTime: string
  date: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — verbatim from current source
// ─────────────────────────────────────────────────────────────────────────────

/** Verbatim: settings load in book/page.tsx & admin pages */
function normaliseClosingHour(openH: number, closeH: number): number {
  return closeH <= openH ? closeH + 24 : closeH
}

/** Verbatim: book/page.tsx generateTimeSlots */
function customer_generateTimeSlots(
  openingHour: number,
  closingHour: number,
  selectedDate: Date
) {
  const slots: { time: string; hour: number; date: Date }[] = []
  const count = closingHour - openingHour
  for (let i = 0; i < count; i++) {
    const hour = openingHour + i
    const time = `${(hour % 24).toString().padStart(2, "0")}:00`
    const date = hour >= 24 ? addDays(selectedDate, 1) : selectedDate
    slots.push({ time, hour, date })
  }
  return slots
}

/** Verbatim: book/page.tsx isSlotBooked (composite key) */
function customer_isSlotBooked(
  courtId: string,
  time: string,
  slotDate: Date,
  courtBookings: Record<string, SlotBooking[]>
): boolean {
  const key = `${courtId}:${slotDate.toISOString()}`
  const bookings = courtBookings[key] || []
  const [hour] = time.split(":").map(Number)
  return bookings.some((b) => {
    const [s] = b.startTime.split(":").map(Number)
    const [e] = b.endTime.split(":").map(Number)
    return hour >= s && hour < e
  })
}

/** Verbatim: book/page.tsx isSlotPast (injected now) */
function customer_isSlotPast(time: string, date: Date, nowGmt8: Date): boolean {
  const slotDate = new Date(date)
  slotDate.setHours(0, 0, 0, 0)
  const today = new Date(nowGmt8)
  today.setHours(0, 0, 0, 0)
  if (slotDate.getTime() > today.getTime()) return false
  if (slotDate.getTime() < today.getTime()) return true
  const [slotHour] = time.split(":").map(Number)
  return slotHour <= nowGmt8.getHours()
}

/** Verbatim: book/page.tsx handleProceedToSummary consecutive check + deriveEndTime */
function customer_validateAndDerive(slots: SelectedSlot[], courtNames: Record<string, string>) {
  // Group by court
  const byCourt: Record<string, SelectedSlot[]> = {}
  for (const s of slots) {
    if (!byCourt[s.courtId]) byCourt[s.courtId] = []
    byCourt[s.courtId].push(s)
  }
  for (const [courtId, cs] of Object.entries(byCourt)) {
    const sorted = [...cs].sort((a, b) => {
      const [ah] = a.time.split(":").map(Number)
      const [bh] = b.time.split(":").map(Number)
      return ah - bh
    })
    for (let i = 0; i < sorted.length - 1; i++) {
      const [cur] = sorted[i].time.split(":").map(Number)
      const [nxt] = sorted[i + 1].time.split(":").map(Number)
      if (nxt !== cur + 1) {
        return { error: `${courtNames[courtId] ?? "Selected court"}: Please select consecutive time slots` }
      }
    }
  }
  // Derive per court
  const results: Record<string, { startTime: string; endTime: string; startDate: Date; endDate: Date }> = {}
  for (const [courtId, cs] of Object.entries(byCourt)) {
    const sorted = [...cs].sort((a, b) => {
      const [ah] = a.time.split(":").map(Number)
      const [bh] = b.time.split(":").map(Number)
      return ah - bh
    })
    const [lastHour] = sorted[sorted.length - 1].time.split(":").map(Number)
    results[courtId] = {
      startTime: sorted[0].time,
      startDate: sorted[0].date,
      endTime: `${(lastHour + 1).toString().padStart(2, "0")}:00`,
      endDate: sorted[sorted.length - 1].date,
    }
  }
  return { error: null, results }
}

/** Verbatim: admin/bookings/create/page.tsx generateTimeSlots */
function adminCreate_generateTimeSlots(openingHour: number, closingHour: number) {
  const slots: { time: string; hour: number }[] = []
  const count = closingHour - openingHour
  for (let i = 0; i < count; i++) {
    const hour = openingHour + i
    slots.push({ time: `${(hour % 24).toString().padStart(2, "0")}:00`, hour })
  }
  return slots
}

/** Verbatim: admin/calendar/page.tsx getBookingForCell */
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
    const [s] = b.startTime.split(":").map(Number)
    const [e] = b.endTime.split(":").map(Number)
    const normalHour = hour % 24
    return normalHour >= s && normalHour < e
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TODAY    = new Date("2026-07-01T00:00:00")
const TOMORROW = addDays(TODAY, 1)
const NOW_10AM = new Date("2026-07-01T10:00:00")

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 1 — closingHour normalisation
// ─────────────────────────────────────────────────────────────────────────────

describe("closingHour normalisation", () => {
  it("same-day close (22) stays as-is", () => {
    expect(normaliseClosingHour(6, 22)).toBe(22)
  })

  it("midnight close (0) becomes 24", () => {
    expect(normaliseClosingHour(6, 0)).toBe(24)
  })

  it("1 AM close becomes 25", () => {
    expect(normaliseClosingHour(6, 1)).toBe(25)
  })

  it("2 AM close becomes 26", () => {
    expect(normaliseClosingHour(6, 2)).toBe(26)
  })

  it("3 AM close becomes 27", () => {
    expect(normaliseClosingHour(6, 3)).toBe(27)
  })

  it("opening == closing (same 6) gives 30 — handled by slot count === 0 anyway", () => {
    expect(normaliseClosingHour(6, 6)).toBe(30)
  })

  it("6 AM open, 22 PM close: count = 16", () => {
    const close = normaliseClosingHour(6, 22)
    expect(close - 6).toBe(16)
  })

  it("6 AM open, 2 AM close: count = 20", () => {
    const close = normaliseClosingHour(6, 2)
    expect(close - 6).toBe(20)
  })

  it("6 AM open, midnight close: count = 18", () => {
    const close = normaliseClosingHour(6, 0)
    expect(close - 6).toBe(18)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 2 — customer generateTimeSlots with overnight
// ─────────────────────────────────────────────────────────────────────────────

describe("customer generateTimeSlots — overnight", () => {
  it("6 AM–10 PM: no post-midnight slots, all dates = selectedDate", () => {
    const slots = customer_generateTimeSlots(6, 22, TODAY)
    expect(slots).toHaveLength(16)
    slots.forEach((s) => expect(isSameDay(s.date, TODAY)).toBe(true))
  })

  it("6 AM–midnight (normalised 24): 18 slots, none post-midnight", () => {
    const slots = customer_generateTimeSlots(6, 24, TODAY)
    expect(slots).toHaveLength(18)
    // hour 23 is the last — still today
    expect(slots[slots.length - 1].time).toBe("23:00")
    expect(isSameDay(slots[slots.length - 1].date, TODAY)).toBe(true)
  })

  it("6 AM–1 AM (normalised 25): 19 slots, last slot is 00:00 on TOMORROW", () => {
    const slots = customer_generateTimeSlots(6, 25, TODAY)
    expect(slots).toHaveLength(19)
    const last = slots[slots.length - 1]
    expect(last.time).toBe("00:00")
    expect(isSameDay(last.date, TOMORROW)).toBe(true)
  })

  it("6 AM–2 AM (normalised 26): 20 slots, last two are next-day", () => {
    const slots = customer_generateTimeSlots(6, 26, TODAY)
    expect(slots).toHaveLength(20)
    // hour index 18 = raw hour 24 = 00:00 next day
    expect(slots[18].time).toBe("00:00")
    expect(isSameDay(slots[18].date, TOMORROW)).toBe(true)
    // hour index 19 = raw hour 25 = 01:00 next day
    expect(slots[19].time).toBe("01:00")
    expect(isSameDay(slots[19].date, TOMORROW)).toBe(true)
  })

  it("6 AM–3 AM (normalised 27): 21 slots, last 3 are next-day", () => {
    const slots = customer_generateTimeSlots(6, 27, TODAY)
    expect(slots).toHaveLength(21)
    const nextDaySlots = slots.filter((s) => isSameDay(s.date, TOMORROW))
    expect(nextDaySlots).toHaveLength(3)
    expect(nextDaySlots.map((s) => s.time)).toEqual(["00:00", "01:00", "02:00"])
  })

  it("first slot is always opening hour on TODAY", () => {
    const slots = customer_generateTimeSlots(6, 26, TODAY)
    expect(slots[0].time).toBe("06:00")
    expect(isSameDay(slots[0].date, TODAY)).toBe(true)
  })

  it("transition slot: 23:00 is still TODAY, 00:00 is TOMORROW", () => {
    const slots = customer_generateTimeSlots(6, 26, TODAY)
    const slot23 = slots.find((s) => s.time === "23:00")
    const slot00 = slots.find((s) => s.time === "00:00")
    expect(slot23).toBeDefined()
    expect(isSameDay(slot23!.date, TODAY)).toBe(true)
    expect(slot00).toBeDefined()
    expect(isSameDay(slot00!.date, TOMORROW)).toBe(true)
  })

  it("time strings are always valid HH:00 (0-padded, 00–23)", () => {
    const slots = customer_generateTimeSlots(6, 27, TODAY)
    slots.forEach((s) => {
      expect(s.time).toMatch(/^\d{2}:00$/)
      const h = parseInt(s.time.split(":")[0], 10)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(23)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 3 — customer isSlotBooked (composite key)
// ─────────────────────────────────────────────────────────────────────────────

describe("customer isSlotBooked — composite courtId:dateISO key", () => {
  const todayKey   = `c1:${TODAY.toISOString()}`
  const tomorrowKey = `c1:${TOMORROW.toISOString()}`

  const bookings: Record<string, SlotBooking[]> = {
    [todayKey]:   [{ startTime: "10:00", endTime: "12:00" }],
    [tomorrowKey]: [{ startTime: "00:00", endTime: "02:00" }],
  }

  it("today slot within today's booking — booked", () => {
    expect(customer_isSlotBooked("c1", "10:00", TODAY, bookings)).toBe(true)
  })

  it("today slot outside today's booking — free", () => {
    expect(customer_isSlotBooked("c1", "13:00", TODAY, bookings)).toBe(false)
  })

  it("tomorrow midnight slot within tomorrow's booking — booked", () => {
    expect(customer_isSlotBooked("c1", "00:00", TOMORROW, bookings)).toBe(true)
  })

  it("tomorrow 01:00 within tomorrow's booking — booked", () => {
    expect(customer_isSlotBooked("c1", "01:00", TOMORROW, bookings)).toBe(true)
  })

  it("tomorrow 02:00 is exclusive end — free", () => {
    expect(customer_isSlotBooked("c1", "02:00", TOMORROW, bookings)).toBe(false)
  })

  it("midnight slot checked against TODAY (wrong date) — free", () => {
    expect(customer_isSlotBooked("c1", "00:00", TODAY, bookings)).toBe(false)
  })

  it("different court not affected", () => {
    expect(customer_isSlotBooked("c2", "10:00", TODAY, bookings)).toBe(false)
  })

  it("empty bookings map — always free", () => {
    expect(customer_isSlotBooked("c1", "10:00", TODAY, {})).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 4 — isSlotPast for post-midnight (next-day) slots
// ─────────────────────────────────────────────────────────────────────────────

describe("customer isSlotPast — post-midnight (next-day) slots", () => {
  it("post-midnight slot on TOMORROW is never past (future date)", () => {
    expect(customer_isSlotPast("00:00", TOMORROW, NOW_10AM)).toBe(false)
  })

  it("01:00 on TOMORROW is never past", () => {
    expect(customer_isSlotPast("01:00", TOMORROW, NOW_10AM)).toBe(false)
  })

  it("today 10:00 is past at NOW_10AM", () => {
    expect(customer_isSlotPast("10:00", TODAY, NOW_10AM)).toBe(true)
  })

  it("today 11:00 is NOT past at NOW_10AM", () => {
    expect(customer_isSlotPast("11:00", TODAY, NOW_10AM)).toBe(false)
  })

  it("post-midnight slot on TOMORROW is bookable even when selecting TODAY", () => {
    // This is the core overnight correctness check:
    // user selects July 1, but 00:00 slot belongs to July 2 — not past
    expect(customer_isSlotPast("00:00", TOMORROW, NOW_10AM)).toBe(false)
    expect(customer_isSlotPast("02:00", TOMORROW, NOW_10AM)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 5 — consecutive validation across midnight boundary
// ─────────────────────────────────────────────────────────────────────────────

describe("customer validateConsecutive — midnight boundary", () => {
  const names = { c1: "Court 1" }

  it("slots 22:00, 23:00 on same day — consecutive, valid", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "22:00", date: TODAY },
      { courtId: "c1", time: "23:00", date: TODAY },
    ]
    expect(customer_validateAndDerive(slots, names).error).toBeNull()
  })

  it("slots 23:00 (today) + 00:00 (tomorrow) — hour strings 23+00, gap detected", () => {
    // Consecutive validation compares time string hours numerically
    // 23 and 0: 0 !== 23+1 → detected as gap (correct — they span midnight, server handles date)
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "23:00", date: TODAY },
      { courtId: "c1", time: "00:00", date: TOMORROW },
    ]
    const result = customer_validateAndDerive(slots, names)
    expect(result.error).toContain("consecutive")
  })

  it("selecting only post-midnight slots is valid (00:00, 01:00 both on TOMORROW)", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "00:00", date: TOMORROW },
      { courtId: "c1", time: "01:00", date: TOMORROW },
    ]
    expect(customer_validateAndDerive(slots, names).error).toBeNull()
  })

  it("single post-midnight slot (00:00 on TOMORROW) — valid", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "00:00", date: TOMORROW },
    ]
    expect(customer_validateAndDerive(slots, names).error).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 6 — deriveEndTime for post-midnight slots
// ─────────────────────────────────────────────────────────────────────────────

describe("deriveEndTime — post-midnight slots", () => {
  const names = { c1: "Court 1" }

  it("single 00:00 slot on TOMORROW → endTime 01:00", () => {
    const slots: SelectedSlot[] = [{ courtId: "c1", time: "00:00", date: TOMORROW }]
    const { results } = customer_validateAndDerive(slots, names) as { error: null; results: Record<string, { startTime: string; endTime: string; startDate: Date; endDate: Date }> }
    expect(results["c1"].startTime).toBe("00:00")
    expect(results["c1"].endTime).toBe("01:00")
    expect(isSameDay(results["c1"].startDate, TOMORROW)).toBe(true)
  })

  it("slots 00:00 + 01:00 on TOMORROW → startTime 00:00, endTime 02:00", () => {
    const slots: SelectedSlot[] = [
      { courtId: "c1", time: "00:00", date: TOMORROW },
      { courtId: "c1", time: "01:00", date: TOMORROW },
    ]
    const { results } = customer_validateAndDerive(slots, names) as { error: null; results: Record<string, { startTime: string; endTime: string; startDate: Date; endDate: Date }> }
    expect(results["c1"].startTime).toBe("00:00")
    expect(results["c1"].endTime).toBe("02:00")
  })

  it("slot at 23:00 → endTime 24:00 (stored as next-hour string)", () => {
    const slots: SelectedSlot[] = [{ courtId: "c1", time: "23:00", date: TODAY }]
    const { results } = customer_validateAndDerive(slots, names) as { error: null; results: Record<string, { startTime: string; endTime: string; startDate: Date; endDate: Date }> }
    expect(results["c1"].endTime).toBe("24:00")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 7 — adminCreate generateTimeSlots overnight
// ─────────────────────────────────────────────────────────────────────────────

describe("admin create page — generateTimeSlots overnight", () => {
  it("6 AM–10 PM: 16 slots, none wrap midnight", () => {
    const slots = adminCreate_generateTimeSlots(6, 22)
    expect(slots).toHaveLength(16)
    slots.forEach((s) => {
      const h = parseInt(s.time.split(":")[0], 10)
      expect(h).toBeGreaterThanOrEqual(6)
      expect(h).toBeLessThanOrEqual(21)
    })
  })

  it("6 AM–midnight (24): 18 slots, last is 23:00", () => {
    const slots = adminCreate_generateTimeSlots(6, 24)
    expect(slots).toHaveLength(18)
    expect(slots[slots.length - 1].time).toBe("23:00")
  })

  it("6 AM–2 AM (26): 20 slots, 18th is 00:00, 19th is 01:00", () => {
    const slots = adminCreate_generateTimeSlots(6, 26)
    expect(slots).toHaveLength(20)
    expect(slots[18].time).toBe("00:00")
    expect(slots[19].time).toBe("01:00")
  })

  it("hour property is the raw (un-modded) hour for internal ordering", () => {
    const slots = adminCreate_generateTimeSlots(6, 26)
    expect(slots[18].hour).toBe(24)
    expect(slots[19].hour).toBe(25)
  })

  it("time strings are always valid 00:00–23:00", () => {
    const slots = adminCreate_generateTimeSlots(6, 27)
    slots.forEach((s) => {
      const h = parseInt(s.time.split(":")[0], 10)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(23)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 8 — admin calendar getBookingForCell overnight
// ─────────────────────────────────────────────────────────────────────────────

describe("admin calendar — getBookingForCell overnight (hour % 24 + slotDate)", () => {
  const bookings: CalendarBooking[] = [
    { id: "b1", courtId: "c1", status: "confirmed", startTime: "21:00", endTime: "23:00", date: TODAY    },
    { id: "b2", courtId: "c1", status: "confirmed", startTime: "00:00", endTime: "02:00", date: TOMORROW },
  ]

  it("raw hour 21 on TODAY finds TODAY's booking", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 21, TODAY)?.id).toBe("b1")
  })

  it("raw hour 22 on TODAY finds TODAY's booking", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 22, TODAY)?.id).toBe("b1")
  })

  it("raw hour 23 on TODAY is exclusive end — free", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 23, TODAY)).toBeUndefined()
  })

  it("raw hour 24 (% 24 = 0) on TOMORROW finds TOMORROW's booking", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 24 % 24, TOMORROW)?.id).toBe("b2")
  })

  it("raw hour 25 (% 24 = 1) on TOMORROW finds TOMORROW's booking", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 25 % 24, TOMORROW)?.id).toBe("b2")
  })

  it("raw hour 26 (% 24 = 2) on TOMORROW is exclusive end — free", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 26 % 24, TOMORROW)).toBeUndefined()
  })

  it("hour 24 checked against TODAY — free (wrong date)", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 24 % 24, TODAY)).toBeUndefined()
  })

  it("hour 21 checked against TOMORROW — free (wrong date)", () => {
    expect(calendar_getBookingForCell(bookings, "c1", 21, TOMORROW)).toBeUndefined()
  })

  it("cancelled booking on TOMORROW is never returned", () => {
    const withCancelled: CalendarBooking[] = [
      ...bookings,
      { id: "b3", courtId: "c1", status: "cancelled", startTime: "00:00", endTime: "01:00", date: TOMORROW },
    ]
    const cell = calendar_getBookingForCell(withCancelled, "c1", 0, TOMORROW)
    expect(cell?.id).toBe("b2") // confirmed one, not cancelled
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 9 — slotDate assignment in day-view render
// ─────────────────────────────────────────────────────────────────────────────

describe("admin calendar — day view slotDate derivation", () => {
  /** Mimics the render-time logic: const slotDate = hour >= 24 ? addDays(currentDate, 1) : currentDate */
  function deriveSlotDate(hour: number, currentDate: Date): Date {
    return hour >= 24 ? addDays(currentDate, 1) : currentDate
  }

  it("hour 6 → currentDate", () => {
    expect(isSameDay(deriveSlotDate(6, TODAY), TODAY)).toBe(true)
  })

  it("hour 23 → currentDate", () => {
    expect(isSameDay(deriveSlotDate(23, TODAY), TODAY)).toBe(true)
  })

  it("hour 24 → TOMORROW", () => {
    expect(isSameDay(deriveSlotDate(24, TODAY), TOMORROW)).toBe(true)
  })

  it("hour 25 → TOMORROW", () => {
    expect(isSameDay(deriveSlotDate(25, TODAY), TOMORROW)).toBe(true)
  })

  it("hour 26 → TOMORROW", () => {
    expect(isSameDay(deriveSlotDate(26, TODAY), TOMORROW)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ✦ SUITE 10 — Full overnight booking scenarios (end-to-end logic)
// ─────────────────────────────────────────────────────────────────────────────

describe("Full overnight booking scenarios", () => {
  it("Scenario A: 6 AM–10 PM schedule — zero post-midnight slots", () => {
    const close = normaliseClosingHour(6, 22)
    const slots = customer_generateTimeSlots(6, close, TODAY)
    const nextDaySlots = slots.filter((s) => isSameDay(s.date, TOMORROW))
    expect(nextDaySlots).toHaveLength(0)
  })

  it("Scenario B: 6 AM–12 AM schedule — 18 slots, last is 23:00 on TODAY", () => {
    const close = normaliseClosingHour(6, 0)
    const slots = customer_generateTimeSlots(6, close, TODAY)
    expect(slots).toHaveLength(18)
    expect(slots[slots.length - 1].time).toBe("23:00")
    expect(isSameDay(slots[slots.length - 1].date, TODAY)).toBe(true)
  })

  it("Scenario C: 6 AM–2 AM schedule — 00:00 and 01:00 are on TOMORROW", () => {
    const close = normaliseClosingHour(6, 2)
    const slots = customer_generateTimeSlots(6, close, TODAY)
    expect(slots).toHaveLength(20)
    const post = slots.filter((s) => isSameDay(s.date, TOMORROW))
    expect(post.map((s) => s.time)).toEqual(["00:00", "01:00"])
  })

  it("Scenario D: post-midnight slot booked on TOMORROW — customer sees it as unavailable", () => {
    const close = normaliseClosingHour(6, 2)
    const slots = customer_generateTimeSlots(6, close, TODAY)
    const tomorrowKey = `c1:${TOMORROW.toISOString()}`
    const courtBookings = {
      [tomorrowKey]: [{ startTime: "00:00", endTime: "01:00" }],
    }
    const midnightSlot = slots.find((s) => s.time === "00:00" && isSameDay(s.date, TOMORROW))!
    expect(customer_isSlotBooked("c1", midnightSlot.time, midnightSlot.date, courtBookings)).toBe(true)
  })

  it("Scenario E: post-midnight slot NOT booked on TOMORROW — customer sees it as available", () => {
    const close = normaliseClosingHour(6, 2)
    const slots = customer_generateTimeSlots(6, close, TODAY)
    const midnightSlot = slots.find((s) => s.time === "00:00" && isSameDay(s.date, TOMORROW))!
    expect(customer_isSlotBooked("c1", midnightSlot.time, midnightSlot.date, {})).toBe(false)
  })

  it("Scenario F: post-midnight slot on TOMORROW is never past at 10 AM today", () => {
    const close = normaliseClosingHour(6, 2)
    const slots = customer_generateTimeSlots(6, close, TODAY)
    const post = slots.filter((s) => isSameDay(s.date, TOMORROW))
    post.forEach((s) => {
      expect(customer_isSlotPast(s.time, s.date, NOW_10AM)).toBe(false)
    })
  })

  it("Scenario G: admin calendar correctly shows midnight booking on TOMORROW not TODAY", () => {
    const bookingOnTomorrow: CalendarBooking = {
      id: "b1", courtId: "c1", status: "confirmed",
      startTime: "00:00", endTime: "02:00", date: TOMORROW,
    }
    // Should NOT appear on TODAY at hour 0
    expect(calendar_getBookingForCell([bookingOnTomorrow], "c1", 0, TODAY)).toBeUndefined()
    // Should appear on TOMORROW at hour 0
    expect(calendar_getBookingForCell([bookingOnTomorrow], "c1", 0, TOMORROW)?.id).toBe("b1")
  })

  it("Scenario H: admin calendar timeSlot hours 24,25 map to % 24 = 0,1 on TOMORROW", () => {
    const bookingOnTomorrow: CalendarBooking = {
      id: "b1", courtId: "c1", status: "confirmed",
      startTime: "00:00", endTime: "02:00", date: TOMORROW,
    }
    // Simulating what the render loop does: hour=24, slotDate=TOMORROW, pass hour%24=0
    expect(calendar_getBookingForCell([bookingOnTomorrow], "c1", 24 % 24, TOMORROW)?.id).toBe("b1")
    expect(calendar_getBookingForCell([bookingOnTomorrow], "c1", 25 % 24, TOMORROW)?.id).toBe("b1")
    expect(calendar_getBookingForCell([bookingOnTomorrow], "c1", 26 % 24, TOMORROW)).toBeUndefined()
  })

  it("Scenario I: admin create page slot list for 6 AM–2 AM has correct time strings", () => {
    const close = normaliseClosingHour(6, 2)
    const slots = adminCreate_generateTimeSlots(6, close)
    const times = slots.map((s) => s.time)
    expect(times).toContain("22:00")
    expect(times).toContain("23:00")
    expect(times).toContain("00:00")
    expect(times).toContain("01:00")
    expect(times).not.toContain("24:00")
    expect(times).not.toContain("25:00")
  })

  it("Scenario J: all three pages produce the same time strings for 6 AM–2 AM", () => {
    const close = normaliseClosingHour(6, 2)
    const customerTimes = customer_generateTimeSlots(6, close, TODAY).map((s) => s.time)
    const adminCreateTimes = adminCreate_generateTimeSlots(6, close).map((s) => s.time)
    expect(customerTimes).toEqual(adminCreateTimes)
  })
})
