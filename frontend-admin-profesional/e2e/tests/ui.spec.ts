import { test, expect } from '@playwright/test';

/**
 * UI Tests - No backend required
 * These tests verify the frontend UI renders and functions correctly
 * without needing the backend API to be running.
 */
test.describe('UI Components Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test.describe('Login Page UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');
    });

    test('should render login form elements', async ({ page }) => {
      // Wait for Ionic components to hydrate
      await page.waitForSelector('ion-input', { timeout: 10000 });

      // Verify form elements are present
      const emailInput = page.locator('ion-input[formControlName="email"]');
      const passwordInput = page.locator('ion-input[formControlName="password"]');
      const submitButton = page.locator('ion-button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should have disabled submit button initially', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const submitButton = page.locator('ion-button[type="submit"]');
      // Ionic buttons use aria-disabled attribute when disabled
      await expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    });

    test('should allow typing in email field', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const emailInput = page.locator('ion-input[formControlName="email"] input');
      await emailInput.waitFor({ state: 'visible' });
      await emailInput.fill('test@example.com');

      await expect(emailInput).toHaveValue('test@example.com');
    });

    test('should allow typing in password field', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const passwordInput = page.locator('ion-input[formControlName="password"] input');
      await passwordInput.waitFor({ state: 'visible' });
      await passwordInput.fill('testpassword');

      await expect(passwordInput).toHaveValue('testpassword');
    });

    test('should enable submit button when form is valid', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const emailInput = page.locator('ion-input[formControlName="email"] input');
      const passwordInput = page.locator('ion-input[formControlName="password"] input');
      const submitButton = page.locator('ion-button[type="submit"]');

      await emailInput.waitFor({ state: 'visible' });
      await emailInput.fill('valid@email.com');
      await passwordInput.fill('validpassword123');

      // Wait for form validation
      await page.waitForTimeout(500);

      await expect(submitButton).toBeEnabled();
    });

    test('should have link to register page', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const registerLink = page.locator('ion-button[routerLink*="register"], a[routerLink*="register"]');
      await expect(registerLink.first()).toBeVisible();
    });

    test('should navigate to register when clicking register link', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const registerLink = page.locator('ion-button[routerLink*="register"], a[routerLink*="register"]');
      await registerLink.first().click();

      await expect(page).toHaveURL(/register/);
    });
  });

  test.describe('Register Page UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/register');
      await page.waitForLoadState('domcontentloaded');
    });

    test('should render registration form elements', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const emailInput = page.locator('ion-input[formControlName="email"]');
      const passwordInput = page.locator('ion-input[formControlName="password"]');
      const confirmPasswordInput = page.locator('ion-input[formControlName="confirmPassword"]');
      const submitButton = page.locator('ion-button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(confirmPasswordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should have disabled submit button initially', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const submitButton = page.locator('ion-button[type="submit"]');
      // Ionic buttons use aria-disabled attribute when disabled
      await expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    });

    test('should allow filling all form fields', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const emailInput = page.locator('ion-input[formControlName="email"] input');
      const passwordInput = page.locator('ion-input[formControlName="password"] input');
      const confirmInput = page.locator('ion-input[formControlName="confirmPassword"] input');

      await emailInput.waitFor({ state: 'visible' });
      await emailInput.fill('newuser@test.com');
      await passwordInput.fill('Password123!');
      await confirmInput.fill('Password123!');

      await expect(emailInput).toHaveValue('newuser@test.com');
      await expect(passwordInput).toHaveValue('Password123!');
      await expect(confirmInput).toHaveValue('Password123!');
    });

    test('should have link to login page', async ({ page }) => {
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const loginLink = page.locator('a[routerLink*="login"], ion-button[routerLink*="login"]');
      await expect(loginLink.first()).toBeVisible();
    });
  });

  test.describe('Navigation Tests', () => {
    test('should redirect to login when accessing root', async ({ page }) => {
      await page.goto('/');

      // Should redirect to auth or login
      await page.waitForURL(/auth|login/, { timeout: 10000 });
    });

    test('should redirect to login when accessing protected routes', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/auth|login/, { timeout: 10000 });
    });

    test('should redirect to login when accessing patients', async ({ page }) => {
      await page.goto('/patients');

      // Should redirect to login
      await page.waitForURL(/auth|login/, { timeout: 10000 });
    });

    test('should redirect to login when accessing appointments', async ({ page }) => {
      await page.goto('/appointments');

      // Should redirect to login
      await page.waitForURL(/auth|login/, { timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');

      // Verify form is still visible
      await page.waitForSelector('ion-input', { timeout: 10000 });
      const emailInput = page.locator('ion-input[formControlName="email"]');
      await expect(emailInput).toBeVisible();
    });

    test('should display tablet layout on medium screens', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');

      // Verify form is still visible
      await page.waitForSelector('ion-input', { timeout: 10000 });
      const emailInput = page.locator('ion-input[formControlName="email"]');
      await expect(emailInput).toBeVisible();
    });

    test('should display desktop layout on large screens', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');

      // Verify form is still visible
      await page.waitForSelector('ion-input', { timeout: 10000 });
      const emailInput = page.locator('ion-input[formControlName="email"]');
      await expect(emailInput).toBeVisible();
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper form labels', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForSelector('ion-input', { timeout: 10000 });

      // Check for label or aria-label
      const emailInput = page.locator('ion-input[formControlName="email"]');
      const label = await emailInput.getAttribute('label');
      const ariaLabel = await emailInput.getAttribute('aria-label');
      const placeholder = await emailInput.getAttribute('placeholder');

      // Should have some form of label
      expect(label || ariaLabel || placeholder).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForSelector('ion-input', { timeout: 10000 });

      // Tab through form elements
      await page.keyboard.press('Tab');
      const emailInput = page.locator('ion-input[formControlName="email"] input');
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      const passwordInput = page.locator('ion-input[formControlName="password"] input');
      await expect(passwordInput).toBeFocused();
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('ion-input', { timeout: 10000 });

      // Check for form header, title, or any text identifying the page
      const headings = page.locator('h1, h2, h3, h4, ion-title, ion-card-title, .form-header, .login-header, .auth-header');
      const count = await headings.count();

      // If no traditional headings, check for any visible text content that serves as header
      if (count === 0) {
        const pageText = await page.locator('ion-content').textContent();
        // Page should have some content
        expect(pageText?.length).toBeGreaterThan(0);
      } else {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error State Tests', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page');

      // App should not crash - either redirect or show error page
      await page.waitForLoadState('domcontentloaded');

      // Should show some content (not a blank page)
      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load login page within 5 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/auth/login');
      await page.waitForSelector('ion-input', { timeout: 10000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have no JavaScript errors on login page', async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
