import { test, expect } from "@playwright/test";

test.describe("State Integrity & Flow Control", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const skipBtn = page.getByRole("button", { name: /JUMP/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }
    await expect(page.getByText("Quality Gate")).toBeVisible({
      timeout: 15000,
    });
  });

  test("E2E-001: State Integrity on Startup/Refresh", async ({ page }) => {
    // 1. Navigate to Dashboard (Handled in beforeEach)

    // 2. Simulate page reload
    await page.reload();

    // Handle Matrix Intro again after reload
    try {
      const skipButton = page.getByRole("button", { name: /JUMP/i });
      // Check if button appears within 5 seconds
      if (await skipButton.isVisible({ timeout: 5000 })) {
        console.log("JUMP button found, clicking...");
        // Use a short timeout for the click. If the element detaches (intro finishes),
        // we don't want to wait until the test times out.
        await skipButton.click({ timeout: 2000 });
      } else {
        console.log(
          "JUMP button not found within 5s (Intro might be skipped or finished)",
        );
      }
    } catch (e) {
      // Ignore click errors (e.g. if button disappears/detaches)
      console.log(
        "Matrix Intro handling: ",
        e instanceof Error ? e.message : e,
      );
    }

    // Wait for ANY dashboard element to confirm we are on the dashboard
    // "Quality Gate" is in the header
    await expect(page.getByText("Quality Gate").first()).toBeVisible({
      timeout: 15000,
    });

    // Settings sidebar is open by default; only open it if needed
    const statusText = page.locator(".status-text").first();
    if (!(await statusText.isVisible())) {
      await page
        .getByRole("button", { name: "Toggle Settings", exact: true })
        .click();
    }

    // 3. Assertions
    // Status indicator shows "SYSTEM READY" (Idle)
    await expect(page.locator(".status-text")).toHaveText(/SYSTEM READY|Idle/i);

    // Log Viewer is empty (Modal should not be open)
    // Check that no modal is currently visible
    await expect(page.locator(".mantine-Modal-root:visible")).toHaveCount(0);

    // Verify Unified Dashboard elements are present instead of navigating to /metrics
    // Check for View Filters sidebar
    await expect(page.getByText("VIEW FILTERS")).toBeVisible();

    // Check for Active Modules section (Header with count)
    await expect(page.getByText(/> ACTIVE MODULES/)).toBeVisible();

    // Check for DataGrid (Table view is default)
    // It might be empty, but the container should be there
    // We can check for the tabs
    await expect(page.getByText("TABLE")).toBeVisible();
    await expect(page.getByText("JSON")).toBeVisible();
  });

  test("E2E-002: Guard: Prevent Analysis Without Project", async ({ page }) => {
    // Settings sidebar is open by default; only open it if needed
    const input = page.locator('input[placeholder="/path/to/project"]');
    if (!(await input.isVisible())) {
      await page
        .getByRole("button", { name: "Toggle Settings", exact: true })
        .click();
    }

    // 1. Ensure no project is actively selected
    await input.fill("");

    // Close sidebar to see the Start Watch button (if it was covered, though it's in header)
    // Actually, Start Watch is in header, so it's always visible.
    // But let's keep sidebar open or close it? It doesn't matter much for visibility of header.

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
    // Settings sidebar is open by default; only open it if needed
    const input = page.locator('input[placeholder="/path/to/project"]');
    if (!(await input.isVisible())) {
      await page
        .getByRole("button", { name: "Toggle Settings", exact: true })
        .click();
    }

    // 1. Select Project
    await input.fill("/home/andrea/Workspace/quality-gate-tool"); // Use self as target

    // 2. Click "Start Watch Mode"
    const startBtn = page.getByRole("button", { name: "START WATCH" });
    await startBtn.click();

    // Verify status changes to WATCHING
    await expect(page.locator(".status-text")).toContainText(/WATCHING/i, {
      timeout: 10000,
    });

    // 3. Click "Stop Watch Mode"
    const stopBtn = page.getByRole("button", { name: "STOP WATCH" });
    await stopBtn.click();

    // Verify status changes back to READY
    await expect(page.locator(".status-text")).toContainText(/SYSTEM READY/i, {
      timeout: 10000,
    });

    // 4. Click "Start Watch Mode" again
    await startBtn.click();

    // Assertion: Verify status is WATCHING again
    await expect(page.locator(".status-text")).toContainText(/WATCHING/i, {
      timeout: 10000,
    });

    // Cleanup
    await page.getByRole("button", { name: "STOP WATCH" }).click();
  });
});
