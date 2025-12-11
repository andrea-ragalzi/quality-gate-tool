import { test, expect } from "@playwright/test";

test.describe("State Integrity & Flow Control", () => {
  test("E2E-001: State Integrity on Startup/Refresh", async ({ page }) => {
    // 1. Navigate to Dashboard
    await page.goto("/");

    // Handle Matrix Intro if present
    // Wait briefly to see if the intro appears (it might fade in)
    try {
      const skipButton = page.getByRole("button", { name: /SKIP/i });
      await skipButton.waitFor({ state: "visible", timeout: 2000 });
      await skipButton.click();
    } catch (e) {
      // Intro not present or skip button not found, continue
      console.log("Matrix Intro skipped or not present");
    }

    // 2. Simulate page reload
    await page.reload();

    // Handle Matrix Intro again after reload
    try {
      const skipButton = page.getByRole("button", { name: /SKIP/i });
      await skipButton.waitFor({ state: "visible", timeout: 2000 });
      await skipButton.click();
    } catch (e) {
      console.log("Matrix Intro skipped or not present after reload");
    }

    // 3. Assertions
    // Status indicator shows "SYSTEM READY" (Idle)
    await expect(page.locator(".dashboard__status-box--text")).toHaveText(
      /SYSTEM READY|Idle/i,
    );

    // Log Viewer is empty (Modal should not be open)
    // Check that no modal is currently visible
    await expect(page.locator(".mantine-Modal-root:visible")).toHaveCount(0);

    // Navigate to Metrics to check filters
    const metricsLink = page.getByRole("link", { name: /Metrics Dashboard/i });

    // Ensure the link is not just visible but also enabled and stable
    await expect(metricsLink).toBeVisible();
    await expect(metricsLink).toBeEnabled();

    // Force click if necessary, or just click
    await metricsLink.click();

    await expect(page).toHaveURL(/\/metrics/);

    // Verify table is empty (assuming no persisted state across reloads without localstorage persistence of logs)
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(0);
  });

  test("E2E-002: Guard: Prevent Analysis Without Project", async ({ page }) => {
    await page.goto("/");

    // 1. Ensure no project is actively selected
    const input = page.locator(
      'input[placeholder="/projects/quality-gate-test-project"]',
    );
    await input.fill("");

    // 2. Attempt to click "Start Watch"
    const startBtn = page.getByRole("button", { name: "START WATCH" });

    // Assertion 1: Button visually disabled
    await expect(startBtn).toBeDisabled();

    // Assertion 2: No API call
    let requestMade = false;
    page.on("request", (request) => {
      if (
        request.url().includes("/api/run-analysis") &&
        request.method() === "POST"
      ) {
        requestMade = true;
      }
    });

    // Try to force click (should not trigger event if disabled, but good to verify)
    await startBtn.click({ force: true });
    await page.waitForTimeout(500);
    expect(requestMade).toBe(false);
  });

  test("E2E-004: Watch Mode Cycle Stability", async ({ page }) => {
    await page.goto("/");

    // 1. Select Project
    const input = page.locator(
      'input[placeholder="/projects/quality-gate-test-project"]',
    );
    await input.fill("/home/andrea/Workspace/quality-gate-tool"); // Use self as target

    // 2. Click "Start Watch Mode"
    const startBtn = page.getByRole("button", { name: "START WATCH" });
    await startBtn.click();

    // Verify status changes to WATCHING
    await expect(page.locator(".dashboard__status-box--text")).toContainText(
      /LIVE WATCH/i,
      { timeout: 10000 },
    );

    // 3. Click "Stop Watch Mode"
    const stopBtn = page.getByRole("button", { name: "STOP WATCH" });
    await stopBtn.click();

    // Verify status changes back to READY
    await expect(page.locator(".dashboard__status-box--text")).toContainText(
      /SYSTEM READY/i,
      { timeout: 10000 },
    );

    // 4. Click "Start Watch Mode" again
    await startBtn.click();

    // Assertion: Verify status is WATCHING again
    await expect(page.locator(".dashboard__status-box--text")).toContainText(
      /LIVE WATCH/i,
      { timeout: 10000 },
    );

    // Cleanup
    await page.getByRole("button", { name: "STOP WATCH" }).click();
  });
});
