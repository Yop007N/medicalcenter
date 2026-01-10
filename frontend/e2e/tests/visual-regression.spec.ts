import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, PatientsPage, AppointmentsPage } from '../pages';
import { TestUsers } from './fixtures/test-data';

/**
 * Visual Regression Tests
 * Screenshots for visual comparison across builds
 */
test.describe('Visual Regression', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let patientsPage: PatientsPage;
  let appointmentsPage: AppointmentsPage;

  test.describe('Login Page Screenshots', () => {

    test('login page - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      await expect(page).toHaveScreenshot('login-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('login page - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      await expect(page).toHaveScreenshot('login-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('login page - with error', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('wrong@email.com', 'wrongpassword');
      await loginPage.waitForLoadingComplete();

      // Wait for error to display
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-with-error.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Dashboard Screenshots', () => {

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);

      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();
    });

    test('dashboard - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('dashboard - tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('dashboard - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('dashboard - with side menu open', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.navigate();
      await dashboardPage.openMenu();
      await page.waitForTimeout(300); // Animation complete

      await expect(page).toHaveScreenshot('dashboard-menu-open.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Patients Page Screenshots', () => {

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      patientsPage = new PatientsPage(page);

      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();
    });

    test('patients list - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await patientsPage.navigate();
      await patientsPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('patients-list-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('patients list - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await patientsPage.navigate();
      await patientsPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('patients-list-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('patient form - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();
      await patientsPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('patient-form-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Appointments Page Screenshots', () => {

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      appointmentsPage = new AppointmentsPage(page);

      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();
    });

    test('appointments list - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await appointmentsPage.navigate();
      await appointmentsPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('appointments-list-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('appointments calendar - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await appointmentsPage.navigate();
      await appointmentsPage.switchToCalendarView();
      await appointmentsPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('appointments-calendar-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('appointments - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await appointmentsPage.navigate();
      await appointmentsPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('appointments-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Dark Mode Screenshots', () => {

    test('login page - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 1280, height: 720 });

      loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      await expect(page).toHaveScreenshot('login-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('dashboard - dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 1280, height: 720 });

      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);

      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Component Screenshots', () => {

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();
    });

    test('side menu component', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      dashboardPage = new DashboardPage(page);
      await dashboardPage.navigate();
      await dashboardPage.openMenu();

      const menu = page.locator('ion-menu');
      await expect(menu).toHaveScreenshot('side-menu-component.png', {
        animations: 'disabled'
      });
    });

    test('search input component', async ({ page }) => {
      patientsPage = new PatientsPage(page);
      await patientsPage.navigate();

      const searchbar = page.locator('ion-searchbar');
      if (await searchbar.isVisible()) {
        await expect(searchbar).toHaveScreenshot('searchbar-component.png', {
          animations: 'disabled'
        });
      }
    });

    test('FAB button component', async ({ page }) => {
      patientsPage = new PatientsPage(page);
      await patientsPage.navigate();

      const fab = page.locator('ion-fab');
      if (await fab.isVisible()) {
        await expect(fab).toHaveScreenshot('fab-button-component.png', {
          animations: 'disabled'
        });
      }
    });
  });
});
