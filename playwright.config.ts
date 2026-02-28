import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    retries: 0,
    use: {
        baseURL: "http://localhost:3000",
        headless: true,
    },
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
});
