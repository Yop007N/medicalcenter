import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Login Page Object Model
 * Handles all interactions with the login page
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly showPasswordToggle: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    // Ionic web components wrap native inputs - target the inner input element
    this.emailInput = page.locator('ion-input[formControlName="email"] input');
    this.passwordInput = page.locator('ion-input[formControlName="password"] input');
    this.submitButton = page.locator('ion-button[type="submit"]');
    this.registerLink = page.locator('ion-button[routerLink="/auth/register"]');
    this.forgotPasswordLink = page.locator('a.forgot-link');
    this.errorMessage = page.locator('.alert-error');
    this.showPasswordToggle = page.locator('.toggle-password');
    this.pageTitle = page.locator('.form-header h2');
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto('/auth/login');
  }

  /**
   * Fill login form with credentials
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.submit();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordToggle.click();
  }

  /**
   * Check if password is visible
   */
  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text' || type === null;
  }

  /**
   * Navigate to register page
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Verify login page is displayed
   */
  async expectLoginPage(): Promise<void> {
    // Wait for Ionic components to hydrate
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.emailInput).toBeVisible({ timeout: 10000 });
    await expect(this.passwordInput).toBeVisible();
  }

  /**
   * Verify successful login (redirected to dashboard)
   */
  async expectLoginSuccess(): Promise<void> {
    await this.waitForLoadingComplete();
    await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
  }

  /**
   * Verify login error is displayed
   */
  async expectLoginError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Get email validation error
   */
  async getEmailValidationError(): Promise<string> {
    const errorElement = this.page.locator('.form-group:has(ion-input[formControlName="email"]) .error-message');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  /**
   * Get password validation error
   */
  async getPasswordValidationError(): Promise<string> {
    const errorElement = this.page.locator('.form-group:has(ion-input[formControlName="password"]) .error-message');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || '';
    }
    return '';
  }
}
