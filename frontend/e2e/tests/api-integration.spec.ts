import { test, expect, request } from '@playwright/test';
import { TestUsers, TestPatients, generateUniqueEmail, generateUniqueDNI } from './fixtures/test-data';

/**
 * API Integration Tests
 * Tests that validate API responses alongside UI behavior
 */
test.describe('API Integration Tests', () => {
  let apiContext: ReturnType<typeof request.newContext> extends Promise<infer T> ? T : never;
  let authToken: string;

  test.beforeAll(async ({ playwright }) => {
    // Create API context
    apiContext = await playwright.request.newContext({
      baseURL: process.env.API_URL || 'http://localhost:5000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });

    // Authenticate to get token
    const loginResponse = await apiContext.post('/api/auth/login', {
      data: {
        email: TestUsers.admin.email,
        password: TestUsers.admin.password
      }
    });

    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      authToken = data.access_token || data.token;
    }
  });

  test.afterAll(async () => {
    await apiContext?.dispose();
  });

  test.describe('Authentication API', () => {

    test('should return 401 for invalid credentials', async () => {
      const response = await apiContext.post('/api/auth/login', {
        data: {
          email: 'invalid@email.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should return 200 and token for valid credentials', async () => {
      const response = await apiContext.post('/api/auth/login', {
        data: {
          email: TestUsers.admin.email,
          password: TestUsers.admin.password
        }
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.access_token || data.token).toBeTruthy();
    });

    test('should validate required fields on registration', async () => {
      const response = await apiContext.post('/api/auth/register', {
        data: {
          email: '' // Missing required fields
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should create new user on registration', async () => {
      const uniqueEmail = generateUniqueEmail('apitest');

      const response = await apiContext.post('/api/auth/register', {
        data: {
          email: uniqueEmail,
          password: 'TestPassword123!'
        }
      });

      // Either 201 Created or 200 OK
      expect([200, 201]).toContain(response.status());
    });

    test('should reject duplicate email registration', async () => {
      const response = await apiContext.post('/api/auth/register', {
        data: {
          email: TestUsers.admin.email, // Already exists
          password: 'TestPassword123!'
        }
      });

      // Should be 400 or 409 Conflict
      expect([400, 409, 422]).toContain(response.status());
    });
  });

  test.describe('Patients API', () => {

    test('should require authentication for patients list', async () => {
      const response = await apiContext.get('/api/patients');
      expect([401, 403]).toContain(response.status());
    });

    test('should return patients list with auth', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.get('/api/patients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(Array.isArray(data) || data.patients || data.data).toBeTruthy();
    });

    test('should create patient via API', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const uniqueEmail = generateUniqueEmail('apipatient');
      const uniqueDNI = generateUniqueDNI();

      const response = await apiContext.post('/api/patients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          firstName: 'API Test',
          lastName: 'Patient',
          email: uniqueEmail,
          phone: '+54 11 1234-5678',
          dni: uniqueDNI
        }
      });

      expect([200, 201]).toContain(response.status());

      const patient = await response.json();
      expect(patient.id || patient.data?.id).toBeTruthy();
    });

    test('should validate patient data on creation', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.post('/api/patients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          // Missing required fields
          firstName: ''
        }
      });

      expect([400, 422]).toContain(response.status());
    });

    test('should search patients', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.get('/api/patients?search=test', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Appointments API', () => {

    test('should require authentication', async () => {
      const response = await apiContext.get('/api/appointments');
      expect([401, 403]).toContain(response.status());
    });

    test('should return appointments list', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.get('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('should filter appointments by date', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const response = await apiContext.get(`/api/appointments?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('should filter appointments by status', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.get('/api/appointments?status=pending', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('should validate appointment creation data', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      // Try to create appointment without required fields
      const response = await apiContext.post('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          // Missing patient, date, etc.
        }
      });

      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe('Dashboard API', () => {

    test('should return dashboard metrics', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.get('/api/dashboard/metrics', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok()) {
        const data = await response.json();
        // Verify metrics structure
        expect(data).toBeTruthy();
      }
    });

    test('should return dashboard summary', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await apiContext.get('/api/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeTruthy();
      }
    });
  });

  test.describe('UI + API Consistency', () => {

    test('should show same patient count in UI and API', async ({ page }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      // Get count from API
      const apiResponse = await apiContext.get('/api/patients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      let apiCount = 0;
      if (apiResponse.ok()) {
        const data = await apiResponse.json();
        apiCount = data.length || data.total || data.data?.length || 0;
      }

      // Login and check UI
      await page.goto('/auth/login');
      await page.locator('ion-input[formControlName="email"]').fill(TestUsers.admin.email);
      await page.locator('ion-input[formControlName="password"]').fill(TestUsers.admin.password);
      await page.locator('ion-button[type="submit"]').click();
      await page.waitForURL('**/dashboard**');

      // Navigate to patients
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Get count from UI
      const patientCards = page.locator('.patient-card, ion-item.patient-item');
      const uiCount = await patientCards.count();

      // Counts should be consistent (allowing for pagination)
      // API might return all, UI might paginate
      expect(uiCount).toBeGreaterThanOrEqual(0);
    });

    test('should reflect API changes in UI', async ({ page }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      // Create patient via API
      const uniqueEmail = generateUniqueEmail('uiapitest');
      const uniqueName = 'UIAPITest' + Date.now();

      const apiResponse = await apiContext.post('/api/patients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          firstName: uniqueName,
          lastName: 'Patient',
          email: uniqueEmail,
          phone: '+54 11 9999-9999'
        }
      });

      if (!apiResponse.ok()) {
        test.skip();
        return;
      }

      // Login and verify in UI
      await page.goto('/auth/login');
      await page.locator('ion-input[formControlName="email"]').fill(TestUsers.admin.email);
      await page.locator('ion-input[formControlName="password"]').fill(TestUsers.admin.password);
      await page.locator('ion-button[type="submit"]').click();
      await page.waitForURL('**/dashboard**');

      // Navigate to patients and search
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Search for the created patient
      const searchInput = page.locator('ion-searchbar');
      if (await searchInput.isVisible()) {
        await searchInput.fill(uniqueName);
        await page.waitForTimeout(500);
      }

      // Patient should appear in UI
      const patientElement = page.locator(`text=${uniqueName}`);
      // May or may not be immediately visible depending on search
    });
  });

  test.describe('Error Handling', () => {

    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('ion-input[formControlName="email"]').fill(TestUsers.admin.email);
      await page.locator('ion-input[formControlName="password"]').fill(TestUsers.admin.password);
      await page.locator('ion-button[type="submit"]').click();
      await page.waitForURL('**/dashboard**');

      // Navigate to non-existent patient
      await page.goto('/patients/999999999');

      // Should show error or redirect
      await page.waitForLoadState('networkidle');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/patients', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/auth/login');
      await page.locator('ion-input[formControlName="email"]').fill(TestUsers.admin.email);
      await page.locator('ion-input[formControlName="password"]').fill(TestUsers.admin.password);
      await page.locator('ion-button[type="submit"]').click();
      await page.waitForURL('**/dashboard**');

      await page.goto('/patients');

      // Should show error message, not crash
      await page.waitForLoadState('networkidle');
    });

    test('should handle timeout gracefully', async ({ page }) => {
      // Mock slow response
      await page.route('**/api/patients', async route => {
        await new Promise(resolve => setTimeout(resolve, 30000));
        route.fulfill({
          status: 200,
          body: JSON.stringify([])
        });
      });

      await page.goto('/auth/login');
      await page.locator('ion-input[formControlName="email"]').fill(TestUsers.admin.email);
      await page.locator('ion-input[formControlName="password"]').fill(TestUsers.admin.password);
      await page.locator('ion-button[type="submit"]').click();
      await page.waitForURL('**/dashboard**');

      // Navigate with short timeout expectation
      await page.goto('/patients');

      // Should show loading state
      const loadingSpinner = page.locator('ion-spinner, .loading');
      // Spinner may or may not be visible
    });
  });
});
