/**
 * Pure logic test of the overlap algorithm — no DB needed.
 */

function overlap(existing, startHour, endHour) {
  const effectiveEnd = endHour <= startHour ? endHour + 24 : endHour
  return existing.some((b) => {
    const [bStart] = b.startTime.split(":").map(Number)
    const [bEnd] = b.endTime.split(":").map(Number)
    const bEffectiveEnd = bEnd <= bStart ? bEnd + 24 : bEnd
    const standardOverlap = startHour < bEffectiveEnd && effectiveEnd > bStart
    const shiftedOverlap = (startHour + 24) < bEffectiveEnd && (effectiveEnd + 24) > bStart
    return standardOverlap || shiftedOverlap
  })
}

function check(label, existing, start, end, expectOverlap) {
  const [s] = start.split(":").map(Number)
  const [e] = end.split(":").map(Number)
  const result = overlap(existing, s, e)
  const pass = result === expectOverlap
  console.log(`${pass ? "✓" : "✗"} ${label}: overlap=${result} (expected ${expectOverlap})`)
  return pass
}

let allPass = true

// Same slot
allPass &= check("Exact duplicate 01:00-02:00",
  [{ startTime: "01:00", endTime: "02:00" }], "01:00", "02:00", true)

// Adjacent — should NOT overlap
allPass &= check("Adjacent 00:00-01:00 vs 01:00-02:00",
  [{ startTime: "00:00", endTime: "01:00" }], "01:00", "02:00", false)

// Adjacent other direction
allPass &= check("Adjacent 01:00-02:00 vs 00:00-01:00",
  [{ startTime: "01:00", endTime: "02:00" }], "00:00", "01:00", false)

// Partial overlap
allPass &= check("Partial overlap 00:00-02:00 vs 01:00-03:00",
  [{ startTime: "00:00", endTime: "02:00" }], "01:00", "03:00", true)

// Midnight wrap: booking 23:00-00:00 (effectiveEnd=24) vs new 23:30 impossible, use 23:00-01:00
allPass &= check("Midnight wrap exact duplicate 23:00-00:00",
  [{ startTime: "23:00", endTime: "00:00" }], "23:00", "00:00", true)

// Midnight wrap: existing 23:00-00:00 vs new 00:00-01:00 — adjacent, no overlap
allPass &= check("Midnight wrap adjacent: existing 23:00-00:00 vs new 00:00-01:00",
  [{ startTime: "23:00", endTime: "00:00" }], "00:00", "01:00", false)

// Midnight wrap: existing 23:00-01:00 vs new 00:00-01:00 — overlap
allPass &= check("Midnight wrap overlap: existing 23:00-01:00 vs new 00:00-01:00",
  [{ startTime: "23:00", endTime: "01:00" }], "00:00", "01:00", true)

// No existing — always free
allPass &= check("No existing bookings", [], "10:00", "12:00", false)

// Same-slot midnight: 00:00-01:00 duplicate
allPass &= check("Exact duplicate 00:00-01:00",
  [{ startTime: "00:00", endTime: "01:00" }], "00:00", "01:00", true)

console.log(allPass ? "\n✓ ALL OVERLAP TESTS PASSED" : "\n✗ SOME TESTS FAILED")
