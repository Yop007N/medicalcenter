import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Dashboard Page Object Model
 * Handles all interactions with the dashboard page
 */
export class DashboardPage extends BasePage {
  // Locators - Navigation
  readonly sideMenu: Locator;
  readonly menuToggle: Locator;
  readonly navPatients: Locator;
  readonly navAppointments: Locator;
  readonly navProfessionals: Locator;
  readonly navMedicalRecords: Locator;
  readonly navBudgets: Locator;
  readonly navPayments: Locator;
  readonly navOdontology: Locator;
  readonly navPsychology: Locator;
  readonly navReports: Locator;
  readonly navAudit: Locator;
  readonly logoutButton: Locator;

  // Locators - Dashboard Content
  readonly pageTitle: Locator;
  readonly statsCards: Locator;
  readonly appointmentsWidget: Locator;
  readonly patientsWidget: Locator;
  readonly recentActivityWidget: Locator;
  readonly chartsContainer: Locator;

  constructor(page: Page) {
    super(page);
    // Navigation
    this.sideMenu = page.locator('ion-menu');
    this.menuToggle = page.locator('ion-menu-toggle');
    this.navPatients = page.locator('ion-item[routerLink="/patients"]');
    this.navAppointments = page.locator('ion-item[routerLink="/appointments"]');
    this.navProfessionals = page.locator('ion-item[routerLink="/professionals"]');
    this.navMedicalRecords = page.locator('ion-item[routerLink="/medical-records"]');
    this.navBudgets = page.locator('ion-item[routerLink="/budgets"]');
    this.navPayments = page.locator('ion-item[routerLink="/payments"]');
    this.navOdontology = page.locator('ion-item[routerLink="/odontology"]');
    this.navPsychology = page.locator('ion-item[routerLink="/psychology"]');
    this.navReports = page.locator('ion-item[routerLink="/reports"]');
    this.navAudit = page.locator('ion-item[routerLink="/audit"]');
    this.logoutButton = page.locator('[data-testid="logout-button"], ion-button:has-text("Cerrar sesión")');

    // Dashboard Content
    this.pageTitle = page.locator('ion-title, h1').first();
    this.statsCards = page.locator('.stats-card, ion-card.stat-card, .dashboard-stat');
    this.appointmentsWidget = page.locator('[data-testid="appointments-widget"], .appointments-widget');
    this.patientsWidget = page.locator('[data-testid="patients-widget"], .patients-widget');
    this.recentActivityWidget = page.locator('[data-testid="activity-widget"], .activity-widget');
    this.chartsContainer = page.locator('canvas, .chart-container');
  }

  /**
   * Navigate to dashboard
   */
  async navigate(): Promise<void> {
    await this.goto('/dashboard');
  }

  /**
   * Verify dashboard is displayed
   */
  async expectDashboardPage(): Promise<void> {
    await this.page.waitForURL('**/dashboard**');
    await this.waitForLoadingComplete();
  }

  /**
   * Open side menu (for mobile/tablet)
   */
  async openMenu(): Promise<void> {
    const menuButton = this.page.locator('ion-menu-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await this.sideMenu.waitFor({ state: 'visible' });
    }
  }

  /**
   * Navigate to a section via menu
   */
  async navigateToSection(section: string): Promise<void> {
    await this.openMenu();
    const menuItem = this.page.locator(`ion-item:has-text("${section}")`);
    await menuItem.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to patients page
   */
  async goToPatients(): Promise<void> {
    await this.navigateToSection('Pacientes');
    await this.page.waitForURL('**/patients**');
  }

  /**
   * Navigate to appointments page
   */
  async goToAppointments(): Promise<void> {
    await this.navigateToSection('Citas');
    await this.page.waitForURL('**/appointments**');
  }

  /**
   * Navigate to professionals page
   */
  async goToProfessionals(): Promise<void> {
    await this.navigateToSection('Profesionales');
    await this.page.waitForURL('**/professionals**');
  }

  /**
   * Navigate to medical records page
   */
  async goToMedicalRecords(): Promise<void> {
    await this.navigateToSection('Historiales');
    await this.page.waitForURL('**/medical-records**');
  }

  /**
   * Navigate to reports page
   */
  async goToReports(): Promise<void> {
    await this.navigateToSection('Reportes');
    await this.page.waitForURL('**/reports**');
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.openMenu();
    const logoutBtn = this.page.locator('ion-item:has-text("Cerrar sesión"), ion-item:has-text("Salir")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Try header logout button
      await this.logoutButton.click();
    }
    await this.page.waitForURL('**/auth/login**');
  }

  /**
   * Get stats card values
   */
  async getStatsValues(): Promise<{ [key: string]: string }> {
    const stats: { [key: string]: string } = {};
    const cards = await this.statsCards.all();
    for (const card of cards) {
      const title = await card.locator('.stat-title, .card-title, h3').textContent();
      const value = await card.locator('.stat-value, .card-value, .value').textContent();
      if (title && value) {
        stats[title.trim()] = value.trim();
      }
    }
    return stats;
  }

  /**
   * Check if dashboard widgets are loaded
   */
  async areWidgetsLoaded(): Promise<boolean> {
    await this.waitForLoadingComplete();
    const hasContent = await this.page.locator('ion-card, .widget, .dashboard-content').count() > 0;
    return hasContent;
  }

  /**
   * Get today's appointments count
   */
  async getTodayAppointmentsCount(): Promise<number> {
    const countElement = this.page.locator('[data-testid="today-appointments-count"], .today-appointments .count');
    if (await countElement.isVisible()) {
      const text = await countElement.textContent() || '0';
      return parseInt(text, 10);
    }
    return 0;
  }

  /**
   * Check if charts are rendered
   */
  async areChartsRendered(): Promise<boolean> {
    return await this.chartsContainer.count() > 0;
  }

  /**
   * Get user profile info
   */
  async getUserInfo(): Promise<{ name: string; email: string }> {
    await this.openMenu();
    const nameElement = this.page.locator('.user-name, .profile-name');
    const emailElement = this.page.locator('.user-email, .profile-email');
    return {
      name: await nameElement.textContent() || '',
      email: await emailElement.textContent() || ''
    };
  }

  /**
   * Quick action - Create new patient
   */
  async quickAddPatient(): Promise<void> {
    const addButton = this.page.locator('[data-testid="quick-add-patient"], ion-fab-button');
    if (await addButton.isVisible()) {
      await addButton.click();
    } else {
      await this.goToPatients();
    }
  }

  /**
   * Quick action - Create new appointment
   */
  async quickAddAppointment(): Promise<void> {
    const addButton = this.page.locator('[data-testid="quick-add-appointment"]');
    if (await addButton.isVisible()) {
      await addButton.click();
    } else {
      await this.goToAppointments();
    }
  }
}
