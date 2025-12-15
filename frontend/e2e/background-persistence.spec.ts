import { test, expect } from "@playwright/test";

test.describe("Background Analysis Persistence", () => {
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

  test("should persist analysis state when reloading the page", async ({
    page,
  }) => {
    console.log("Starting E2E Test: Background Analysis Persistence");

    // 1. Go to home page (Handled in beforeEach)

    // Settings sidebar is open by default; only open it if needed
    const pathInput = page.getByPlaceholder("/path/to/project");
    if (!(await pathInput.isVisible())) {
      await page
        .getByRole("button", { name: "Toggle Settings", exact: true })
        .click();
    }

    // 2. Set project path (using the workspace path available in the environment)
    await pathInput.fill("/home/andrea/Workspace/quality-gate-tool");

    // 3. Start Analysis (Watch Mode)
    const startButton = page.getByRole("button", { name: /START WATCH/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 4. Verify it started (Stop button appears)
    const stopButton = page.getByRole("button", { name: /STOP WATCH/i });
    await expect(stopButton).toBeVisible();
    console.log("Analysis started, Stop button visible");

    // 5. Reload the page
    await page.reload();
    console.log("Page reloaded");

    // Handle Matrix Intro if it appears after reload
    try {
      const skipButton = page.getByRole("button", { name: /JUMP/i });
      if (await skipButton.isVisible({ timeout: 5000 })) {
        console.log("JUMP button found, clicking...");
        await skipButton.click({ timeout: 2000 });
      } else {
        console.log("JUMP button not found within 5s");
      }
    } catch (e) {
      console.log(
        "Matrix Intro handling: ",
        e instanceof Error ? e.message : e,
      );
    }

    // 6. Verify "STOP WATCH" is still visible
    // This confirms that the frontend state (Zustand) persisted the "isWatching" state
    await expect(stopButton).toBeVisible();
    console.log("Stop button still visible - State persisted");
  });
});
