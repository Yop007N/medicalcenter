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

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const openSpecialtyModuleAndResolveKey = async (page: Page): Promise<string> => {
  const moduleResponsePromise = waitForApi(page, 'specialties/my-module');
  await page.goto('/specialties/general-medicine');
  const moduleResponse = await moduleResponsePromise;

  expect(moduleResponse.status()).toBe(200);
  const modulePayload = (await moduleResponse.json()) as {
    module?: { key?: string };
  };

  const moduleKey = modulePayload.module?.key || 'general-medicine';
  await expect(page).toHaveURL(new RegExp(`/specialties/${escapeRegex(moduleKey)}$`));
  await expect(page.locator('a.quick-link', { hasText: 'Citas' }).first()).toHaveAttribute(
    'href',
    new RegExp(`specialty_key=${escapeRegex(moduleKey)}`)
  );
  await expect(page.locator('a.quick-link', { hasText: 'Registros' }).first()).toHaveAttribute(
    'href',
    new RegExp(`specialty_key=${escapeRegex(moduleKey)}`)
  );
  return moduleKey;
};

test.describe('Specialty Scope Smoke', () => {
  test('flujo modulo -> citas -> registros mantiene specialty_key', async ({ page }) => {
    await loginAsProfessional(page);
    const moduleKey = await openSpecialtyModuleAndResolveKey(page);
    const encodedModuleKey = encodeURIComponent(moduleKey);

    const appointmentsResponses: string[] = [];
    const appointmentsResponseListener = (response: { url(): string; request(): { method(): string } }) => {
      if (
        response.request().method() === 'GET' &&
        response.url().includes('/api/appointments')
      ) {
        appointmentsResponses.push(response.url());
      }
    };
    page.on('response', appointmentsResponseListener);
    await page.locator('a.quick-link', { hasText: 'Citas' }).first().click();

    await expect(page).toHaveURL(new RegExp(`/appointments\\?specialty_key=${escapeRegex(moduleKey)}`));
    await expect(page.getByRole('heading', { name: 'Citas', exact: true })).toBeVisible();
    await expect(page.getByText(`Scope por especialidad: ${moduleKey}`)).toBeVisible();
    await expect
      .poll(
        () => appointmentsResponses.some((url) => url.includes(`specialty_key=${encodedModuleKey}`)),
        { timeout: 20000 }
      )
      .toBeTruthy();
    page.off('response', appointmentsResponseListener);

    await page.goto(`/specialties/${moduleKey}`);
    await expect(page).toHaveURL(new RegExp(`/specialties/${escapeRegex(moduleKey)}$`));

    const recordsResponses: string[] = [];
    const recordsResponseListener = (response: { url(): string; request(): { method(): string } }) => {
      if (
        response.request().method() === 'GET' &&
        response.url().includes('/api/medical-records')
      ) {
        recordsResponses.push(response.url());
      }
    };
    page.on('response', recordsResponseListener);
    await page.locator('a.quick-link', { hasText: 'Registros' }).first().click();

    await expect(page).toHaveURL(new RegExp(`/medical-records\\?specialty_key=${escapeRegex(moduleKey)}`));
    await expect(page.getByRole('heading', { name: 'Registros Medicos' })).toBeVisible();
    await expect(page.getByText(`Scope por especialidad: ${moduleKey}`)).toBeVisible();
    await expect
      .poll(
        () => recordsResponses.some((url) => url.includes(`specialty_key=${encodedModuleKey}`)),
        { timeout: 20000 }
      )
      .toBeTruthy();
    page.off('response', recordsResponseListener);
  });
});
