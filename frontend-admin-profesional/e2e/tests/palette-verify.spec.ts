import { test, expect } from '@playwright/test';

test('Verify ARIA labels on appointment detail mobile actions', async ({ page }) => {
  // Mock the necessary API calls for login and appointment detail
  await page.route('**/api/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      })
    });
  });

  await page.route('**/api/appointments/1', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        patient_id: 1,
        professional_id: 1,
        appointment_date: new Date().toISOString(),
        status: 'scheduled',
        appointment_type: 'Consulta General',
        reason: 'Dolor de cabeza',
        patient: { first_name: 'Juan', last_name: 'Perez', document_number: '12345678' },
        professional: { first_name: 'Dr.', last_name: 'Simi' }
      })
    });
  });

  // Navigate to login and perform login to set auth state
  await page.goto('http://localhost:4200/auth/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('ion-button[type="submit"]');

  // Navigate to appointment detail
  await page.goto('http://localhost:4200/appointments/1');

  // Verify the ARIA labels on the mobile action buttons
  const editButton = page.locator('ion-button[aria-label="Editar cita"]');
  const optionsButton = page.locator('ion-button[aria-label="Más opciones de cita"]');

  await expect(editButton).toBeVisible();
  await expect(optionsButton).toBeVisible();
});
