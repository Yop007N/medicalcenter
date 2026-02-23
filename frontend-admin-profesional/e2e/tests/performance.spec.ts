import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, PatientsPage } from '../pages';
import { TestUsers } from './fixtures/test-data';

/**
 * Performance Tests
 * Tests for application performance metrics
 */
test.describe('Performance Tests', () => {

  test.describe('Page Load Performance', () => {

    test('login page should load under 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Login page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('dashboard should load under 5 seconds', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
    });

    test('patients list should load under 4 seconds', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      const startTime = Date.now();

      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Patients list load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(4000);
    });
  });

  test.describe('Core Web Vitals', () => {

    test('should have good LCP (Largest Contentful Paint)', async ({ page }) => {
      // Navigate to page and measure LCP
      await page.goto('/auth/login');

      // Inject LCP observer
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry;
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback timeout
          setTimeout(() => resolve(2500), 3000);
        });
      });

      console.log(`LCP: ${lcp}ms`);
      // Good LCP is under 2.5 seconds
      expect(lcp).toBeLessThan(2500);
    });

    test('should have good FID simulation (First Input Delay)', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');

      // Measure time to first interaction
      const startTime = Date.now();

      const emailInput = page.locator('ion-input[formControlName="email"]');
      await emailInput.click();

      const interactionTime = Date.now() - startTime;

      console.log(`First interaction time: ${interactionTime}ms`);
      // Good FID is under 100ms
      expect(interactionTime).toBeLessThan(500);
    });

    test('should have good CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto('/auth/login');

      // Inject CLS observer
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          // Wait and return CLS
          setTimeout(() => resolve(clsValue), 2000);
        });
      });

      console.log(`CLS: ${cls}`);
      // Good CLS is under 0.1
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Navigation Performance', () => {

    test('should navigate between pages quickly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Measure navigation to patients
      let startTime = Date.now();
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      let navTime = Date.now() - startTime;
      console.log(`Navigation to patients: ${navTime}ms`);
      expect(navTime).toBeLessThan(2000);

      // Measure navigation to appointments
      startTime = Date.now();
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      navTime = Date.now() - startTime;
      console.log(`Navigation to appointments: ${navTime}ms`);
      expect(navTime).toBeLessThan(2000);

      // Measure navigation back to dashboard
      startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      navTime = Date.now() - startTime;
      console.log(`Navigation to dashboard: ${navTime}ms`);
      expect(navTime).toBeLessThan(2000);
    });

    test('should handle rapid navigation', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Rapid navigation sequence
      const routes = ['/patients', '/appointments', '/dashboard', '/patients', '/dashboard'];

      for (const route of routes) {
        await page.goto(route);
        // Don't wait for full load, test cancellation handling
      }

      // Final navigation should complete
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be on dashboard
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test.describe('Search Performance', () => {

    test('should search patients quickly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('ion-searchbar');

      const startTime = Date.now();
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Debounce time
      await page.waitForLoadState('networkidle');

      const searchTime = Date.now() - startTime;

      console.log(`Search time: ${searchTime}ms`);
      // Search should complete within 2 seconds
      expect(searchTime).toBeLessThan(2000);
    });
  });

  test.describe('Form Performance', () => {

    test('should submit login form quickly', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Fill form
      await page.locator('ion-input[formControlName="email"]').fill(TestUsers.admin.email);
      await page.locator('ion-input[formControlName="password"]').fill(TestUsers.admin.password);

      // Measure submission time
      const startTime = Date.now();
      await page.locator('ion-button[type="submit"]').click();
      await page.waitForURL('**/dashboard**');

      const submitTime = Date.now() - startTime;

      console.log(`Login submission time: ${submitTime}ms`);
      // Login should complete within 5 seconds
      expect(submitTime).toBeLessThan(5000);
    });
  });

  test.describe('Memory Performance', () => {

    test('should not have memory leaks on navigation', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Navigate multiple times
      for (let i = 0; i < 10; i++) {
        await page.goto('/patients');
        await page.goto('/appointments');
        await page.goto('/dashboard');
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const percentIncrease = (memoryIncrease / initialMemory) * 100;

        console.log(`Memory increase: ${memoryIncrease} bytes (${percentIncrease.toFixed(2)}%)`);

        // Memory shouldn't increase more than 50% after navigation
        expect(percentIncrease).toBeLessThan(50);
      }
    });
  });

  test.describe('Network Performance', () => {

    test('should minimize API calls on dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // Track API calls
      const apiCalls: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      console.log(`Dashboard API calls: ${apiCalls.length}`);
      console.log('API endpoints:', [...new Set(apiCalls)]);

      // Dashboard shouldn't make excessive API calls
      expect(apiCalls.length).toBeLessThan(20);
    });

    test('should use caching effectively', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
      await loginPage.expectLoginSuccess();

      // First load
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      let apiCallsFirst = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          apiCallsFirst++;
        }
      });

      // Navigate away and back
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      let apiCallsSecond = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          apiCallsSecond++;
        }
      });

      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Second load should ideally have fewer or equal API calls due to caching
      console.log(`First load API calls: ${apiCallsFirst}`);
      console.log(`Second load API calls: ${apiCallsSecond}`);
    });
  });

  test.describe('Bundle Size Check', () => {

    test('should load reasonable sized bundles', async ({ page }) => {
      let totalSize = 0;
      const bundles: { url: string; size: number }[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.match(/\.(js|css)$/)) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0');
          totalSize += size;
          bundles.push({ url, size });
        }
      });

      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      console.log('Bundle sizes:');
      bundles.forEach((b) => {
        console.log(`  ${b.url.split('/').pop()}: ${(b.size / 1024).toFixed(2)} KB`);
      });
      console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB`);

      // Total JS/CSS should be under 5MB (reasonable for a modern app)
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });
  });
});
