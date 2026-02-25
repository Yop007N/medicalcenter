import { expect, Page, test } from '@playwright/test';
import { TestUsers } from './fixtures/test-data';

const DEFAULT_UI_BASE_URL = 'http://localhost:4200';

const waitForApiResponse = (
  page: Page,
  endpointPath: string,
  method: 'GET' | 'POST' = 'GET'
) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(`/api/${endpointPath}`),
    { timeout: 20000 }
  );

const loginAsAdmin = async (page: Page) => {
  await page.goto('/auth/login');

  await expect(page.locator('h2', { hasText: 'Bienvenido' })).toBeVisible();
  await page.locator('ion-input[formcontrolname="email"] input').fill(TestUsers.admin.email);
  await page.locator('ion-input[formcontrolname="password"] input').fill(TestUsers.admin.password);

  const loginResponsePromise = waitForApiResponse(page, 'auth/login', 'POST');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard/);
};

test.describe('Critical Smoke Admin/Professional', () => {
  test('auth: login exitoso y redireccion a dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('ion-title', { hasText: 'Dashboard' })).toBeVisible();
  });

  test.describe('rutas protegidas criticas', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('dashboard: carga overview sin 5xx', async ({ page }) => {
      const overviewResponsePromise = waitForApiResponse(page, 'dashboard/overview');
      await page.goto('/dashboard');
      const overviewResponse = await overviewResponsePromise;

      expect(overviewResponse.status()).toBe(200);
      await expect(page.locator('ion-title', { hasText: 'Dashboard' })).toBeVisible();
      await expect(page.locator('text=Actividad Reciente')).toBeVisible();
    });

    test('patients: carga listado y endpoint responde 200', async ({ page }) => {
      const patientsResponsePromise = waitForApiResponse(page, 'patients');
      await page.goto('/patients');
      const patientsResponse = await patientsResponsePromise;

      expect(patientsResponse.status()).toBe(200);
      await expect(page.locator('ion-title', { hasText: 'Pacientes' })).toBeVisible();
      await expect(page.locator('ion-searchbar[aria-label="Buscar pacientes"]')).toBeVisible();
    });

    test('appointments: carga agenda y endpoint responde 200', async ({ page }) => {
      const appointmentsResponsePromise = waitForApiResponse(page, 'appointments');
      await page.goto('/appointments');
      const appointmentsResponse = await appointmentsResponsePromise;

      expect(appointmentsResponse.status()).toBe(200);
      await expect(page.locator('ion-title', { hasText: 'Agenda de Citas' })).toBeVisible();
      await expect(page.locator('ion-segment')).toBeVisible();
    });
  });

  test('api-integration: endpoints criticos autenticados responden 200', async ({ request, baseURL }) => {
    const uiBaseUrl = (baseURL ?? process.env.BASE_URL ?? DEFAULT_UI_BASE_URL).replace(/\/$/, '');
    const apiBaseUrl = `${uiBaseUrl}/api`;

    const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
      data: {
        email: TestUsers.admin.email,
        password: TestUsers.admin.password
      }
    });

    expect(loginResponse.status()).toBe(200);
    const loginPayload = (await loginResponse.json()) as {
      access_token?: string;
      token?: string;
      user?: { role?: string };
    };

    const token = loginPayload.access_token ?? loginPayload.token;
    expect(token).toBeTruthy();
    expect(loginPayload.user?.role).toBe('admin');

    const authHeaders = { Authorization: `Bearer ${token}` };
    const criticalEndpoints = ['dashboard/overview', 'patients', 'appointments'];

    for (const endpoint of criticalEndpoints) {
      const response = await request.get(`${apiBaseUrl}/${endpoint}`, { headers: authHeaders });
      expect(response.status(), `${endpoint} debe responder 200`).toBe(200);
    }
  });
});
