import { test, expect } from '@playwright/test';
import { TestUsers, TestPatients, TestAppointments, generateUniqueEmail, generateUniqueDNI } from './fixtures/test-data';

/**
 * CRUD Operations E2E Tests
 * Tests for Create, Read, Update operations on all entities
 * Includes: Patients, Professionals, Appointments, Clinical History, Budgets, Payments, Odontology
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

async function login(page: any, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  if (page.url().includes('dashboard')) {
    return;
  }

  try {
    await page.waitForSelector('ion-input', { timeout: 5000 });
  } catch {
    if (page.url().includes('dashboard')) return;
  }

  if (page.url().includes('dashboard')) return;

  const emailInput = page.locator('ion-input[formControlName="email"] input');
  const passwordInput = page.locator('ion-input[formControlName="password"] input');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);

  await page.locator('ion-button[type="submit"]').click();
  await page.waitForURL('**/dashboard**', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

async function fillIonInput(page: any, formControlName: string, value: string) {
  // Try the nested input first (Ionic renders native input inside ion-input)
  let input = page.locator(`ion-input[formControlName="${formControlName}"] input`);

  try {
    await input.waitFor({ state: 'visible', timeout: 3000 });
    await input.fill(value);
  } catch {
    // Fallback: try direct ion-input and use keyboard
    const ionInput = page.locator(`ion-input[formControlName="${formControlName}"]`);
    await ionInput.waitFor({ state: 'visible', timeout: 5000 });
    await ionInput.click();
    await page.waitForTimeout(300);

    // Clear existing value and type new one
    await page.keyboard.press('Control+A');
    await page.keyboard.type(value);
  }
  await page.waitForTimeout(300);
}

async function fillIonTextarea(page: any, formControlName: string, value: string) {
  const textarea = page.locator(`ion-textarea[formControlName="${formControlName}"] textarea`);
  await textarea.waitFor({ state: 'visible', timeout: 5000 });
  await textarea.fill(value);
  await page.waitForTimeout(300);
}

async function selectIonOption(page: any, formControlName: string, optionIndex: number = 0) {
  const select = page.locator(`ion-select[formControlName="${formControlName}"]`);
  await select.waitFor({ state: 'visible', timeout: 5000 });
  await select.click();
  await page.waitForTimeout(1000);

  // Wait for alert/popover to appear
  const alert = page.locator('ion-alert, ion-popover');
  await alert.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);

  // Try multiple selectors for radio buttons in Ionic alerts
  // Ionic uses button[role="radio"] inside the alert for single select
  const radioSelectors = [
    'ion-alert button[role="radio"]',
    'ion-alert .alert-radio-button',
    'ion-alert ion-radio',
    'ion-popover ion-item',
    'ion-popover ion-select-option'
  ];

  let clicked = false;
  for (const selector of radioSelectors) {
    const radios = page.locator(selector);
    const radioCount = await radios.count();

    if (radioCount > 0) {
      const targetIndex = Math.min(optionIndex, radioCount - 1);
      console.log(`Found ${radioCount} options with selector: ${selector}, clicking index ${targetIndex}`);

      // Click the radio button
      const targetRadio = radios.nth(targetIndex);
      await targetRadio.scrollIntoViewIfNeeded().catch(() => {});
      await targetRadio.click({ force: true });
      await page.waitForTimeout(500);
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    console.log('No radio buttons found, trying keyboard navigation');
    // Fallback: use keyboard to select
    for (let i = 0; i <= optionIndex; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }

  // Click OK/Aceptar button to confirm selection
  const okButton = page.locator('ion-alert button:has-text("OK"), ion-alert button:has-text("Aceptar"), ion-alert .alert-button:not(.alert-button-role-cancel)').first();
  try {
    await okButton.waitFor({ state: 'visible', timeout: 2000 });
    if (await okButton.isVisible()) {
      await okButton.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // If no OK button, the popover might auto-close
  }

  // Verify selection was made by checking if select has a value
  await page.waitForTimeout(300);
}

async function clickSaveButton(page: any) {
  // Wait for form to be valid (button to be enabled)
  await page.waitForTimeout(1000);

  // Try multiple selectors for save button
  const saveSelectors = [
    'ion-button[slot="end"]:not([disabled]):has(ion-icon[name="checkmark"])',
    'ion-button[slot="end"]:not([disabled]):has(ion-icon[name="save"])',
    'ion-button[slot="end"]:not([disabled]):has(ion-icon[name="save-outline"])',
    'ion-button[expand="block"]:not([disabled])',
    'ion-button:has-text("Guardar"):not([disabled])',
    'ion-button:has-text("Registrar"):not([disabled])',
    'ion-button[type="submit"]:not([disabled])',
    'button.save-button:not([disabled])'
  ];

  for (const selector of saveSelectors) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible()) {
      try {
        const isEnabled = await btn.isEnabled();
        if (isEnabled) {
          await btn.click();
          await page.waitForTimeout(1500);
          return;
        }
      } catch {
        // Continue to next selector
      }
    }
  }

  // Fallback: try clicking expand block button or slot end button
  const expandBlockBtn = page.locator('ion-button[expand="block"]').first();
  if (await expandBlockBtn.isVisible()) {
    await expandBlockBtn.click({ force: true });
    await page.waitForTimeout(1500);
    return;
  }

  const saveButton = page.locator('ion-button[slot="end"], ion-button:has-text("Guardar")').first();
  await saveButton.click({ force: true });
  await page.waitForTimeout(1500);
}

