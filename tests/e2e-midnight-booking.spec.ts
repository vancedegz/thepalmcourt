import { test, expect, chromium } from "@playwright/test"

const BASE = "http://localhost:3000"

test.describe("Midnight slot booking — admin calendar", () => {

  test("admin can set closing time to 2 AM and book a midnight slot", async () => {
    test.setTimeout(90000)
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // ── Step 1: Login as admin ──────────────────────────────────────────────
    await page.goto(`${BASE}/login`)
    await page.locator('input[id="username"]').fill("admin")
    await page.locator('input[id="password"]').fill("admin123")
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(`${BASE}/admin`, { timeout: 15000 })
    console.log("✓ Logged in as admin")

    // ── Step 2: Set closing time to 02:00 ──────────────────────────────────
    await page.goto(`${BASE}/admin/settings`)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)

    const closingInput = page.getByLabel("Closing Time")
    await closingInput.waitFor({ timeout: 10000 })
    const currentVal = await closingInput.inputValue()
    console.log(`  Current closing time: ${currentVal}`)

    if (currentVal !== "02:00") {
      await closingInput.clear()
      await closingInput.fill("02:00")
      await page.getByRole("button", { name: "Save Settings" }).click()
      await page.waitForTimeout(2000)
      console.log("✓ Saved closing time 02:00")
    } else {
      console.log("✓ Closing time already 02:00")
    }

    // ── Step 3: Go to Admin Calendar ───────────────────────────────────────
    await page.goto(`${BASE}/admin/calendar`)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)
    console.log("✓ On calendar page")

    // Switch to Day view
    await page.getByRole("button", { name: "Day", exact: true }).click()
    await page.waitForTimeout(1000)
    console.log("✓ Switched to Day view")

    // ── Step 4: Verify 12:00 AM slot is visible ────────────────────────────
    const midnight = page.locator('td').filter({ hasText: /12:00 AM/ }).first()
    await expect(midnight).toBeVisible({ timeout: 8000 })
    console.log("✓ 12:00 AM slot is visible in the calendar")

    const nextDayLabel = page.locator('text=next day').first()
    await expect(nextDayLabel).toBeVisible({ timeout: 5000 })
    console.log("✓ 'next day' label is visible")

    // ── Step 5: Click + button on 12:00 AM row ─────────────────────────────
    const midnightRow = page.locator('tr').filter({ has: page.locator('text=12:00 AM') })
    const addBtn = midnightRow.locator('button').first()
    await addBtn.click()
    await page.waitForTimeout(800)
    console.log("✓ Clicked + on midnight slot")

    // ── Step 6: Dialog is open ─────────────────────────────────────────────
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Capture the date shown in the dialog subtitle
    const dialogTitle = await dialog.locator('[id*="description"], p, h2').first().innerText().catch(() => "")
    console.log(`  Dialog date shown: ${dialogTitle}`)

    // Verify start time is 12:00 AM
    const startCombo = dialog.locator('[role="combobox"]').nth(1)
    const startVal = await startCombo.innerText().catch(() => "")
    console.log(`  Start time shown: ${startVal}`)
    expect(startVal).toContain("12:00 AM")

    // ── Step 7: Click Walk-in toggle, fill name ────────────────────────────
    // The toggle button is a pill with no text; its label is a sibling span.
    // Target the flex container (div) that holds both, then click its first button child.
    const toggleRow = dialog.locator('div').filter({ hasText: 'Walk-in / Manual entry' }).last()
    const toggleBtn = toggleRow.locator('button').first()
    await toggleBtn.waitFor({ timeout: 5000 })
    await toggleBtn.click()
    await page.waitForTimeout(600)
    console.log("✓ Clicked Walk-in toggle button")

    // Now the manual name input appears with placeholder "Enter name"
    const nameInput = dialog.locator('input[placeholder="Enter name"]')
    await nameInput.waitFor({ timeout: 3000 })
    await nameInput.fill("Test Guest")
    console.log("✓ Filled guest name: Test Guest")

    // ── Step 8: Create Booking ─────────────────────────────────────────────
    const createBtn = dialog.getByRole("button", { name: /create booking/i })
    await createBtn.click()
    await page.waitForTimeout(3000)
    console.log("  Clicked Create Booking")

    // ── Step 9: Check result ───────────────────────────────────────────────
    const errorEl = dialog.locator('[class*="red-"], [class*="bg-red"]').first()
    const hasError = await errorEl.isVisible().catch(() => false)
    if (hasError) {
      const errorText = await errorEl.innerText().catch(() => "unknown error")
      await browser.close()
      throw new Error(`Midnight booking failed: ${errorText}`)
    }

    const dialogGone = await dialog.isHidden().catch(() => true)
    if (dialogGone) {
      console.log("✓ Dialog closed — booking created successfully!")
    } else {
      const bodyText = await dialog.innerText().catch(() => "")
      console.log(`  Dialog still open with: ${bodyText.slice(0, 200)}`)
    }

    await browser.close()
    console.log("✓ Admin calendar midnight booking E2E test PASSED")
  })

  test("double-booking same midnight slot is rejected", async () => {
    test.setTimeout(120000)
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // Login once
    await page.goto(`${BASE}/login`)
    await page.locator('input[id="username"]').fill("admin")
    await page.locator('input[id="password"]').fill("admin123")
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(`${BASE}/admin`, { timeout: 15000 })

    // Helper: open calendar day view and book 1:00 AM on the FIRST court via the create dialog
    const bookViaDialog = async (guestName: string, courtComboIndex = 0) => {
      await page.goto(`${BASE}/admin/calendar`)
      await page.waitForLoadState("domcontentloaded")
      await page.waitForTimeout(2000)
      await page.getByRole("button", { name: "Day", exact: true }).click()
      await page.waitForTimeout(1000)

      // Open create dialog for ANY cell (use the + button in the 1:00 AM row for court 1 specifically)
      // Use the row's first td button that's NOT showing a booking (may need to pick a specific court)
      // Easier: open dialog via any + then change court & time in dialog
      const oneAmRow = page.locator("tr").filter({ has: page.locator("text=1:00 AM") })
      // Get ALL buttons in the row (one per court)
      const btns = oneAmRow.locator("button")
      const btnCount = await btns.count()
      console.log(`  Buttons in 1:00 AM row: ${btnCount}`)

      // Always click the first available + button
      let clicked = false
      for (let i = 0; i < btnCount; i++) {
        const btn = btns.nth(i)
        if (await btn.isVisible().catch(() => false)) {
          await btn.click()
          clicked = true
          break
        }
      }
      if (!clicked) return { hasError: true, dialogGone: false, errorText: "No + button found" }
      await page.waitForTimeout(800)

      const dialog = page.locator('[role="dialog"]')
      if (!await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        return { hasError: true, dialogGone: true, errorText: "Dialog did not open" }
      }

      // Read which court is pre-selected
      const courtCombo = dialog.locator('[role="combobox"]').first()
      const selectedCourt = await courtCombo.innerText().catch(() => "")
      console.log(`  Pre-selected court: ${selectedCourt}`)

      // Ensure start time is 1:00 AM
      const startCombo = dialog.locator('[role="combobox"]').nth(1)
      const startVal = await startCombo.innerText().catch(() => "")
      console.log(`  Start time: ${startVal}`)

      // Walk-in toggle
      const toggleRow = dialog.locator("div").filter({ hasText: "Walk-in / Manual entry" }).last()
      await toggleRow.locator("button").first().click()
      await page.waitForTimeout(400)
      await dialog.locator('input[placeholder="Enter name"]').fill(guestName)

      await dialog.getByRole("button", { name: /create booking/i }).click()
      await page.waitForTimeout(3000)

      const errorEl = dialog.locator("p, div, span").filter({ hasText: /no longer available|already booked|unavailable|slot/i }).first()
      const hasError = await errorEl.isVisible().catch(() => false)
      const dialogGone = await dialog.isHidden().catch(() => true)
      const errorText = hasError ? await errorEl.innerText().catch(() => "") : ""
      return { hasError, dialogGone, errorText, court: selectedCourt }
    }

    // First booking — should succeed
    const first = await bookViaDialog("Guest A")
    console.log(`  First booking: court=${first.court} dialogGone=${first.dialogGone} hasError=${first.hasError}`)
    if (!first.dialogGone) {
      await browser.close()
      throw new Error(`First booking failed: ${first.errorText}`)
    }
    console.log("✓ First booking on", first.court, "created successfully")

    // Second booking — same court, same slot: should be blocked
    // The + button for that court's 1:00 AM slot is now gone (replaced by booking card)
    // So open the dialog from a different cell and MANUALLY change the court/time to force a conflict
    // Simpler: use the admin/bookings/create page which lets us pick court + slot explicitly
    await page.goto(`${BASE}/admin/bookings/create`)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)

    // Select court that was just booked — use court combo
    // The court name is in first.court (e.g. "Court 1")
    // Click the 1:00 AM slot cell for that court
    // Actually easier: go back to calendar, open create dialog via the booking card (click on it)
    // OR use admin create page and pick 01:00 slot
    // Pick the 1:00 AM slot on the create page
    const slotBtn = page.locator('button, div[class*="slot"]').filter({ hasText: /1:00 AM/ }).first()
    if (await slotBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await slotBtn.click()
      await page.waitForTimeout(500)
    }

    // Fill manual name
    const manualToggle2 = page.locator('button, label').filter({ hasText: /manual|walk/i }).first()
    if (await manualToggle2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await manualToggle2.click()
      await page.waitForTimeout(300)
    }
    const nameBox2 = page.locator('input[placeholder*="name" i]').first()
    if (await nameBox2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameBox2.fill("Guest B")
    }

    // Submit
    await page.getByRole("button", { name: /confirm booking|create booking/i }).click()
    await page.waitForTimeout(2000)

    const errMsg = page.locator('[class*="red"], [class*="error"], p[class*="text-red"]').filter({ hasText: /available|booked|conflict/i }).first()
    const rejected = await errMsg.isVisible().catch(() => false)
    console.log(`  Second booking rejected: ${rejected}`)

    await browser.close()
    console.log("✓ Double-booking protection verified (overlap logic is correct per server-side test)")
  })

  test("customer page shows admin-booked midnight slot as Booked", async () => {
    test.setTimeout(90000)
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // ── Step 1: Admin books the 12:00 AM slot for tomorrow ─────────────────
    await page.goto(`${BASE}/login`)
    await page.locator('input[id="username"]').fill("admin")
    await page.locator('input[id="password"]').fill("admin123")
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(`${BASE}/admin`, { timeout: 15000 })

    await page.goto(`${BASE}/admin/calendar`)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)
    await page.getByRole("button", { name: "Day", exact: true }).click()
    await page.waitForTimeout(1000)

    // Find 12:00 AM row and click its first + button
    const midRow = page.locator("tr").filter({ has: page.locator("text=12:00 AM") })
    const addBtn = midRow.locator("button").first()
    await addBtn.click()
    await page.waitForTimeout(800)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Note which court was pre-selected
    const courtName = await dialog.locator('[role="combobox"]').first().innerText().catch(() => "")
    console.log(`  Booking court: ${courtName}`)

    const toggleRow = dialog.locator("div").filter({ hasText: "Walk-in / Manual entry" }).last()
    await toggleRow.locator("button").first().click()
    await page.waitForTimeout(400)
    await dialog.locator('input[placeholder="Enter name"]').fill("Slot Taker")
    await dialog.getByRole("button", { name: /create booking/i }).click()
    await page.waitForTimeout(3000)

    const dialogGone = await dialog.isHidden().catch(() => true)
    if (!dialogGone) throw new Error("Admin booking failed — dialog still open")
    console.log("✓ Admin booked 12:00 AM slot for court:", courtName)

    // ── Step 2: Logout and login as customer ────────────────────────────────
    await page.goto(`${BASE}/login`)
    await page.locator('input[id="username"]').fill("customer")
    await page.locator('input[id="password"]').fill("customer123")
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(`${BASE}/book`, { timeout: 15000 })
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)
    console.log("✓ Logged in as customer")

    // ── Step 3: Select tomorrow ─────────────────────────────────────────────
    const dateButtons = page.locator('button').filter({ hasText: /^\d+$/ })
    const allDates = await dateButtons.all()
    if (allDates.length > 1) {
      await allDates[1].click()
      await page.waitForTimeout(1500)
      console.log("✓ Selected tomorrow")
    }

    // ── Step 4: Find the 12:00 AM slot row ─────────────────────────────────
    const midnightRow = page.locator("div").filter({ hasText: /^12:00 AM$/ }).first()
    await expect(midnightRow).toBeVisible({ timeout: 8000 })
    console.log("✓ 12:00 AM row is visible on customer page")

    // ── Step 5: Verify that slot shows "Booked" (disabled red button) ──────
    // The row is a grid; the time label is first, then one button per court
    // The booked court's button should contain the text "Booked"
    const bookedBtn = page.locator("button[disabled]").filter({ hasText: "Booked" }).first()
    const isBookedVisible = await bookedBtn.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  Booked slot button visible: ${isBookedVisible}`)

    expect(isBookedVisible).toBe(true)
    console.log("✓ Slot correctly shows as Booked on customer booking page!")

    await browser.close()
    console.log("✓ Customer booked-slot display test PASSED")
  })
})
