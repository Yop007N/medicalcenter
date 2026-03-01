import { expect, Page, test } from '@playwright/test';

const PROFESSIONAL_EMAIL = process.env.E2E_PROFESSIONAL_EMAIL || 'doctor@medical.com';
const PROFESSIONAL_PASSWORD = process.env.E2E_PROFESSIONAL_PASSWORD || 'doctor123';

const waitForApi = (
  page: Page,
  endpointPath: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(`/api/${endpointPath}`),
    { timeout: 25000 }
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

const toDateTimeLocal = (offsetHours = 24): string => {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  date.setSeconds(0, 0);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

test.describe('Frontend Profesional Deep Workflow', () => {
  test('CRUD clinico cruzado: paciente -> cita -> registro -> modulo especializado', async ({ page }) => {
    await loginAsProfessional(page);

    const uniqueTag = `${Date.now()}`;
    const patientEmail = `e2e.deep.${uniqueTag}@test.com`;

    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: 'Pacientes' })).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo paciente' }).click();

    await page.getByLabel('Nombre').fill('E2E');
    await page.getByLabel('Apellido').fill(`Workflow ${uniqueTag}`);
    await page.getByLabel('Correo').fill(patientEmail);
    await page.getByLabel('Password').fill('Patient123');

    const createPatientResponsePromise = waitForApi(page, 'patients', 'POST');
    await page.getByRole('button', { name: 'Crear' }).click();
    const createPatientResponse = await createPatientResponsePromise;

    expect(createPatientResponse.status()).toBe(201);
    const createdPatient = (await createPatientResponse.json()) as { id: number };
    const patientId = createdPatient.id;
    expect(patientId).toBeGreaterThan(0);

    await page.goto(`/appointments?patient_id=${patientId}`);
    await expect(page.getByRole('heading', { name: 'Citas', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nueva cita' }).click();

    await page.getByLabel('Patient ID').fill(String(patientId));
    await page.getByLabel('Fecha y hora').fill(toDateTimeLocal(30));
    await page.getByLabel('Duracion (min)').fill('30');
    await page.getByLabel('Tipo').fill('consulta e2e');
    await page.getByLabel('Motivo').fill('Validacion e2e de flujo profesional');

    const createAppointmentResponsePromise = waitForApi(page, 'appointments', 'POST');
    await page.getByRole('button', { name: 'Crear' }).click();
    const createAppointmentResponse = await createAppointmentResponsePromise;
    expect([201, 409]).toContain(createAppointmentResponse.status());

    await page.goto(`/medical-records?patient_id=${patientId}`);
    await expect(page.getByRole('heading', { name: 'Registros Medicos' })).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo registro' }).click();

    await page.getByLabel('Patient ID').fill(String(patientId));
    await page.getByLabel('Queja principal').fill('Control clinico e2e');
    await page.getByLabel('Diagnostico').fill('Seguimiento integral');
    await page.getByLabel('Tratamiento').fill('Plan terapeutico inicial');
    await page.getByLabel('Prescripciones').fill('Indicar analgesico segun necesidad');
    await page.getByLabel('Notas').fill('Registro creado automaticamente por Playwright');

    const createMedicalRecordResponsePromise = waitForApi(page, 'medical-records', 'POST');
    await page.getByRole('button', { name: 'Crear' }).click();
    const createMedicalRecordResponse = await createMedicalRecordResponsePromise;
    expect(createMedicalRecordResponse.status()).toBe(201);

    const moduleResponsePromise = waitForApi(page, 'specialties/my-module', 'GET');
    await page.goto('/specialties/general-medicine');
    const moduleResponse = await moduleResponsePromise;
    expect(moduleResponse.status()).toBe(200);

    await expect(page.getByRole('heading', { name: /medicina general|modulo de/i })).toBeVisible();
    const encounterForm = page.locator('form').first();
    const patientSelect = encounterForm.getByLabel('Paciente');
    const firstScopedPatientValue = await patientSelect.locator('option').nth(1).getAttribute('value');
    expect(firstScopedPatientValue).toBeTruthy();
    await patientSelect.selectOption(firstScopedPatientValue as string);
    await encounterForm.getByLabel('Motivo de consulta').fill('Consulta de seguimiento e2e');
    await encounterForm.getByLabel('Diagnostico').fill('Diagnostico e2e');
    await encounterForm.getByLabel('Plan terapeutico').fill('Plan de control y monitoreo');

    const createEncounterResponsePromise = waitForApi(page, 'specialties/encounters', 'POST');
    await encounterForm.getByRole('button', { name: 'Registrar consulta' }).click();
    const createEncounterResponse = await createEncounterResponsePromise;
    expect(createEncounterResponse.status()).toBe(201);
    const createdEncounter = (await createEncounterResponse.json()) as { id: number };
    const encounterId = createdEncounter.id;
    expect(encounterId).toBeGreaterThan(0);

    const encounterItem = page.locator('li', { hasText: `#${encounterId}` }).first();
    await expect(encounterItem).toBeVisible();

    const deleteEncounterResponsePromise = waitForApi(page, `specialties/encounters/${encounterId}`, 'DELETE');
    let nativeDialogShown = false;
    page.once('dialog', async (dialogEvent) => {
      nativeDialogShown = true;
      await dialogEvent.accept();
    });
    await encounterItem.getByRole('button', { name: 'Eliminar' }).click();

    const dialog = page.locator('app-ui-dialog');
    const customDialogVisible = await dialog.isVisible({ timeout: 1500 }).catch(() => false);
    if (customDialogVisible) {
      await dialog.getByRole('button', { name: 'Eliminar' }).click();
    } else {
      await expect.poll(() => nativeDialogShown, { timeout: 5000 }).toBeTruthy();
    }

    const deleteEncounterResponse = await deleteEncounterResponsePromise;
    expect([200, 204]).toContain(deleteEncounterResponse.status());
    await expect(page.getByText(new RegExp(`Consulta #${encounterId} eliminada\\.`))).toBeVisible();
  });
});
