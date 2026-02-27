import { expect, Page, test } from '@playwright/test';

const PROFESSIONAL_EMAIL = process.env.E2E_PROFESSIONAL_EMAIL || 'doctor@medical.com';
const PROFESSIONAL_PASSWORD = process.env.E2E_PROFESSIONAL_PASSWORD || 'doctor123';

const waitForApi = (page: Page, endpointPath: string, method: 'GET' | 'POST' = 'GET') =>
  page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(`/api/${endpointPath}`),
    { timeout: 20000 }
  );

const loginAsProfessional = async (page: Page) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  await page.locator('#email').fill(PROFESSIONAL_EMAIL);
  await page.locator('#password').fill(PROFESSIONAL_PASSWORD);

  const loginResponsePromise = waitForApi(page, 'auth/login', 'POST');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard/);
};

test.describe('Frontend Profesional Smoke', () => {
  test('login y dashboard operativo', async ({ page }) => {
    await loginAsProfessional(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Pacientes activos')).toBeVisible();
  });

  test('pacientes: crear paciente desde flujo profesional', async ({ page }) => {
    await loginAsProfessional(page);

    const patientsResponsePromise = waitForApi(page, 'patients');
    await page.goto('/patients');
    const patientsResponse = await patientsResponsePromise;
    expect(patientsResponse.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Pacientes' })).toBeVisible();

    await page.getByRole('button', { name: 'Nuevo paciente' }).click();

    const uniqueEmail = `e2e.prof.${Date.now()}@test.com`;
    await page.getByLabel('Nombre').fill('E2E');
    await page.getByLabel('Apellido').fill('Profesional');
    await page.getByLabel('Correo').fill(uniqueEmail);
    await page.getByLabel('Password').fill('Patient123');

    const createResponsePromise = waitForApi(page, 'patients', 'POST');
    await page.getByRole('button', { name: 'Crear' }).click();
    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);
    await expect(page.getByText(/creado correctamente/i)).toBeVisible();
  });

  test('citas: carga agenda sin error de red', async ({ page }) => {
    await loginAsProfessional(page);

    const appointmentsResponsePromise = waitForApi(page, 'appointments');
    await page.goto('/appointments');
    const appointmentsResponse = await appointmentsResponsePromise;

    expect(appointmentsResponse.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Citas', exact: true })).toBeVisible();
  });
});
