import { expect, Page, test } from '@playwright/test';

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL || 'patient@medical.com';
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD || 'patient123';

const waitForApi = (
  page: Page,
  endpointPath: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(`/api/${endpointPath}`),
    { timeout: 30000 }
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

test.describe('Frontend Paciente Deep Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test('perfil: actualiza y persiste datos personales', async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/my-profile');
    await expect(page).toHaveURL(/\/my-profile/);
    await expect(page.getByText('Datos personales')).toBeVisible();

    const uniquePhone = `0991${String(Date.now()).slice(-6)}`;
    const phoneInput = page.locator('ion-input[formcontrolname="phone"] input');
    await phoneInput.fill(uniquePhone);

    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes('/api/patients/'),
      { timeout: 25000 }
    );
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBe(200);
    await expect(page.getByText(/perfil actualizado correctamente/i)).toBeVisible();

    await page.reload();
    await expect(phoneInput).toHaveValue(uniquePhone);
  });

  test('turnos: reserva por disponibilidad real', async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/my-appointments');
    await expect(page).toHaveURL(/\/my-appointments/);
    await expect(page.getByText('Solicitar nuevo turno')).toBeVisible();

    const slotChip = page.locator('.slot-chip').first();
    const hasSlots = await slotChip.isVisible().catch(() => false);

    if (!hasSlots) {
      await expect(page.getByText(/No hay profesionales con horarios libres/i)).toBeVisible();
      return;
    }

    await slotChip.click();
    await page.locator('ion-item:has-text("Tipo de cita") ion-input input').fill('Control e2e paciente');
    await page.locator('ion-item:has-text("Motivo") ion-textarea textarea').fill('Reserva automatizada por Playwright');

    const createAppointmentResponsePromise = waitForApi(page, 'appointments', 'POST');
    await page.getByRole('button', { name: /solicitar turno/i }).click();
    const createAppointmentResponse = await createAppointmentResponsePromise;
    expect(createAppointmentResponse.status()).toBe(201);
    await expect(
      page.locator('.success-box').filter({ hasText: /solicitado correctamente/i })
    ).toBeVisible();
  });

  test('historia y presupuestos: segmentos y acciones principales responden', async ({ page }) => {
    await loginAsPatient(page);

    await page.goto('/my-history');
    await expect(page).toHaveURL(/\/my-history/);
    await expect(page.getByText('Historia y consentimientos')).toBeVisible();
    await page.locator('ion-segment-button', { hasText: 'Timeline' }).click();

    const emptyTimelineState = page.getByText('No hay eventos de timeline disponibles.');
    const hasEmptyTimeline = await emptyTimelineState.isVisible().catch(() => false);
    if (hasEmptyTimeline) {
      await expect(emptyTimelineState).toBeVisible();
    } else {
      await expect(page.locator('ion-list ion-item').first()).toBeVisible();
    }

    await page.locator('ion-segment-button', { hasText: 'Odontograma' }).click();
    await expect(page.getByText(/Odontograma activo|Todavia no hay odontograma activo/i)).toBeVisible();

    await page.goto('/my-budgets');
    await expect(page).toHaveURL(/\/my-budgets/);
    await expect(page.getByText('Estado de presupuestos')).toBeVisible();

    const acceptButton = page.getByRole('button', { name: /aceptar presupuesto/i }).first();
    if (await acceptButton.isVisible().catch(() => false)) {
      const acceptResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          /\/api\/budgets\/\d+\/accept/.test(response.url()),
        { timeout: 25000 }
      );
      await acceptButton.click();
      const acceptResponse = await acceptResponsePromise;
      expect(acceptResponse.status()).toBe(200);
    } else {
      await expect(page.getByText(/Sin presupuestos|Sin resultados|Estado de presupuestos/i)).toBeVisible();
    }
  });
});
