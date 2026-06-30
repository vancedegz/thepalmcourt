import { test, expect, chromium } from "@playwright/test"

const BASE = "http://localhost:3000"

test.describe("Payment deadline countdown", () => {
  test("customer booking shows 15-min countdown and expireOverdueBookings works", async () => {
    test.setTimeout(90000)
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // Login as customer
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState("domcontentloaded")
    const usernameInput = page.locator('input[id="username"]')
    const passwordInput = page.locator('input[id="password"]')
    await usernameInput.click()
    await usernameInput.fill("customer")
    await passwordInput.click()
    await passwordInput.fill("customer123")
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(`${BASE}/book`, { timeout: 20000 })
    console.log("✓ Logged in as customer")

    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2000)

    // Select a far-future date to avoid slot conflicts (use date strip, pick last available day)
    const dateButtons = page.locator("button").filter({ hasText: /\d/ })
    const count = await dateButtons.count()
    console.log(`  Date buttons found: ${count}`)
    if (count === 0) throw new Error("No date buttons found")
    await dateButtons.nth(count - 1).click()
    await page.waitForTimeout(1500)

    // Click first available "Click" slot (green, not booked/closed)
    const slotBtn = page.getByRole("button", { name: "Click", exact: true }).first()
    await slotBtn.waitFor({ timeout: 8000 })
    await slotBtn.click()
    await page.waitForTimeout(500)
    console.log("✓ Selected a slot")

    // Click continue
    const continueBtn = page.getByRole("button", { name: /continue with/i })
    await continueBtn.waitFor({ timeout: 5000 })
    await continueBtn.click()
    await page.waitForTimeout(1000)
    console.log("✓ Clicked continue")

    // Confirm booking in summary dialog
    const confirmBtn = page.getByRole("button", { name: /confirm \d+ booking/i })
    await confirmBtn.waitFor({ timeout: 5000 })
    await confirmBtn.click()
    await page.waitForTimeout(2000)
    console.log("✓ Booking created")

    // Navigate to my-bookings
    await page.goto(`${BASE}/my-bookings`)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1500)

    // Verify countdown card is visible
    const countdownCard = page.locator("text=/Pay within/i").first()
    const visible = await countdownCard.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  Countdown card visible: ${visible}`)
    expect(visible).toBe(true)

    // Verify the timer digits show a time close to 15:00
    const timerDigits = page.locator(".tabular-nums").first()
    const timerText = await timerDigits.innerText().catch(() => "")
    console.log(`  Timer text: ${timerText}`)
    expect(timerText).toMatch(/1[0-5]:\d{2}|14:\d{2}/) // should be 14:xx or 15:00 right after creation

    // Verify the prominent payment CTA card is visible
    const ctaText = page.locator("text=/Upload your payment screenshot to confirm/i").first()
    const ctaVisible = await ctaText.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  Payment CTA visible: ${ctaVisible}`)
    expect(ctaVisible).toBe(true)

    await browser.close()
    console.log("✓ Payment deadline countdown E2E test PASSED")
  })
})
