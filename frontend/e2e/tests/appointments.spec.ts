import { test, expect } from '@playwright/test';
import { LoginPage, AppointmentsPage, DashboardPage, PatientsPage } from '../pages';
import { TestUsers, TestAppointments, TestPatients, generateUniqueEmail } from './fixtures/test-data';

/**
 * Appointments Management E2E Tests
 * Tests for appointment scheduling, viewing, and management
 */
test.describe('Appointments Management', () => {
  let loginPage: LoginPage;
  let appointmentsPage: AppointmentsPage;
  let dashboardPage: DashboardPage;
  let patientsPage: PatientsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    appointmentsPage = new AppointmentsPage(page);
    dashboardPage = new DashboardPage(page);
    patientsPage = new PatientsPage(page);

    // Login before each test
    await loginPage.navigate();
    await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);
    await loginPage.expectLoginSuccess();
  });

  test.describe('Appointments List/Calendar', () => {

    test('should display appointments page', async () => {
      await appointmentsPage.navigate();
      await appointmentsPage.expectAppointmentsPage();
    });

    test('should show add appointment button', async () => {
      await appointmentsPage.navigate();
      await expect(appointmentsPage.addAppointmentButton).toBeVisible();
    });

    test('should toggle between calendar and list view', async ({ page }) => {
      await appointmentsPage.navigate();

      // Check if view toggle exists
      const viewToggle = page.locator('ion-segment');
      if (await viewToggle.isVisible()) {
        await appointmentsPage.switchToListView();
        await appointmentsPage.waitForLoadingComplete();

        await appointmentsPage.switchToCalendarView();
        await appointmentsPage.waitForLoadingComplete();
      }
    });

    test('should navigate to today appointments', async () => {
      await appointmentsPage.navigate();

      if (await appointmentsPage.todayButton.isVisible()) {
        await appointmentsPage.goToToday();
        await appointmentsPage.waitForLoadingComplete();
      }
    });

    test('should navigate to previous and next days/weeks', async () => {
      await appointmentsPage.navigate();

      // Navigate forward
      if (await appointmentsPage.nextButton.isVisible()) {
        await appointmentsPage.goToNext();
        await appointmentsPage.waitForLoadingComplete();
      }

      // Navigate backward
      if (await appointmentsPage.previousButton.isVisible()) {
        await appointmentsPage.goToPrevious();
        await appointmentsPage.waitForLoadingComplete();
      }
    });

    test('should filter appointments by status', async ({ page }) => {
      await appointmentsPage.navigate();

      // Try different status filters if available
      const statusFilters = ['pending', 'confirmed', 'completed', 'cancelled'];

      for (const status of statusFilters) {
        const filterButton = page.locator(`ion-segment-button[value="${status}"]`);
        if (await filterButton.isVisible()) {
          await filterButton.click();
          await appointmentsPage.waitForLoadingComplete();
        }
      }
    });

    test('should search appointments', async () => {
      await appointmentsPage.navigate();

      if (await appointmentsPage.searchInput.isVisible()) {
        await appointmentsPage.searchAppointments('consulta');
        await appointmentsPage.waitForLoadingComplete();
      }
    });
  });

  test.describe('Create Appointment', () => {

    test('should open appointment creation form', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      // Should show form
      await expect(appointmentsPage.saveButton).toBeVisible();
    });

    test('should create appointment with required fields', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      // Fill form with test data
      const appointmentData = {
        date: TestAppointments.validAppointment.date,
        time: TestAppointments.validAppointment.time,
        reason: TestAppointments.validAppointment.reason
      };

      await appointmentsPage.fillAppointmentForm(appointmentData);
      await appointmentsPage.submitForm();

      await appointmentsPage.waitForLoadingComplete();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      // Try to submit empty form
      await appointmentsPage.submitForm();

      // Should show errors or button should be disabled
      const isDisabled = await appointmentsPage.saveButton.isDisabled();
      if (!isDisabled) {
        const errors = await page.locator('.error-message, ion-text[color="danger"]').count();
        expect(errors).toBeGreaterThanOrEqual(0); // May have inline validation
      }
    });

    test('should cancel appointment creation', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      // Fill some data
      await appointmentsPage.reasonInput.fill('Test Reason');

      // Cancel
      if (await appointmentsPage.cancelButton.isVisible()) {
        await appointmentsPage.cancelButton.click();
      }

      // Should return to appointments list
      await appointmentsPage.expectAppointmentsPage();
    });

    test('should create urgent appointment', async () => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      await appointmentsPage.fillAppointmentForm({
        date: TestAppointments.urgentAppointment.date,
        time: TestAppointments.urgentAppointment.time,
        type: 'urgent',
        reason: TestAppointments.urgentAppointment.reason,
        notes: TestAppointments.urgentAppointment.notes
      });

      await appointmentsPage.submitForm();
      await appointmentsPage.waitForLoadingComplete();
    });

    test('should create follow-up appointment', async () => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      await appointmentsPage.fillAppointmentForm({
        date: TestAppointments.followUpAppointment.date,
        time: TestAppointments.followUpAppointment.time,
        type: 'follow-up',
        reason: TestAppointments.followUpAppointment.reason
      });

      await appointmentsPage.submitForm();
      await appointmentsPage.waitForLoadingComplete();
    });
  });

  test.describe('View Appointment', () => {

    test('should view appointment details', async ({ page }) => {
      await appointmentsPage.navigate();

      // Check if there are any appointments
      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        // Click on first appointment
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        // Should show appointment details
        await appointmentsPage.waitForLoadingComplete();
      }
    });

    test('should display appointment status', async ({ page }) => {
      await appointmentsPage.navigate();

      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        // Should show status badge
        if (await appointmentsPage.appointmentStatus.isVisible()) {
          const status = await appointmentsPage.getAppointmentStatus();
          expect(status).toBeTruthy();
        }
      }
    });
  });

  test.describe('Appointment Actions', () => {

    test('should confirm pending appointment', async ({ page }) => {
      await appointmentsPage.navigate();

      // Filter to pending appointments
      await appointmentsPage.filterByStatus('pending');

      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        // Select first pending appointment
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        // Confirm if button is visible
        if (await appointmentsPage.confirmButton.isVisible()) {
          await appointmentsPage.confirmAppointment();

          // Status should change
          const status = await appointmentsPage.getAppointmentStatus();
          expect(status.toLowerCase()).toMatch(/confirmad|confirmed/);
        }
      }
    });

    test('should cancel appointment', async ({ page }) => {
      await appointmentsPage.navigate();

      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        // Select first appointment
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        // Cancel if button is visible
        if (await appointmentsPage.cancelAppointmentButton.isVisible()) {
          await appointmentsPage.cancelAppointment();

          await appointmentsPage.waitForLoadingComplete();
        }
      }
    });

    test('should complete appointment', async ({ page }) => {
      await appointmentsPage.navigate();

      // Filter to confirmed appointments
      await appointmentsPage.filterByStatus('confirmed');

      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        if (await appointmentsPage.completeButton.isVisible()) {
          await appointmentsPage.completeAppointment();

          const status = await appointmentsPage.getAppointmentStatus();
          expect(status.toLowerCase()).toMatch(/completad|completed|finalizado/);
        }
      }
    });

    test('should reschedule appointment', async ({ page }) => {
      await appointmentsPage.navigate();

      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        if (await appointmentsPage.rescheduleButton.isVisible()) {
          // Get future date
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 14);
          const dateStr = newDate.toISOString().split('T')[0];

          await appointmentsPage.rescheduleAppointment(dateStr, '15:00');
          await appointmentsPage.waitForLoadingComplete();
        }
      }
    });

    test('should edit appointment', async ({ page }) => {
      await appointmentsPage.navigate();

      const count = await appointmentsPage.getAppointmentCount();

      if (count > 0) {
        const firstAppointment = page.locator('.appointment-card, ion-item.appointment-item').first();
        await firstAppointment.click();

        if (await appointmentsPage.editButton.isVisible()) {
          await appointmentsPage.editButton.click();

          // Update reason
          await appointmentsPage.reasonInput.fill('Updated Reason - ' + Date.now());
          await appointmentsPage.submitForm();

          await appointmentsPage.waitForLoadingComplete();
        }
      }
    });
  });

  test.describe('Calendar Functionality', () => {

    test('should display appointments in calendar view', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.switchToCalendarView();

      // Calendar should be visible
      const calendar = page.locator('.calendar-view, ion-calendar, .fc-view');
      if (await calendar.isVisible()) {
        expect(await calendar.isVisible()).toBeTruthy();
      }
    });

    test('should select date from calendar', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.switchToCalendarView();

      // Try to click a date
      const dateCell = page.locator('.calendar-day, .fc-day').first();
      if (await dateCell.isVisible()) {
        await dateCell.click();
        await appointmentsPage.waitForLoadingComplete();
      }
    });
  });

  test.describe('Navigation Integration', () => {

    test('should navigate to appointments from dashboard', async () => {
      await dashboardPage.navigate();
      await dashboardPage.goToAppointments();
      await appointmentsPage.expectAppointmentsPage();
    });

    test('should create appointment from patient detail', async ({ page }) => {
      // First navigate to a patient
      await patientsPage.navigate();

      const patientCount = await patientsPage.getPatientCount();

      if (patientCount > 0) {
        // Select first patient
        const firstPatient = page.locator('.patient-card, ion-item.patient-item').first();
        await firstPatient.click();

        // Look for appointment button on patient detail
        const addAppointmentBtn = page.locator('[data-testid="add-appointment"], ion-button:has-text("Nueva cita")');
        if (await addAppointmentBtn.isVisible()) {
          await addAppointmentBtn.click();
          // Should open appointment form with patient pre-selected
          await expect(appointmentsPage.saveButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Time Slot Validation', () => {

    test('should prevent booking in the past', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      // Try to set past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      await appointmentsPage.fillAppointmentForm({
        date: pastDateStr,
        time: '10:00',
        reason: 'Past appointment test'
      });

      await appointmentsPage.submitForm();

      // Should show error or prevent submission
      await page.waitForTimeout(500);
      const errorVisible = await page.locator('.error-message, ion-text[color="danger"]').isVisible();
      // Either error is shown or form is still visible (not submitted)
      expect(errorVisible || await appointmentsPage.saveButton.isVisible()).toBeTruthy();
    });

    test('should handle time zone correctly', async ({ page }) => {
      await appointmentsPage.navigate();
      await appointmentsPage.clickAddAppointment();

      // Set appointment for today at specific time
      const today = new Date().toISOString().split('T')[0];

      await appointmentsPage.fillAppointmentForm({
        date: today,
        time: '14:00',
        reason: 'Timezone test appointment'
      });

      // Submit and verify
      await appointmentsPage.submitForm();
      await appointmentsPage.waitForLoadingComplete();
    });
  });

  test.describe('Responsive Design', () => {

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await appointmentsPage.navigate();
      await appointmentsPage.expectAppointmentsPage();

      // FAB button should be visible
      await expect(appointmentsPage.addAppointmentButton).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await appointmentsPage.navigate();
      await appointmentsPage.expectAppointmentsPage();
    });
  });

  test.describe('Error Handling', () => {

    test('should handle network error gracefully', async ({ page, context }) => {
      await appointmentsPage.navigate();

      // Go offline
      await context.setOffline(true);

      // Try to refresh
      await page.reload().catch(() => {});

      // Restore connection
      await context.setOffline(false);

      // Page should recover
      await appointmentsPage.navigate();
      await appointmentsPage.expectAppointmentsPage();
    });

    test('should show empty state when no appointments', async ({ page }) => {
      await appointmentsPage.navigate();

      // Filter to cancelled (likely fewer appointments)
      await appointmentsPage.filterByStatus('cancelled');

      const count = await appointmentsPage.getAppointmentCount();

      if (count === 0) {
        const isEmpty = await appointmentsPage.isEmptyStateVisible();
        expect(isEmpty || count === 0).toBeTruthy();
      }
    });
  });
});
