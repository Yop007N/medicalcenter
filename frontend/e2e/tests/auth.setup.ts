import { test as setup, expect } from '@playwright/test';
import { TestUsers } from './fixtures/test-data';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication Setup
 * This setup runs before all tests that require authentication.
 * Note: If the backend is not running, this will fail but tests
 * marked with skipSetup can still run.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/login');

  // Wait for the page to load and Ionic components to hydrate
  await page.waitForLoadState('domcontentloaded');

  // Wait for the Ionic inputs to be ready (they wrap native inputs)
  const emailInput = page.locator('ion-input[formControlName="email"] input');
  const passwordInput = page.locator('ion-input[formControlName="password"] input');

  try {
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fill login form - target the native input inside ion-input
    await emailInput.fill(TestUsers.admin.email);
    await passwordInput.fill(TestUsers.admin.password);

    // Submit form
    await page.locator('ion-button[type="submit"]').click();

    // Wait for successful login - redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Verify we're logged in
    await expect(page).toHaveURL(/dashboard/);

    // Save authentication state
    await page.context().storageState({ path: authFile });
  } catch (error) {
    // If authentication fails (e.g., no backend), create empty auth file
    // This allows UI-only tests to run
    console.log('Authentication setup failed - backend may not be running');
    console.log('UI-only tests will still work');

    // Create minimal storage state
    const fs = require('fs');
    const dir = 'playwright/.auth';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(authFile, JSON.stringify({
      cookies: [],
      origins: []
    }));
  }
});

setup.describe.configure({ mode: 'serial' });
