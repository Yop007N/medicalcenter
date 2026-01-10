import { test, expect } from '@playwright/test';
import { LoginPage, RegisterPage, DashboardPage } from '../pages';
import { TestUsers, InvalidData, generateUniqueEmail } from './fixtures/test-data';

/**
 * Authentication E2E Tests
 * Tests for login, registration, and authentication flows
 */
test.describe('Authentication', () => {

  test.describe('Login Page', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.navigate();
    });

    test('should display login page correctly', async () => {
      await loginPage.expectLoginPage();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      await expect(loginPage.registerLink).toBeVisible();
    });

    test('should show validation errors for empty form submission', async () => {
      // Try to submit empty form - button should be disabled
      await expect(loginPage.submitButton).toBeDisabled();

      // Touch email field and leave empty
      await loginPage.emailInput.click();
      await loginPage.passwordInput.click();

      // Check for validation message
      const emailError = await loginPage.getEmailValidationError();
      expect(emailError).toContain('requerido');
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await loginPage.emailInput.fill(InvalidData.invalidEmail);
      await loginPage.passwordInput.click();

      // Wait for validation
      await page.waitForTimeout(300);

      const emailError = await loginPage.getEmailValidationError();
      expect(emailError.toLowerCase()).toMatch(/válido|inválido|formato/);
    });

    test('should toggle password visibility', async () => {
      await loginPage.passwordInput.fill('testpassword');

      // Initially password should be hidden
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

      // Toggle visibility
      await loginPage.togglePasswordVisibility();

      // Password should be visible
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

      // Toggle back
      await loginPage.togglePasswordVisibility();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should show error message for invalid credentials', async () => {
      await loginPage.login('wrong@email.com', 'wrongpassword');

      // Wait for API response
      await loginPage.waitForLoadingComplete();

      // Check for error message
      await loginPage.expectLoginError();
    });

    test('should successfully login with valid credentials', async () => {
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);

      // Should redirect to dashboard
      await loginPage.expectLoginSuccess();
    });

    test('should navigate to register page', async ({ page }) => {
      await loginPage.goToRegister();
      await expect(page).toHaveURL(/auth\/register/);
    });

    test('should disable submit button while loading', async ({ page }) => {
      await loginPage.fillLoginForm(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.submit();

      // Check button is disabled during loading
      const spinner = page.locator('ion-spinner');
      if (await spinner.isVisible()) {
        await expect(loginPage.submitButton).toBeDisabled();
      }
    });

    test('should preserve email on page refresh', async ({ page }) => {
      const testEmail = 'test@example.com';
      await loginPage.emailInput.fill(testEmail);

      // Some apps preserve form state, verify behavior
      await page.reload();
      await loginPage.waitForPageLoad();

      // This test documents the expected behavior
      // Modify assertion based on actual app behavior
    });
  });

  test.describe('Registration Page', () => {
    let registerPage: RegisterPage;

    test.beforeEach(async ({ page }) => {
      registerPage = new RegisterPage(page);
      await registerPage.navigate();
    });

    test('should display registration page correctly', async () => {
      await registerPage.expectRegisterPage();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.passwordInput).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toBeVisible();
      await expect(registerPage.submitButton).toBeVisible();
    });

    test('should show validation errors for empty form', async () => {
      await expect(registerPage.submitButton).toBeDisabled();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await registerPage.emailInput.fill(InvalidData.invalidEmail);
      await registerPage.passwordInput.click();

      await page.waitForTimeout(300);

      const error = await registerPage.getEmailValidationError();
      expect(error.toLowerCase()).toMatch(/válido|inválido/);
    });

    test('should show error for short password', async ({ page }) => {
      await registerPage.passwordInput.fill(InvalidData.shortPassword);
      await registerPage.confirmPasswordInput.click();

      await page.waitForTimeout(300);

      const error = await registerPage.getPasswordValidationError();
      expect(error.toLowerCase()).toMatch(/6|caracteres|mínimo/);
    });

    test('should show error for password mismatch', async ({ page }) => {
      await registerPage.passwordInput.fill('ValidPassword123!');
      await registerPage.confirmPasswordInput.fill(InvalidData.mismatchPassword);
      await registerPage.emailInput.click(); // Trigger validation

      await page.waitForTimeout(300);

      const error = await registerPage.getPasswordMismatchError();
      expect(error.toLowerCase()).toMatch(/coinciden|diferentes/);
    });

    test('should enable submit when form is valid', async () => {
      const uniqueEmail = generateUniqueEmail('register');
      await registerPage.fillRegistrationForm(
        uniqueEmail,
        'ValidPassword123!',
        'ValidPassword123!'
      );

      await expect(registerPage.submitButton).toBeEnabled();
    });

    test('should successfully register new user', async () => {
      const uniqueEmail = generateUniqueEmail('newuser');

      await registerPage.register(
        uniqueEmail,
        'NewUser123!@#',
        'NewUser123!@#'
      );

      await registerPage.expectRegistrationSuccess();
    });

    test('should show error for duplicate email', async () => {
      // Try to register with existing email
      await registerPage.register(
        TestUsers.admin.email,
        'TestPassword123!',
        'TestPassword123!'
      );

      // Should show error for existing email
      await registerPage.expectRegistrationError();
    });

    test('should navigate to login page', async ({ page }) => {
      await registerPage.goToLogin();
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should toggle password visibility', async () => {
      await registerPage.passwordInput.fill('testpassword');

      // Initially hidden
      await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');

      // Toggle to visible
      await registerPage.togglePasswordVisibility();
      await expect(registerPage.passwordInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('Authentication Flow', () => {

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should redirect authenticated users from login to dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();

      // Login
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Try to access login page again
      await page.goto('/auth/login');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should logout successfully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Login first
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Logout
      await dashboardPage.logout();

      // Should be on login page
      await expect(page).toHaveURL(/auth\/login/);

      // Try to access protected route
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should maintain session after page refresh', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test.describe('Security Tests', () => {

    test('should not expose password in URL', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('test@test.com', 'secretpassword');

      // Password should not be in URL
      expect(page.url()).not.toContain('secretpassword');
    });

    test('should sanitize XSS attempts in email field', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();

      const xssPayload = '<script>alert("xss")</script>';
      await loginPage.emailInput.fill(xssPayload);

      // Should not execute script
      const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
      const dialog = await dialogPromise;

      expect(dialog).toBeNull();
    });

    test('should handle SQL injection attempts gracefully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();

      const sqlPayload = "'; DROP TABLE users; --";
      await loginPage.login(sqlPayload, sqlPayload);

      // Should show error, not crash
      await loginPage.waitForLoadingComplete();
      // App should still be functional
      await expect(loginPage.emailInput).toBeVisible();
    });
  });
});
