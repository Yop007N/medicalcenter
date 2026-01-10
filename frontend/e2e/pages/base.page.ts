import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model
 * Contains common methods and utilities for all page objects
 */
export class BasePage {
  readonly page: Page;
  readonly loadingSpinner: Locator;
  readonly toastMessage: Locator;
  readonly alertDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingSpinner = page.locator('ion-spinner');
    this.toastMessage = page.locator('ion-toast');
    this.alertDialog = page.locator('ion-alert');
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoadingComplete(): Promise<void> {
    const spinner = this.page.locator('ion-spinner');
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  /**
   * Get toast message text
   */
  async getToastMessage(): Promise<string> {
    await this.toastMessage.waitFor({ state: 'visible' });
    return await this.toastMessage.textContent() || '';
  }

  /**
   * Wait for toast to appear and verify message
   */
  async expectToast(expectedMessage: string): Promise<void> {
    await expect(this.toastMessage).toBeVisible();
    await expect(this.toastMessage).toContainText(expectedMessage);
  }

  /**
   * Click a button by its text
   */
  async clickButton(text: string): Promise<void> {
    await this.page.locator(`ion-button:has-text("${text}")`).click();
  }

  /**
   * Fill an Ionic input field
   */
  async fillInput(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector);
    await input.click();
    await input.fill(value);
  }

  /**
   * Select option from Ionic select
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).click();
    await this.page.locator(`ion-select-option[value="${value}"]`).click();
    await this.page.locator('ion-alert button:has-text("OK")').click();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Wait for URL to contain specific path
   */
  async waitForUrl(path: string): Promise<void> {
    await this.page.waitForURL(`**/${path}**`);
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for network request to complete
   */
  async waitForRequest(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  /**
   * Handle alert dialog
   */
  async handleAlert(action: 'accept' | 'dismiss'): Promise<void> {
    const alertButtons = this.alertDialog.locator('button');
    if (action === 'accept') {
      await alertButtons.last().click();
    } else {
      await alertButtons.first().click();
    }
  }

  /**
   * Check if current URL matches path
   */
  async expectUrl(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Get element text content
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Count elements matching selector
   */
  async countElements(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }
}