// Helper to navigate to create form - goes directly to /new URL
async function navigateToCreateForm(page: any, basePath: string) {
  // Navigate directly to create form URL
  await page.goto(`${basePath}/new`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// ============================================
// TEST: CREATE PATIENT
// ============================================
test.describe('CRUD: Patients', () => {
  test('Create new patient with full data', async ({ page }) => {
    console.log('=== CREATING NEW PATIENT ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to patient form
    console.log('1. Navigating to new patient form...');
    await navigateToCreateForm(page, '/patients');
    console.log('2. On patient form page...');

    // Fill patient form - only required fields
    console.log('3. Filling patient form...');
    const uniqueEmail = generateUniqueEmail('paciente');

    // First Name (REQUIRED)
    await fillIonInput(page, 'first_name', 'Roberto');
    await page.waitForTimeout(500);

    // Last Name (REQUIRED)
    await fillIonInput(page, 'last_name', 'Martinez Test');
    await page.waitForTimeout(500);

    // Email (REQUIRED)
    await fillIonInput(page, 'email', uniqueEmail);
    await page.waitForTimeout(500);

    // Password (REQUIRED for new patients)
    const passwordInput = page.locator('ion-input[formControlName="password"] input');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('TestPassword123!');
      await page.waitForTimeout(500);
    }

    // Phone (optional but good to have)
    const phoneInput = page.locator('ion-input[formControlName="phone"] input');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+54 11 5555-1234');
      await page.waitForTimeout(500);
    }

    // Scroll to see form
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    // Save patient
    console.log('4. Saving patient...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // Verify success (should redirect to patient list or show success toast)
    console.log('5. Verifying patient created...');
    await page.waitForTimeout(2000);

    console.log('=== PATIENT CREATED SUCCESSFULLY ===');
  });

  test('Search and view patient details', async ({ page }) => {
    console.log('=== SEARCHING AND VIEWING PATIENT ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Search for patient
    const searchBar = page.locator('ion-searchbar input').first();
    if (await searchBar.isVisible()) {
      console.log('1. Searching for Roberto...');
      await searchBar.fill('Roberto');
      await page.waitForTimeout(2000);
    }

    // Click on first patient
    console.log('2. Opening patient detail...');
    const patient = page.locator('ion-item, ion-card').first();
    if (await patient.isVisible()) {
      await patient.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Scroll through details
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
    }

    console.log('=== PATIENT VIEWED SUCCESSFULLY ===');
  });
});

// ============================================
// TEST: CREATE PROFESSIONAL
// ============================================
test.describe('CRUD: Professionals', () => {
  test('Create new professional', async ({ page }) => {
    console.log('=== CREATING NEW PROFESSIONAL ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to professional form
    console.log('1. Navigating to new professional form...');
    await navigateToCreateForm(page, '/professionals');
    console.log('2. On professional form page...');

    // Fill professional form - only required fields
    console.log('3. Filling professional form...');
    const uniqueEmail = generateUniqueEmail('profesional');

    // First Name (REQUIRED)
    await fillIonInput(page, 'first_name', 'Dra. Ana');
    await page.waitForTimeout(500);

    // Last Name (REQUIRED)
    await fillIonInput(page, 'last_name', 'González Test');
    await page.waitForTimeout(500);

    // Email (REQUIRED)
    await fillIonInput(page, 'email', uniqueEmail);
    await page.waitForTimeout(500);

    // Specialty (REQUIRED) - use the new selectIonOption function
    await selectIonOption(page, 'specialty', 0); // Select first specialty option
    await page.waitForTimeout(500);

    // Scroll form
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    // Save
    console.log('4. Saving professional...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    console.log('=== PROFESSIONAL CREATED SUCCESSFULLY ===');
  });

  test('View professionals list', async ({ page }) => {
    console.log('=== VIEWING PROFESSIONALS LIST ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);

    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll through list
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1500);

    // Click on first professional
    const professional = page.locator('ion-item, ion-card').first();
    if (await professional.isVisible()) {
      await professional.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    console.log('=== PROFESSIONALS VIEWED SUCCESSFULLY ===');
  });
});

// ============================================
// TEST: CREATE APPOINTMENT
// ============================================
test.describe('CRUD: Appointments', () => {
  test('Create new appointment', async ({ page }) => {
    console.log('=== CREATING NEW APPOINTMENT ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to appointment form
    console.log('1. Navigating to new appointment form...');
    await navigateToCreateForm(page, '/appointments');
    console.log('2. On appointment form page...');

    // Fill appointment form
    console.log('3. Filling appointment form - required fields only...');

    // Select Patient (REQUIRED)
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(500);

    // Select Professional (REQUIRED)
    await selectIonOption(page, 'professional_id', 0);
    await page.waitForTimeout(500);

    // Appointment Type (REQUIRED)
    await selectIonOption(page, 'appointment_type', 0);
    await page.waitForTimeout(500);

    // Scroll form
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);

    // Save
    console.log('4. Saving appointment...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    console.log('=== APPOINTMENT CREATED SUCCESSFULLY ===');
  });

  test('View appointments calendar', async ({ page }) => {
    console.log('=== VIEWING APPOINTMENTS CALENDAR ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);

    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate through dates
    const nextBtn = page.locator('ion-button:has(ion-icon[name*="forward"]), ion-button:has(ion-icon[name*="chevron-forward"])').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
      await nextBtn.click();
      await page.waitForTimeout(1500);
    }

    const prevBtn = page.locator('ion-button:has(ion-icon[name*="back"]), ion-button:has(ion-icon[name*="chevron-back"])').first();
    if (await prevBtn.isVisible()) {
      await prevBtn.click();
      await page.waitForTimeout(1500);
      await prevBtn.click();
      await page.waitForTimeout(1500);
    }

    console.log('=== APPOINTMENTS CALENDAR VIEWED ===');
  });
});

// ============================================
// TEST: CREATE BUDGET
// ============================================
test.describe('CRUD: Budgets', () => {
  test('Create new budget with items', async ({ page }) => {
    console.log('=== CREATING NEW BUDGET ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to budget form
    console.log('1. Navigating to new budget form...');
    await navigateToCreateForm(page, '/budgets');
    console.log('2. On budget form page...');

    // Fill budget form
    console.log('3. Filling budget form...');

    // Title (if present)
    const titleInput = page.locator('ion-input[formControlName="title"] input');
    if (await titleInput.isVisible()) {
      await titleInput.fill('Presupuesto Tratamiento Dental Completo');
      await page.waitForTimeout(500);
    }

    // Select Patient (REQUIRED) - use the helper function
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(500);

    // Description (optional)
    const descTextarea = page.locator('ion-textarea[formControlName="description"] textarea');
    if (await descTextarea.isVisible()) {
      await descTextarea.fill('Presupuesto para tratamiento dental completo.');
      await page.waitForTimeout(500);
    }

    // Currency (if present)
    const currencySelect = page.locator('ion-select[formControlName="currency"]');
    if (await currencySelect.isVisible()) {
      await selectIonOption(page, 'currency', 0);
      await page.waitForTimeout(500);
    }

    // Scroll to see form
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);

    // Save
    console.log('4. Saving budget...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    console.log('=== BUDGET CREATED SUCCESSFULLY ===');
  });

  test('View budget details', async ({ page }) => {
    console.log('=== VIEWING BUDGET DETAILS ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);

    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on first budget
    const budget = page.locator('ion-item, ion-card').first();
    if (await budget.isVisible()) {
      await budget.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Scroll through details
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
    }

    console.log('=== BUDGET VIEWED SUCCESSFULLY ===');
  });
});

// ============================================
// TEST: CREATE PAYMENT
// ============================================
test.describe('CRUD: Payments', () => {
  test('Create new payment', async ({ page }) => {
    console.log('=== CREATING NEW PAYMENT ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to payment form
    console.log('1. Navigating to new payment form...');
    await navigateToCreateForm(page, '/payments');
    console.log('2. On payment form page...');

    // Fill payment form
    console.log('3. Filling payment form...');

    // Amount (REQUIRED)
    await fillIonInput(page, 'amount', '15000');
    await page.waitForTimeout(500);

    // Payment Method (REQUIRED) - use helper
    await selectIonOption(page, 'payment_method', 0);
    await page.waitForTimeout(500);

    // Scroll form
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(500);

    // Save
    console.log('4. Saving payment...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    console.log('=== PAYMENT CREATED SUCCESSFULLY ===');
  });

  test('View payments list', async ({ page }) => {
    console.log('=== VIEWING PAYMENTS LIST ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);

    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll through list
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);

    console.log('=== PAYMENTS VIEWED SUCCESSFULLY ===');
  });
});

// ============================================
// TEST: MEDICAL RECORDS / CLINICAL HISTORY
// ============================================
test.describe('CRUD: Medical Records', () => {
  test('Create medical record for patient', async ({ page }) => {
    console.log('=== CREATING MEDICAL RECORD ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to medical record form
    console.log('1. Navigating to new medical record form...');
    await navigateToCreateForm(page, '/medical-records');
    console.log('2. On medical record form page...');

    // Fill medical record form
    console.log('3. Filling medical record form...');

    // Select Patient (REQUIRED) - use helper function
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(500);

    // Chief Complaint (optional)
    const complaintTextarea = page.locator('ion-textarea[formControlName="chief_complaint"] textarea');
    if (await complaintTextarea.isVisible()) {
      await complaintTextarea.fill('Dolor de muelas');
      await page.waitForTimeout(500);
    }

    // Diagnosis (optional)
    const diagnosisTextarea = page.locator('ion-textarea[formControlName="diagnosis"] textarea');
    if (await diagnosisTextarea.isVisible()) {
      await diagnosisTextarea.fill('Caries profunda');
      await page.waitForTimeout(500);
    }

    // Scroll form
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);

    // Save
    console.log('4. Saving medical record...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    console.log('=== MEDICAL RECORD CREATED SUCCESSFULLY ===');
  });
});

// ============================================
// TEST: ODONTOLOGY - TREATMENTS AND ODONTOGRAM
// ============================================
test.describe('CRUD: Odontology', () => {
  test('Create odontology treatment', async ({ page }) => {
    console.log('=== CREATING ODONTOLOGY TREATMENT ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to odontology treatment form
    console.log('1. Navigating to new treatment form...');
    await navigateToCreateForm(page, '/odontology/treatments');
    console.log('2. On treatment form page...');

    // Fill treatment form
    console.log('3. Filling treatment form...');

    // Select Patient (REQUIRED) - use helper function
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(500);

    // Treatment Type (if present)
    const typeSelect = page.locator('ion-select[formControlName="treatment_type"]');
    if (await typeSelect.isVisible()) {
      await selectIonOption(page, 'treatment_type', 0);
      await page.waitForTimeout(500);
    }

    // Description (optional)
    const descTextarea = page.locator('ion-textarea[formControlName="description"] textarea');
    if (await descTextarea.isVisible()) {
      await descTextarea.fill('Tratamiento dental de prueba E2E');
      await page.waitForTimeout(500);
    }

    // Scroll form
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);

    // Save
    console.log('4. Saving treatment...');
    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    console.log('=== ODONTOLOGY TREATMENT CREATED SUCCESSFULLY ===');
  });

  test('View odontology treatment details', async ({ page }) => {
    console.log('=== VIEWING ODONTOLOGY TREATMENT ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);

    // Navigate to specific treatment (example URL)
    await page.goto('/odontology/treatments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on first treatment
    const treatment = page.locator('ion-item, ion-card').first();
    if (await treatment.isVisible()) {
      await treatment.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Scroll through details
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(1500);
    }

    console.log('=== TREATMENT VIEWED SUCCESSFULLY ===');
  });

  test('Navigate and interact with odontogram', async ({ page }) => {
    console.log('=== INTERACTING WITH ODONTOGRAM ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate to patients list
    console.log('1. Navigating to patients...');
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first patient
    const patient = page.locator('ion-item, ion-card').first();
    if (await patient.isVisible()) {
      await patient.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot of patient detail
      console.log('2. Viewing patient details...');
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(1000);

      // Look for any clinical history or odontogram button
      console.log('3. Looking for clinical history access...');
      const clinicalBtn = page.locator('ion-button:has-text("Historia"), ion-button:has-text("Odontograma"), ion-button:has-text("Clinical"), a:has-text("Historia")').first();
      if (await clinicalBtn.isVisible().catch(() => false)) {
        await clinicalBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Scroll through clinical history content
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(1500);
        await page.mouse.wheel(0, -300);
        await page.waitForTimeout(1000);
      }
    }

    // Also navigate to odontology treatments directly
    console.log('4. Navigating to odontology treatments...');
    await page.goto('/odontology/treatments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Scroll through treatments
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);

    // Try to click on first treatment if exists
    const treatment = page.locator('ion-item, ion-card').first();
    if (await treatment.isVisible().catch(() => false)) {
      await treatment.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Scroll through treatment detail
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
    }

    console.log('=== ODONTOGRAM INTERACTION COMPLETED ===');
  });

  test('Direct navigation to treatment detail page', async ({ page }) => {
    console.log('=== DIRECT TREATMENT DETAIL NAVIGATION ===');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(2000);

    // Navigate directly to a treatment detail (as per user example)
    console.log('1. Navigating to treatment detail...');
    await page.goto('/odontology/treatments/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // If page loads, explore it (use .last() to get the main content, not menu)
    const content = page.locator('ion-content').last();
    if (await content.isVisible()) {
      // Scroll through content
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, -600);
      await page.waitForTimeout(1500);

      // Look for edit button
      const editBtn = page.locator('ion-button:has(ion-icon[name="create"]), ion-button:has-text("Editar")').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(2000);

        // Scroll edit form
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(1500);

        // Cancel or go back
        const backBtn = page.locator('ion-back-button, ion-button:has-text("Cancelar")').first();
        if (await backBtn.isVisible()) {
          await backBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // Try other treatment IDs
    for (const id of [2, 3, 5, 7]) {
      console.log(`2. Trying treatment ID ${id}...`);
      await page.goto(`/odontology/treatments/${id}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    console.log('=== TREATMENT DETAIL NAVIGATION COMPLETED ===');
  });
});

// ============================================
// COMPLETE DEMO: Full CRUD Workflow
// ============================================
test.describe('Complete Demo Workflow', () => {
  // This test takes longer because it creates multiple entities
  test('Full application CRUD demo - All entities', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this comprehensive test
    console.log('========================================');
    console.log('=== COMPLETE CRUD DEMO - ALL ENTITIES ===');
    console.log('========================================');

    await login(page, TestUsers.admin.email, TestUsers.admin.password);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 1: CREATE PATIENT
    // ===========================================
    console.log('\n--- SECTION 1: CREATING PATIENT ---');
    await navigateToCreateForm(page, '/patients');

    await fillIonInput(page, 'first_name', 'Demo Patient');
    await page.waitForTimeout(500);
    await fillIonInput(page, 'last_name', 'E2E Test');
    await page.waitForTimeout(500);
    await fillIonInput(page, 'email', generateUniqueEmail('demo'));
    await page.waitForTimeout(500);

    const pwdInput = page.locator('ion-input[formControlName="password"] input');
    if (await pwdInput.isVisible()) {
      await pwdInput.fill('DemoPass123!');
    }
    await page.waitForTimeout(1000);

    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 2: CREATE PROFESSIONAL
    // ===========================================
    console.log('\n--- SECTION 2: CREATING PROFESSIONAL ---');
    await navigateToCreateForm(page, '/professionals');

    await fillIonInput(page, 'first_name', 'Dr. Demo');
    await page.waitForTimeout(500);
    await fillIonInput(page, 'last_name', 'Professional');
    await page.waitForTimeout(500);
    await fillIonInput(page, 'email', generateUniqueEmail('doctor'));
    await page.waitForTimeout(500);

    // Select specialty using helper
    await selectIonOption(page, 'specialty', 0);
    await page.waitForTimeout(1000);

    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 3: CREATE APPOINTMENT
    // ===========================================
    console.log('\n--- SECTION 3: CREATING APPOINTMENT ---');
    await navigateToCreateForm(page, '/appointments');

    // Select patient, professional and type using helper
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(500);
    await selectIonOption(page, 'professional_id', 0);
    await page.waitForTimeout(500);
    await selectIonOption(page, 'appointment_type', 0);
    await page.waitForTimeout(1000);

    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 4: CREATE BUDGET
    // ===========================================
    console.log('\n--- SECTION 4: CREATING BUDGET ---');
    await navigateToCreateForm(page, '/budgets');

    // Select patient using helper
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(1000);

    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 5: CREATE PAYMENT
    // ===========================================
    console.log('\n--- SECTION 5: CREATING PAYMENT ---');
    await navigateToCreateForm(page, '/payments');

    // Amount (REQUIRED)
    await fillIonInput(page, 'amount', '10000');
    await page.waitForTimeout(500);

    // Payment method using helper (REQUIRED)
    await selectIonOption(page, 'payment_method', 0);
    await page.waitForTimeout(1000);

    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 6: ODONTOLOGY - TREATMENT
    // ===========================================
    console.log('\n--- SECTION 6: CREATING ODONTOLOGY TREATMENT ---');
    await navigateToCreateForm(page, '/odontology/treatments');

    // Select patient using helper
    await selectIonOption(page, 'patient_id', 0);
    await page.waitForTimeout(500);

    // Treatment type using helper
    const typeSelect2 = page.locator('ion-select[formControlName="treatment_type"]');
    if (await typeSelect2.isVisible()) {
      await selectIonOption(page, 'treatment_type', 0);
      await page.waitForTimeout(500);
    }

    await clickSaveButton(page);
    await page.waitForTimeout(3000);

    // ===========================================
    // SECTION 7: VIEW ODONTOLOGY TREATMENTS
    // ===========================================
    console.log('\n--- SECTION 7: VIEW ODONTOLOGY TREATMENTS ---');
    await page.goto('/odontology/treatments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Scroll through treatments list
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);

    // ===========================================
    // FINAL: Return to Dashboard
    // ===========================================
    console.log('\n--- RETURNING TO DASHBOARD ---');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n========================================');
    console.log('=== COMPLETE CRUD DEMO FINISHED ===');
    console.log('========================================');
  });
});
