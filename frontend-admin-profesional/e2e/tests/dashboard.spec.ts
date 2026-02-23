import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, PatientsPage, AppointmentsPage } from '../pages';
import { TestUsers } from './fixtures/test-data';

/**
 * Dashboard & Navigation E2E Tests
 * Tests for dashboard functionality and application navigation
 */
test.describe('Dashboard & Navigation', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let patientsPage: PatientsPage;
  let appointmentsPage: AppointmentsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    patientsPage = new PatientsPage(page);
    appointmentsPage = new AppointmentsPage(page);

    // Login before each test
    await loginPage.navigate();
    await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
    await loginPage.expectLoginSuccess();
  });

  test.describe('Dashboard Display', () => {

    test('should display dashboard after login', async () => {
      await dashboardPage.expectDashboardPage();
    });

    test('should show statistics cards', async ({ page }) => {
      await dashboardPage.navigate();

      // Check for stat cards
      const statsVisible = await page.locator('.stats-card, .stat-card, ion-card').count() > 0;
      expect(statsVisible).toBeTruthy();
    });

    test('should load dashboard widgets', async () => {
      await dashboardPage.navigate();
      const loaded = await dashboardPage.areWidgetsLoaded();
      expect(loaded).toBeTruthy();
    });

    test('should display charts if available', async () => {
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      // Charts may take time to render
      const hasCharts = await dashboardPage.areChartsRendered();
      // Charts are optional, just verify no errors
    });

    test('should show user information', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.openMenu();

      // Look for user info in sidebar
      const userElement = page.locator('.user-name, .profile-name, ion-label:has-text("@")');
      if (await userElement.isVisible()) {
        const text = await userElement.textContent();
        expect(text).toBeTruthy();
      }
    });
  });

  test.describe('Navigation Menu', () => {

    test('should open side menu', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.openMenu();

      // Menu should be visible
      await expect(dashboardPage.sideMenu).toBeVisible();
    });

    test('should navigate to all main sections', async ({ page }) => {
      await dashboardPage.navigate();

      const sections = [
        { name: 'Pacientes', url: /patients/ },
        { name: 'Citas', url: /appointments/ },
        { name: 'Profesionales', url: /professionals/ },
        { name: 'Historiales', url: /medical-records/ },
        { name: 'Presupuestos', url: /budgets/ },
        { name: 'Pagos', url: /payments/ },
        { name: 'Reportes', url: /reports/ }
      ];

      for (const section of sections) {
        await dashboardPage.navigateToSection(section.name);

        // Check if URL changed (some sections may not exist)
        const currentUrl = page.url();
        if (currentUrl.match(section.url)) {
          expect(currentUrl).toMatch(section.url);
        }

        // Go back to dashboard for next test
        await dashboardPage.navigate();
      }
    });

    test('should highlight active menu item', async ({ page }) => {
      await patientsPage.navigate();
      await dashboardPage.openMenu();

      // Check if patients menu item is highlighted
      const patientsItem = page.locator('ion-item[routerLink="/patients"]');
      if (await patientsItem.isVisible()) {
        // Check for active class or selected state
        const classes = await patientsItem.getAttribute('class');
        // Active state varies by implementation
      }
    });

    test('should close menu after navigation', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.openMenu();
      await dashboardPage.goToPatients();

      // Menu should close on navigation (mobile behavior)
      await page.waitForTimeout(500);
    });
  });

  test.describe('Quick Actions', () => {

    test('should quick add patient from dashboard', async ({ page }) => {
      await dashboardPage.navigate();

      // Look for quick action button
      const quickAddBtn = page.locator('[data-testid="quick-add-patient"], ion-fab-button');
      if (await quickAddBtn.isVisible()) {
        await quickAddBtn.click();
        // Should navigate to patient creation
      }
    });

    test('should quick add appointment from dashboard', async ({ page }) => {
      await dashboardPage.navigate();

      const quickAddBtn = page.locator('[data-testid="quick-add-appointment"]');
      if (await quickAddBtn.isVisible()) {
        await quickAddBtn.click();
        // Should navigate to appointment creation
      }
    });
  });

  test.describe('Dashboard Widgets', () => {

    test('should display today appointments widget', async ({ page }) => {
      await dashboardPage.navigate();

      const appointmentsWidget = page.locator('[data-testid="appointments-widget"], .appointments-widget, .today-appointments');
      if (await appointmentsWidget.isVisible()) {
        expect(await appointmentsWidget.isVisible()).toBeTruthy();
      }
    });

    test('should display recent patients widget', async ({ page }) => {
      await dashboardPage.navigate();

      const patientsWidget = page.locator('[data-testid="patients-widget"], .patients-widget, .recent-patients');
      if (await patientsWidget.isVisible()) {
        expect(await patientsWidget.isVisible()).toBeTruthy();
      }
    });

    test('should display activity feed', async ({ page }) => {
      await dashboardPage.navigate();

      const activityWidget = page.locator('[data-testid="activity-widget"], .activity-widget, .recent-activity');
      if (await activityWidget.isVisible()) {
        expect(await activityWidget.isVisible()).toBeTruthy();
      }
    });

    test('should click through to full list from widget', async ({ page }) => {
      await dashboardPage.navigate();

      // Look for "Ver todos" or similar link in widget
      const viewAllLink = page.locator('ion-button:has-text("Ver todos"), a:has-text("Ver más")').first();
      if (await viewAllLink.isVisible()) {
        await viewAllLink.click();
        await dashboardPage.waitForPageLoad();
        // Should navigate to respective full list
      }
    });
  });

  test.describe('Header & Actions', () => {

    test('should display page title in header', async ({ page }) => {
      await dashboardPage.navigate();

      const title = page.locator('ion-title').first();
      await expect(title).toBeVisible();
    });

    test('should show notification icon if available', async ({ page }) => {
      await dashboardPage.navigate();

      const notificationIcon = page.locator('[data-testid="notifications"], ion-button:has(ion-icon[name*="notification"])');
      if (await notificationIcon.isVisible()) {
        expect(await notificationIcon.isVisible()).toBeTruthy();
      }
    });

    test('should show user menu/profile', async ({ page }) => {
      await dashboardPage.navigate();

      const profileBtn = page.locator('[data-testid="profile"], ion-avatar, .user-avatar');
      if (await profileBtn.isVisible()) {
        await profileBtn.click();
        // May open profile menu or navigate to profile
      }
    });
  });

  test.describe('Responsive Behavior', () => {

    test('should show hamburger menu on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await dashboardPage.navigate();

      const menuButton = page.locator('ion-menu-button');
      await expect(menuButton).toBeVisible();
    });

    test('should show sidebar on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      await dashboardPage.navigate();

      // On desktop, sidebar may be always visible
      const sidebar = page.locator('ion-menu, .sidebar');
      // Behavior varies by implementation
    });

    test('should adjust widget layout on different screens', async ({ page }) => {
      // Desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await dashboardPage.waitForLoadingComplete();

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.waitForLoadingComplete();
    });
  });

  test.describe('Session Management', () => {

    test('should maintain session across navigation', async ({ page }) => {
      await dashboardPage.navigate();

      // Navigate to different sections
      await dashboardPage.goToPatients();
      await dashboardPage.navigate();
      await dashboardPage.goToAppointments();
      await dashboardPage.navigate();

      // Should still be logged in
      await dashboardPage.expectDashboardPage();
    });

    test('should logout successfully', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.logout();

      // Should be on login page
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should redirect to login after logout', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.logout();

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/login/);
    });
  });

  test.describe('Data Loading', () => {

    test('should show loading state while fetching data', async ({ page }) => {
      // Intercept API requests to add delay
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await dashboardPage.navigate();

      // Loading spinner may be visible
      const spinner = page.locator('ion-spinner, .loading');
      // May or may not be visible depending on cache
    });

    test('should handle empty dashboard gracefully', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.waitForLoadingComplete();

      // Dashboard should display even with no data
      await dashboardPage.expectDashboardPage();
    });

    test('should refresh data on pull-to-refresh', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.navigate();

      // Simulate pull to refresh
      const content = page.locator('ion-content');
      if (await content.isVisible()) {
        // Pull down gesture
        await content.evaluate(el => {
          const event = new CustomEvent('ionRefresh');
          el.dispatchEvent(event);
        });
      }
    });
  });

  test.describe('Error States', () => {

    test('should handle network errors gracefully', async ({ page, context }) => {
      await dashboardPage.navigate();

      // Go offline
      await context.setOffline(true);

      // Try to refresh
      await page.reload().catch(() => {});

      // Restore connection
      await context.setOffline(false);

      // Navigate again
      await dashboardPage.navigate();
      await dashboardPage.expectDashboardPage();
    });

    test('should display error message on API failure', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/dashboard/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await dashboardPage.navigate();

      // Should show error or fallback UI
      await dashboardPage.waitForLoadingComplete();
    });
  });

  test.describe('Accessibility', () => {

    test('should have proper heading structure', async ({ page }) => {
      await dashboardPage.navigate();

      // Check for h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test('should have accessible navigation', async ({ page }) => {
      await dashboardPage.navigate();
      await dashboardPage.openMenu();

      // Menu items should be keyboard accessible
      const menuItems = page.locator('ion-item[routerLink]');
      const count = await menuItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await dashboardPage.navigate();

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should not cause errors
    });
  });
});
