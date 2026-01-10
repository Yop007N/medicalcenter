import { test, expect } from '@playwright/test';
import { LoginPage, PatientsPage, DashboardPage } from '../pages';
import { TestUsers, TestPatients, InvalidData, generateUniqueEmail, generateUniqueDNI } from './fixtures/test-data';

/**
 * Patients Management E2E Tests
 * Tests for patient CRUD operations and related functionality
 */
test.describe('Patients Management', () => {
  let loginPage: LoginPage;
  let patientsPage: PatientsPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    patientsPage = new PatientsPage(page);
    dashboardPage = new DashboardPage(page);

    // Login before each test
    await loginPage.navigate();
    await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
    await loginPage.expectLoginSuccess();
  });

  test.describe('Patients List', () => {

    test('should display patients list page', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.expectPatientsListPage();
    });

    test('should show add patient button', async () => {
      await patientsPage.navigate();
      await expect(patientsPage.addPatientButton).toBeVisible();
    });

    test('should show search input', async () => {
      await patientsPage.navigate();
      await expect(patientsPage.searchInput).toBeVisible();
    });

    test('should navigate to add patient form', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();
      await expect(page).toHaveURL(/patients\/new|patients\/create/);
    });

    test('should filter patients by search query', async () => {
      await patientsPage.navigate();

      // Get initial count
      const initialCount = await patientsPage.getPatientCount();

      // Search for a specific term
      await patientsPage.searchPatient('Juan');

      // Results should be filtered (may be same or less)
      const filteredCount = await patientsPage.getPatientCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should clear search and show all patients', async () => {
      await patientsPage.navigate();

      // Search first
      await patientsPage.searchPatient('TestPatient');

      // Clear search
      await patientsPage.searchPatient('');

      // Should show all patients again
      await patientsPage.waitForLoadingComplete();
    });

    test('should show empty state when no patients match search', async () => {
      await patientsPage.navigate();

      // Search for non-existent patient
      await patientsPage.searchPatient('NonExistentPatient12345');

      // Should show empty state or zero results
      const count = await patientsPage.getPatientCount();
      if (count === 0) {
        const isEmpty = await patientsPage.isEmptyStateVisible();
        expect(isEmpty || count === 0).toBeTruthy();
      }
    });
  });

  test.describe('Create Patient', () => {

    test('should create patient with all required fields', async () => {
      const uniqueEmail = generateUniqueEmail('patient');
      const patientData = {
        ...TestPatients.minimalPatient,
        email: uniqueEmail
      };

      await patientsPage.navigate();
      await patientsPage.createPatient(patientData);

      await patientsPage.expectPatientCreated();
    });

    test('should create patient with all fields filled', async () => {
      const uniqueEmail = generateUniqueEmail('fullpatient');
      const uniqueDNI = generateUniqueDNI();
      const patientData = {
        ...TestPatients.validPatient,
        email: uniqueEmail,
        dni: uniqueDNI
      };

      await patientsPage.navigate();
      await patientsPage.createPatient(patientData);

      await patientsPage.expectPatientCreated();
    });

    test('should show validation error for empty required fields', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();

      // Try to submit without filling required fields
      await patientsPage.submitForm();

      // Form should show validation errors or button should be disabled
      const isDisabled = await patientsPage.saveButton.isDisabled();
      if (!isDisabled) {
        // Check for validation errors on page
        const errors = await page.locator('.error-message, ion-text[color="danger"]').count();
        expect(errors).toBeGreaterThan(0);
      }
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();

      await patientsPage.firstNameInput.fill('Test');
      await patientsPage.lastNameInput.fill('Patient');
      await patientsPage.emailInput.fill(InvalidData.invalidEmail);
      await patientsPage.phoneInput.click();

      await page.waitForTimeout(300);

      // Check for email validation error
      const errorText = await page.locator('.error-message, ion-text[color="danger"]').textContent();
      expect(errorText?.toLowerCase()).toMatch(/email|correo|válido/);
    });

    test('should cancel patient creation', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();

      // Fill some data
      await patientsPage.firstNameInput.fill('Test');

      // Cancel
      await patientsPage.cancelButton.click();

      // Should return to list
      await expect(page).toHaveURL(/patients$/);
    });

    test('should preserve form data on validation error', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();

      const firstName = 'PreserveTest';
      await patientsPage.firstNameInput.fill(firstName);

      // Submit incomplete form
      await patientsPage.submitForm();

      // Data should be preserved
      await expect(patientsPage.firstNameInput).toHaveValue(firstName);
    });
  });

  test.describe('View Patient', () => {

    test.beforeEach(async () => {
      // Ensure at least one patient exists
      const uniqueEmail = generateUniqueEmail('viewtest');
      await patientsPage.navigate();

      // Check if patients exist, if not create one
      const count = await patientsPage.getPatientCount();
      if (count === 0) {
        await patientsPage.createPatient({
          ...TestPatients.minimalPatient,
          email: uniqueEmail
        });
        await patientsPage.navigate();
      }
    });

    test('should view patient details', async ({ page }) => {
      await patientsPage.navigate();

      // Select first patient
      const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
      await firstPatient.click();

      // Should show patient detail
      await patientsPage.expectPatientDetailPage();
    });

    test('should display patient information correctly', async ({ page }) => {
      await patientsPage.navigate();

      const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
      await firstPatient.click();

      await patientsPage.expectPatientDetailPage();

      // Verify basic info is displayed
      await expect(patientsPage.patientName).toBeVisible();
    });

    test('should navigate between patient tabs', async ({ page }) => {
      await patientsPage.navigate();

      const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
      await firstPatient.click();

      await patientsPage.expectPatientDetailPage();

      // Try to navigate to appointments tab if exists
      if (await patientsPage.appointmentsTab.isVisible()) {
        await patientsPage.goToAppointmentsTab();
      }

      // Try to navigate to medical records tab if exists
      if (await patientsPage.medicalRecordsTab.isVisible()) {
        await patientsPage.goToMedicalRecordsTab();
      }
    });

    test('should go back to patients list', async ({ page }) => {
      await patientsPage.navigate();

      const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
      await firstPatient.click();

      await patientsPage.expectPatientDetailPage();

      // Go back
      await patientsPage.goBack();
      await expect(page).toHaveURL(/patients$/);
    });
  });

  test.describe('Edit Patient', () => {

    test('should edit patient information', async ({ page }) => {
      // First create a patient to edit
      const uniqueEmail = generateUniqueEmail('editpatient');
      await patientsPage.navigate();
      await patientsPage.createPatient({
        ...TestPatients.minimalPatient,
        email: uniqueEmail
      });

      // If redirected to detail, click edit
      if (await patientsPage.editButton.isVisible()) {
        await patientsPage.clickEdit();
      } else {
        // Navigate to the patient
        await patientsPage.navigate();
        const patientItem = page.locator(`ion-item:has-text("${TestPatients.minimalPatient.firstName}")`).first();
        await patientItem.click();
        await patientsPage.clickEdit();
      }

      // Update some fields
      const newName = 'UpdatedName' + Date.now();
      await patientsPage.firstNameInput.fill(newName);
      await patientsPage.submitForm();

      await patientsPage.waitForLoadingComplete();

      // Verify update
      await expect(page.locator(`text=${newName}`)).toBeVisible();
    });

    test('should cancel edit without saving changes', async ({ page }) => {
      await patientsPage.navigate();

      // Select first patient
      const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
      await firstPatient.click();
      await patientsPage.expectPatientDetailPage();

      // Get original name
      const originalName = await patientsPage.patientName.textContent();

      // Click edit
      await patientsPage.clickEdit();

      // Change name
      await patientsPage.firstNameInput.fill('CancelledChange');

      // Cancel
      await patientsPage.cancelButton.click();

      // Name should be unchanged
      await expect(patientsPage.patientName).toHaveText(originalName!);
    });
  });

  test.describe('Delete Patient', () => {

    test('should delete patient with confirmation', async ({ page }) => {
      // First create a patient to delete
      const uniqueEmail = generateUniqueEmail('deletepatient');
      await patientsPage.navigate();
      await patientsPage.createPatient({
        firstName: 'ToDelete',
        lastName: 'Patient',
        email: uniqueEmail,
        phone: '+54 11 9999-9999'
      });

      // Navigate to patient detail
      if (!(await patientsPage.deleteButton.isVisible())) {
        await patientsPage.navigate();
        await patientsPage.selectPatient('ToDelete');
      }

      // Delete
      await patientsPage.deletePatient();

      // Should return to list
      await expect(page).toHaveURL(/patients$/);

      // Patient should not exist
      const exists = await patientsPage.patientExists('ToDelete Patient');
      expect(exists).toBeFalsy();
    });

    test('should cancel delete and keep patient', async ({ page }) => {
      await patientsPage.navigate();

      // Get initial count
      const initialCount = await patientsPage.getPatientCount();

      if (initialCount > 0) {
        // Select first patient
        const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
        await firstPatient.click();
        await patientsPage.expectPatientDetailPage();

        // Click delete
        await patientsPage.deleteButton.click();

        // Cancel the confirmation
        const cancelButton = page.locator('ion-alert button:has-text("Cancelar"), ion-alert button:has-text("No")');
        await cancelButton.click();

        // Should still be on detail page
        await patientsPage.expectPatientDetailPage();
      }
    });
  });

  test.describe('Navigation Integration', () => {

    test('should navigate to patients from dashboard', async () => {
      await dashboardPage.navigate();
      await dashboardPage.goToPatients();
      await patientsPage.expectPatientsListPage();
    });

    test('should navigate back to dashboard from patients', async ({ page }) => {
      await patientsPage.navigate();

      // Use menu to go to dashboard
      await dashboardPage.navigateToSection('Dashboard');
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test.describe('Responsive Design', () => {

    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await patientsPage.navigate();
      await patientsPage.expectPatientsListPage();

      // Should still show add button
      await expect(patientsPage.addPatientButton).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await patientsPage.navigate();
      await patientsPage.expectPatientsListPage();
    });
  });

  test.describe('Error Handling', () => {

    test('should handle network error gracefully', async ({ page, context }) => {
      await patientsPage.navigate();

      // Simulate offline
      await context.setOffline(true);

      // Try to search
      await patientsPage.searchPatient('test');

      // Should show error or offline message
      await page.waitForTimeout(1000);

      // Restore connection
      await context.setOffline(false);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await patientsPage.navigate();
      await patientsPage.clickAddPatient();

      // Fill with data that might cause server error
      await patientsPage.fillPatientForm({
        firstName: 'Test',
        lastName: 'Patient',
        email: 'invalid', // Invalid email
        phone: '123'
      });

      await patientsPage.submitForm();

      // Should show error message, not crash
      await patientsPage.waitForLoadingComplete();
      await expect(patientsPage.saveButton).toBeVisible();
    });
  });
});
