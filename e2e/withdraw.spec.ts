import { test, expect } from "@playwright/test";

test("withdraw happy path + restore after reload", async ({ page }) => {
    await page.goto("/withdraw");

    await page.getByLabel("Amount").fill("12");
    await page.getByLabel("Destination").fill("dest-1");
    await page.getByLabel("Confirm").check();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Withdrawal Created")).toBeVisible();
    await expect(page.getByText(/Status:/)).toBeVisible();

    await page.reload();

    await expect(page.getByText("Withdrawal Created")).toBeVisible();
    await expect(page.getByText(/Status:/)).toBeVisible();
});
