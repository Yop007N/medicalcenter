import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Register Page Object Model
 * Handles all interactions with the registration page
 */
export class RegisterPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly showPasswordToggle: Locator;
  readonly showConfirmPasswordToggle: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    // Ionic web components wrap native inputs - target the inner input element
    this.emailInput = page.locator('ion-input[formControlName="email"] input');
    this.passwordInput = page.locator('ion-input[formControlName="password"] input');
    this.confirmPasswordInput = page.locator('ion-input[formControlName="confirmPassword"] input');
    this.submitButton = page.locator('ion-button[type="submit"]');
    this.loginLink = page.locator('a[routerLink="/auth/login"]');
    this.errorMessage = page.locator('ion-text[color="danger"].error-message');
    this.showPasswordToggle = page.locator('ion-item:has(ion-input[formControlName="password"]) .password-toggle');
    this.showConfirmPasswordToggle = page.locator('ion-item:has(ion-input[formControlName="confirmPassword"]) .password-toggle');
    this.pageTitle = page.locator('ion-card-title');
  }

  /**
   * Navigate to register page
   */
  async navigate(): Promise<void> {
    await this.goto('/auth/register');
  }

  /**
   * Fill registration form
   */
  async fillRegistrationForm(email: string, password: string, confirmPassword: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Submit registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow
   */
  async register(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.fillRegistrationForm(email, password, confirmPassword || password);
    await this.submit();
  }

  /**
   * Navigate to login page
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }

  /**
   * Verify register page is displayed
   */
  async expectRegisterPage(): Promise<void> {
    // Wait for Ionic components to hydrate
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.emailInput).toBeVisible({ timeout: 10000 });
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
  }

  /**
   * Verify successful registration
   */
  async expectRegistrationSuccess(): Promise<void> {
    await this.waitForLoadingComplete();
    // After registration, user should be redirected to login or dashboard
    await this.page.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 10000 });
  }

  /**
   * Verify registration error
   */
  async expectRegistrationError(message?: string): Promise<void> {
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
    const errorElement = this.page.locator('ion-text.error-text:below(ion-input[formControlName="email"])').first();
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  /**
   * Get password validation error
   */
  async getPasswordValidationError(): Promise<string> {
    const errorElement = this.page.locator('ion-text.error-text:below(ion-input[formControlName="password"])').first();
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  /**
   * Get password mismatch error
   */
  async getPasswordMismatchError(): Promise<string> {
    const errorElement = this.page.locator('ion-text.error-text:below(ion-input[formControlName="confirmPassword"])').first();
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordToggle.click();
  }

  /**
   * Toggle confirm password visibility
   */
  async toggleConfirmPasswordVisibility(): Promise<void> {
    await this.showConfirmPasswordToggle.click();
  }
}
