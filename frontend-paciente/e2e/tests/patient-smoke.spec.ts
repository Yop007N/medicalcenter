import { expect, Page, test } from '@playwright/test';

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL || 'patient@medical.com';
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD || 'patient123';

const waitForApi = (page: Page, endpointPath: string, method: 'GET' | 'POST' = 'GET') =>
  page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(`/api/${endpointPath}`),
    { timeout: 25000 }
  );

const loginAsPatient = async (page: Page) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /iniciar sesi[oó]n/i })).toBeVisible();

  await page.locator('ion-input[formcontrolname="email"] input').fill(PATIENT_EMAIL);
  await page.locator('ion-input[formcontrolname="password"] input').fill(PATIENT_PASSWORD);

  const loginResponsePromise = waitForApi(page, 'auth/login', 'POST');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard/);
};

test.describe('Frontend Paciente Smoke', () => {
  test('login y dashboard del paciente', async ({ page }) => {
    await loginAsPatient(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Conectividad y sincronizacion')).toBeVisible();
  });

  test('turnos: disponibilidad real por profesional/especialidad', async ({ page }) => {
    await loginAsPatient(page);

    const availabilityResponsePromise = waitForApi(page, 'professionals/available-slots');
    await page.goto('/my-appointments');
    const availabilityResponse = await availabilityResponsePromise;
    expect(availabilityResponse.status()).toBe(200);

    await expect(page).toHaveURL(/\/my-appointments/);
    await expect(page.getByText('Solicitar nuevo turno')).toBeVisible();

    const hasSlots = await page.locator('.slot-chip').first().isVisible().catch(() => false);
    if (!hasSlots) {
      await expect(page.getByText(/No hay profesionales con horarios libres/i)).toBeVisible();
    }
  });

  test('historia: segmento odontograma visible para paciente', async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/my-history');

    await expect(page).toHaveURL(/\/my-history/);
    await expect(page.locator('h2.panel-title', { hasText: 'Historia y consentimientos' })).toBeVisible();
    await page.locator('ion-segment-button', { hasText: 'Odontograma' }).click();

    await expect(
      page.getByText(/Odontograma activo|Todavia no hay odontograma activo/i)
    ).toBeVisible();
  });
});
