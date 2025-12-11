import { test, expect } from "@playwright/test";

test.describe("Background Analysis Persistence", () => {
  test("should persist analysis state when navigating to metrics and back", async ({
    page,
  }) => {
    console.log("Starting E2E Test: Background Analysis Persistence");

    // 1. Go to home page
    await page.goto("http://localhost:3000");

    // 2. Set project path (using the workspace path available in the environment)
    const pathInput = page.getByPlaceholder(
      "/projects/quality-gate-test-project",
    );
    await pathInput.fill("/home/andrea/Workspace/quality-gate-tool");

    // 3. Start Analysis (Watch Mode)
    const startButton = page.getByRole("button", { name: /START WATCH/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 4. Verify it started (Stop button appears)
    const stopButton = page.getByRole("button", { name: /STOP WATCH/i });
    await expect(stopButton).toBeVisible();
    console.log("Analysis started, Stop button visible");

    // 5. Navigate to Metrics Dashboard
    // Find the link. It might be an icon or text.
    const metricsLink = page.getByRole("link", { name: /Metrics Dashboard/i });
    await metricsLink.click();

    // 6. Verify URL
    await expect(page).toHaveURL(/.*\/metrics/);
    console.log("Navigated to Metrics Dashboard");

    // 7. Verify Metrics Page Content
    // We check for a heading or some text unique to metrics page
    // Based on file structure, it's a new page.
    // Let's assume it has a title or at least doesn't crash.
    // We can check for the "Metrics" text if it exists, or just the URL is enough for now.

    // 8. Navigate back to Home
    // We can use the browser back button or a "Home" link if it exists.
    // The sidebar might still be visible?
    // In AppShell, the sidebar is usually persistent if it's in Layout.
    // But page.tsx has AppShell.Aside, which suggests the sidebar is part of the page, not layout.
    // Let's check layout.tsx again.
    // layout.tsx only has Providers and MantineProvider.
    // page.tsx has AppShell.
    // So navigating to /metrics will likely remove the sidebar unless /metrics also uses AppShell.

    // Let's assume we use browser back.
    await page.goBack();
    console.log("Navigated back to Home");

    // 9. Verify we are back on Home
    await expect(page).toHaveURL("http://localhost:3000/");

    // 10. Verify "STOP WATCH" is still visible
    // This confirms that the frontend state (Zustand) persisted the "isWatching" state
    // and didn't reset it upon unmount/remount.
    await expect(stopButton).toBeVisible();
    console.log("Stop button still visible - State persisted");
  });
});
