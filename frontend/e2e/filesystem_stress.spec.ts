import { test, expect } from "@playwright/test";

test.describe("Filesystem Navigation Stress Test", () => {
  test("should navigate deep into directories and verify content", async ({
    page,
  }) => {
    console.log("Starting Filesystem Stress Test");

    // 1. Open App
    await page.goto("/");

    // 2. Open File Browser
    // The button has text "Browse"
    await page.getByRole("button", { name: "Browse" }).click();

    // 3. Wait for file system to load
    const fsContainer = page.locator(".file-system");
    await expect(fsContainer).toBeVisible();

    // Helper to get items
    const getItems = () => page.locator(".file-system__item");

    // Initial check
    // Wait for loading to disappear
    await expect(page.locator(".file-system__loading")).not.toBeVisible({
      timeout: 10000,
    });

    let items = getItems();
    let count = await items.count();
    console.log(`Root items found: ${count}`);

    // Check for empty state
    const emptyMsg = page.locator(".file-system__empty");
    if (await emptyMsg.isVisible()) {
      console.error("Root directory appears empty!");
      // We fail the test if root is empty as it shouldn't be in a normal linux env
      throw new Error("Root directory is empty - Suspicious behavior detected");
    }

    // Navigate down a few levels
    const maxDepth = 5;
    for (let i = 0; i < maxDepth; i++) {
      // Refresh items list handle
      items = getItems();
      count = await items.count();

      if (count === 0) {
        console.log("Current directory is empty.");
        break;
      }

      // Find a directory to click
      // We look for an item that does NOT have the file styling (opacity-50)
      let dirToClick = null;
      let dirName = "";

      for (let j = 0; j < count; j++) {
        const item = items.nth(j);
        const classes = await item.getAttribute("class");
        // In FileSystem3D.tsx, files have "opacity-50 cursor-default"
        if (classes && !classes.includes("opacity-50")) {
          dirName =
            (await item.locator(".file-system__item-name").textContent()) || "";
          // Prefer not to go into hidden folders if possible, or specific system ones if we want to be safe
          // But for stress testing, let's just pick the first valid one that isn't '.' or '..' (though those aren't shown usually)
          if (dirName) {
            dirToClick = item;
            break;
          }
        }
      }

      if (dirToClick) {
        console.log(`Navigating into: ${dirName}`);
        await dirToClick.click();

        // Wait for loading to start and then finish
        // Note: If it's very fast, we might miss the "visible" state of loading.
        // Safer to wait for the path to update or items to change, but loading check is usually okay if network is involved.
        // Let's wait for a bit of stability or the loading indicator.
        try {
          await expect(page.locator(".file-system__loading")).toBeVisible({
            timeout: 2000,
          });
        } catch (e) {
          // It might have been too fast
        }
        await expect(page.locator(".file-system__loading")).not.toBeVisible();

        // Verify we are not empty (unless it's really empty)
        const newCount = await getItems().count();
        console.log(`Items in ${dirName}: ${newCount}`);

        if (newCount === 0) {
          const isEmptyVisible = await page
            .locator(".file-system__empty")
            .isVisible();
          if (isEmptyVisible) {
            console.warn(`Warning: Directory ${dirName} is empty.`);
          } else {
            // If count is 0 but empty message is not visible, something might be wrong (or still rendering)
            console.warn(
              `Warning: No items found in ${dirName} and no empty message.`,
            );
          }
        }
      } else {
        console.log("No more subdirectories found to traverse.");
        break;
      }
    }

    console.log("Navigation test completed successfully.");
  });
});
