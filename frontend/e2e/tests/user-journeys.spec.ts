import { test, expect } from '@playwright/test';
import { TestUsers } from './fixtures/test-data';

/**
 * User Journey E2E Tests
 * Complete user flows through the application with video recording
 * These tests simulate real user interactions
 */

// Helper function to login with retry for rate limiting
async function login(page: any, email: string, password: string, retries = 3) {
  // First, navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Check if already logged in (redirected to dashboard)
  if (page.url().includes('dashboard')) {
    console.log('Already logged in, skipping login');
    return;
  }

  // Wait for either login form or redirect to dashboard
  try {
    await Promise.race([
      page.waitForSelector('ion-input', { timeout: 5000 }),
      page.waitForURL('**/dashboard**', { timeout: 5000 })
    ]);
  } catch {
    // Continue anyway
  }

  // Check again if redirected to dashboard
  if (page.url().includes('dashboard')) {
    console.log('Redirected to dashboard, already authenticated');
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Make sure we're on login page
      if (!page.url().includes('login')) {
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');
      }

      // Check if redirected (already authenticated)
      if (page.url().includes('dashboard')) {
        return;
      }

      await page.waitForSelector('ion-input', { timeout: 10000 });

      const emailInput = page.locator('ion-input[formControlName="email"] input');
      const passwordInput = page.locator('ion-input[formControlName="password"] input');

      await emailInput.waitFor({ state: 'visible' });
      await emailInput.fill(email);
      await passwordInput.fill(password);

      await page.locator('ion-button[type="submit"]').click();

      // Wait for dashboard or error message
      await Promise.race([
        page.waitForURL('**/dashboard**', { timeout: 15000 }),
        page.waitForSelector('ion-toast, .error-message, [role="alert"]', { timeout: 15000 }).catch(() => null)
      ]);

      // Check if we're on dashboard
      if (page.url().includes('dashboard')) {
        return; // Success
      }

      // Check for rate limit error (429)
      const toast = page.locator('ion-toast');
      if (await toast.isVisible()) {
        const toastText = await toast.textContent();
        if (toastText?.includes('429') || toastText?.toLowerCase().includes('rate') || toastText?.toLowerCase().includes('too many')) {
          console.log(`Rate limited on attempt ${attempt}, waiting 5 seconds...`);
          await page.waitForTimeout(5000);
          continue;
        }
      }

      // If not on dashboard and no rate limit, try again
      if (attempt < retries) {
        console.log(`Login attempt ${attempt} failed, retrying...`);
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      if (attempt < retries) {
        console.log(`Login attempt ${attempt} error, waiting before retry...`);
        await page.waitForTimeout(3000);
      } else {
        throw error;
      }
    }
  }

  // Final check - wait longer for dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
}

test.describe('Complete User Journeys', () => {
  test.describe('Journey 1: Login and Dashboard Exploration', () => {
    test('Complete login flow and explore dashboard', async ({ page }) => {
      // Step 1: Navigate to login
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Take screenshot of login page
      await page.screenshot({ path: 'e2e/screenshots/01-login-page.png', fullPage: true });

      // Step 2: Enter credentials
      await page.waitForSelector('ion-input', { timeout: 10000 });
      const emailInput = page.locator('ion-input[formControlName="email"] input');
      const passwordInput = page.locator('ion-input[formControlName="password"] input');

      await emailInput.fill(TestUsers.admin.email);
      await page.waitForTimeout(500); // Visual delay for video
      await passwordInput.fill(TestUsers.admin.password);
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'e2e/screenshots/02-login-filled.png', fullPage: true });

      // Step 3: Submit login
      await page.locator('ion-button[type="submit"]').click();

      // Step 4: Wait for dashboard and verify
      await page.waitForURL('**/dashboard**', { timeout: 20000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Let dashboard load completely

      await page.screenshot({ path: 'e2e/screenshots/03-dashboard.png', fullPage: true });

      // Verify dashboard elements
      await expect(page).toHaveURL(/dashboard/);

      // Step 5: Explore dashboard sections
      const dashboardContent = page.locator('ion-content').last();
      await expect(dashboardContent).toBeVisible();

      // Look for stats cards or overview sections
      const statsSection = page.locator('.stats-card, .overview-card, ion-card').first();
      if (await statsSection.isVisible()) {
        await statsSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'e2e/screenshots/04-dashboard-explored.png', fullPage: true });
    });

    test('Navigate through all main menu sections', async ({ page }) => {
      // Login first
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      await page.screenshot({ path: 'e2e/screenshots/menu-01-dashboard.png', fullPage: true });

      // Step 1: Open side menu if exists
      const menuButton = page.locator('ion-menu-button, ion-button[slot="start"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'e2e/screenshots/menu-02-sidemenu-open.png', fullPage: true });
      }

      // Step 2: Navigate to Patients
      const patientsLink = page.locator('ion-item:has-text("Pacientes"), a:has-text("Pacientes"), ion-menu-toggle:has-text("Pacientes")').first();
      if (await patientsLink.isVisible()) {
        await patientsLink.click();
        await page.waitForURL('**/patients**', { timeout: 10000 }).catch(() => {});
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/menu-03-patients.png', fullPage: true });
      }

      // Step 3: Navigate to Appointments
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      const appointmentsLink = page.locator('ion-item:has-text("Citas"), a:has-text("Citas"), ion-menu-toggle:has-text("Citas")').first();
      if (await appointmentsLink.isVisible()) {
        await appointmentsLink.click();
        await page.waitForURL('**/appointments**', { timeout: 10000 }).catch(() => {});
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/menu-04-appointments.png', fullPage: true });
      }

      // Step 4: Navigate to Budgets/Presupuestos
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      const budgetsLink = page.locator('ion-item:has-text("Presupuestos"), a:has-text("Presupuestos")').first();
      if (await budgetsLink.isVisible()) {
        await budgetsLink.click();
        await page.waitForURL('**/budgets**', { timeout: 10000 }).catch(() => {});
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/menu-05-budgets.png', fullPage: true });
      }
    });
  });

  test.describe('Journey 2: Patient Management Flow', () => {
    test('Browse and search patients', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      // Navigate to patients
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'e2e/screenshots/patients-01-list.png', fullPage: true });

      // Check for patient list
      const patientList = page.locator('ion-list, .patients-list, ion-card').first();
      await expect(patientList).toBeVisible({ timeout: 10000 });

      // Try search functionality
      const searchBar = page.locator('ion-searchbar input, input[type="search"]').first();
      if (await searchBar.isVisible()) {
        await searchBar.fill('Juan');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/patients-02-search.png', fullPage: true });

        // Clear search
        await searchBar.clear();
        await page.waitForTimeout(500);
      }

      // Click on first patient if exists
      const firstPatient = page.locator('ion-item, ion-card, .patient-item').first();
      if (await firstPatient.isVisible()) {
        await firstPatient.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/patients-03-detail.png', fullPage: true });
      }
    });

    test('View patient detail and clinical history', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      // Navigate to patients
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click on first patient
      const firstPatient = page.locator('ion-item, ion-card, .patient-item').first();
      if (await firstPatient.isVisible()) {
        await firstPatient.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'e2e/screenshots/patient-detail-01.png', fullPage: true });

        // Look for tabs (clinical history, appointments, etc)
        const tabs = page.locator('ion-segment-button, ion-tab-button');
        const tabCount = await tabs.count();

        for (let i = 0; i < Math.min(tabCount, 4); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: `e2e/screenshots/patient-detail-tab-${i + 1}.png`, fullPage: true });
        }

        // Try to access odontogram/clinical history
        const odontogramLink = page.locator('ion-button:has-text("Odontograma"), ion-button:has-text("Historia"), a:has-text("Odontograma")').first();
        if (await odontogramLink.isVisible()) {
          await odontogramLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);
          await page.screenshot({ path: 'e2e/screenshots/patient-odontogram.png', fullPage: true });
        }
      }
    });
  });

  test.describe('Journey 3: Appointments Management', () => {
    test('View and navigate appointments calendar', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      // Navigate to appointments
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'e2e/screenshots/appointments-01-main.png', fullPage: true });

      // Check for calendar or list view
      const calendarView = page.locator('.calendar, ion-calendar, .appointments-calendar');
      const listView = page.locator('.appointments-list, ion-list');

      // Toggle views if available
      const viewToggle = page.locator('ion-segment-button, .view-toggle button');
      if (await viewToggle.first().isVisible()) {
        await viewToggle.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: 'e2e/screenshots/appointments-02-view1.png', fullPage: true });

        if (await viewToggle.nth(1).isVisible()) {
          await viewToggle.nth(1).click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: 'e2e/screenshots/appointments-03-view2.png', fullPage: true });
        }
      }

      // Navigate dates
      const nextButton = page.locator('ion-button:has(ion-icon[name*="forward"]), ion-button:has(ion-icon[name*="next"]), .next-btn').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: 'e2e/screenshots/appointments-04-next.png', fullPage: true });
      }

      const prevButton = page.locator('ion-button:has(ion-icon[name*="back"]), ion-button:has(ion-icon[name*="prev"]), .prev-btn').first();
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(500);
        await prevButton.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: 'e2e/screenshots/appointments-05-prev.png', fullPage: true });
      }
    });

    test('Open new appointment form', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Find add button
      const addButton = page.locator('ion-fab-button, ion-button:has-text("Nueva"), ion-button:has-text("Agregar"), ion-button:has(ion-icon[name="add"])').first();

      if (await addButton.isVisible()) {
        await page.screenshot({ path: 'e2e/screenshots/appointment-form-01-before.png', fullPage: true });

        await addButton.click();
        await page.waitForTimeout(1500);

        await page.screenshot({ path: 'e2e/screenshots/appointment-form-02-open.png', fullPage: true });

        // Check form elements
        const form = page.locator('form, ion-card, ion-modal');
        if (await form.isVisible()) {
          // Scroll through form
          await page.mouse.wheel(0, 300);
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'e2e/screenshots/appointment-form-03-scrolled.png', fullPage: true });
        }
      }
    });
  });

  test.describe('Journey 4: Odontology Features', () => {
    test('Navigate to odontology section', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      // Try to find odontology in menu
      const menuButton = page.locator('ion-menu-button, ion-button[slot="start"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }

      const odontologyLink = page.locator('ion-item:has-text("Odontolog"), a:has-text("Odontolog")').first();
      if (await odontologyLink.isVisible()) {
        await odontologyLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'e2e/screenshots/odontology-01-main.png', fullPage: true });
      } else {
        // Navigate via patients
        await page.goto('/patients');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const firstPatient = page.locator('ion-item, ion-card, .patient-item').first();
        if (await firstPatient.isVisible()) {
          await firstPatient.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          // Look for odontogram button
          const odontogramBtn = page.locator('ion-button:has-text("Odontograma"), ion-button:has-text("Historia Cl"), a:has-text("Odontograma")').first();
          if (await odontogramBtn.isVisible()) {
            await odontogramBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1500);
            await page.screenshot({ path: 'e2e/screenshots/odontology-01-odontogram.png', fullPage: true });
          }
        }
      }
    });

    test('Explore odontogram visualization', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      // Navigate to a patient's odontogram
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const firstPatient = page.locator('ion-item, ion-card, .patient-item').first();
      if (await firstPatient.isVisible()) {
        await firstPatient.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Navigate to clinical history/odontogram
        const clinicalBtn = page.locator('ion-button:has-text("Historia"), ion-button:has-text("Odontograma"), ion-segment-button:has-text("Odontograma")').first();
        if (await clinicalBtn.isVisible()) {
          await clinicalBtn.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'e2e/screenshots/odontogram-01-view.png', fullPage: true });

          // Try to interact with teeth if visible
          const teeth = page.locator('.tooth, .tooth-container, svg[class*="tooth"]');
          const toothCount = await teeth.count();

          if (toothCount > 0) {
            // Click on a tooth
            await teeth.first().click();
            await page.waitForTimeout(800);
            await page.screenshot({ path: 'e2e/screenshots/odontogram-02-tooth-selected.png', fullPage: true });

            // Check for tooth details modal/panel
            const toothDetail = page.locator('ion-modal, .tooth-detail, ion-popover');
            if (await toothDetail.isVisible()) {
              await page.screenshot({ path: 'e2e/screenshots/odontogram-03-tooth-detail.png', fullPage: true });
            }
          }

          // Navigate through tabs if available
          const tabs = page.locator('ion-segment-button');
          const tabCount = await tabs.count();

          for (let i = 0; i < Math.min(tabCount, 5); i++) {
            await tabs.nth(i).click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `e2e/screenshots/odontogram-tab-${i + 1}.png`, fullPage: true });
          }
        }
      }
    });
  });

  test.describe('Journey 5: Budgets and Payments', () => {
    test('Navigate budgets section', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      await page.goto('/budgets');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'e2e/screenshots/budgets-01-list.png', fullPage: true });

      // Check for budget list
      const budgetItems = page.locator('ion-item, ion-card, .budget-item');
      if (await budgetItems.first().isVisible()) {
        await budgetItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/budgets-02-detail.png', fullPage: true });
      }

      // Try to create new budget
      await page.goto('/budgets');
      await page.waitForTimeout(1000);

      const addBudgetBtn = page.locator('ion-fab-button, ion-button:has-text("Nuevo"), ion-button:has(ion-icon[name="add"])').first();
      if (await addBudgetBtn.isVisible()) {
        await addBudgetBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'e2e/screenshots/budgets-03-new-form.png', fullPage: true });
      }
    });
  });

  test.describe('Journey 6: User Settings and Logout', () => {
    test('Access user profile and logout', async ({ page }) => {
      await login(page, TestUsers.admin.email, TestUsers.admin.password);

      await page.screenshot({ path: 'e2e/screenshots/settings-01-logged-in.png', fullPage: true });

      // Look for user menu/profile
      const userMenu = page.locator('ion-avatar, .user-menu, ion-button:has(ion-icon[name="person"]), ion-chip').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: 'e2e/screenshots/settings-02-user-menu.png', fullPage: true });
      }

      // Look for settings link
      const settingsLink = page.locator('ion-item:has-text("Configuración"), ion-item:has-text("Perfil"), a:has-text("Settings")').first();
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/settings-03-profile.png', fullPage: true });
      }

      // Logout
      const logoutBtn = page.locator('ion-item:has-text("Cerrar"), ion-button:has-text("Cerrar"), ion-item:has-text("Salir"), ion-button:has-text("Logout")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'e2e/screenshots/settings-04-logged-out.png', fullPage: true });

        // Verify redirected to login
        await expect(page).toHaveURL(/login|auth/);
      }
    });
  });
});

test.describe('Full Application Walkthrough', () => {
  test('Complete application tour - All features', async ({ page }) => {
    // This single test does a complete tour of the application
    // Optimized for DEMO VIDEO - longer pauses to show each section clearly

    console.log('=== STARTING COMPLETE APPLICATION DEMO TOUR ===');

    // =====================================================
    // SECTION 1: LOGIN PAGE
    // =====================================================
    console.log('1. Showing Login Page...');
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Show login page for 3 seconds

    await page.waitForSelector('ion-input', { timeout: 15000 });

    // Type email slowly (character by character effect)
    const emailInput = page.locator('ion-input[formControlName="email"] input');
    const passwordInput = page.locator('ion-input[formControlName="password"] input');

    await emailInput.click();
    await page.waitForTimeout(500);
    await emailInput.fill(TestUsers.admin.email);
    await page.waitForTimeout(1500); // Pause to show email

    await passwordInput.click();
    await page.waitForTimeout(500);
    await passwordInput.fill(TestUsers.admin.password);
    await page.waitForTimeout(1500); // Pause to show password filled

    // Click login button
    console.log('   Clicking login...');
    await page.locator('ion-button[type="submit"]').click();
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Show dashboard loaded

    console.log('   Logged in successfully!');

    // =====================================================
    // SECTION 2: DASHBOARD EXPLORATION
    // =====================================================
    console.log('2. Exploring Dashboard...');
    await page.waitForTimeout(2000);

    // Scroll down slowly to show dashboard content
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1500);

    // Scroll back up
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(2000);

    // =====================================================
    // SECTION 3: OPEN SIDE MENU AND NAVIGATE
    // =====================================================
    console.log('3. Opening Side Menu...');
    const menuButton = page.locator('ion-menu-button, ion-button[slot="start"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(2000); // Show menu open

      // Highlight menu items by hovering
      const menuItems = page.locator('ion-menu ion-item');
      const itemCount = await menuItems.count();
      for (let i = 0; i < Math.min(itemCount, 5); i++) {
        await menuItems.nth(i).hover();
        await page.waitForTimeout(800);
      }
    }

    // =====================================================
    // SECTION 4: PATIENTS LIST
    // =====================================================
    console.log('4. Navigating to Patients...');
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Show patients list

    // Scroll through patients
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(1500);

    // Try search functionality
    const searchBar = page.locator('ion-searchbar input, input[type="search"]').first();
    if (await searchBar.isVisible()) {
      console.log('   Searching for patient...');
      await searchBar.click();
      await page.waitForTimeout(500);
      await searchBar.fill('Juan');
      await page.waitForTimeout(2000); // Show search results
      await searchBar.clear();
      await page.waitForTimeout(1000);
    }

    // Click on first patient
    console.log('   Opening patient detail...');
    const patient = page.locator('ion-item, ion-card, .patient-item').first();
    if (await patient.isVisible()) {
      await patient.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Show patient detail

      // Scroll patient detail
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(1500);

      // =====================================================
      // SECTION 5: CLINICAL HISTORY / ODONTOGRAM
      // =====================================================
      const odontBtn = page.locator('ion-button:has-text("Historia"), ion-button:has-text("Odontograma")').first();
      if (await odontBtn.isVisible()) {
        console.log('5. Opening Clinical History...');
        await odontBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Show clinical history

        // Navigate through tabs
        const tabs = page.locator('ion-segment-button');
        const tabCount = await tabs.count();
        console.log(`   Found ${tabCount} tabs, navigating...`);

        for (let i = 0; i < Math.min(tabCount, 5); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(2500); // Pause on each tab

          // Scroll content in tab
          await page.mouse.wheel(0, 200);
          await page.waitForTimeout(1000);
          await page.mouse.wheel(0, -200);
          await page.waitForTimeout(500);
        }

        // If there's an odontogram, try to interact with teeth
        const teeth = page.locator('.tooth, .diente, [class*="tooth"]');
        if (await teeth.count() > 0) {
          console.log('   Interacting with odontogram...');
          await teeth.first().click();
          await page.waitForTimeout(2000);

          // Close any modal
          const closeBtn = page.locator('ion-button:has-text("Cerrar"), ion-button:has-text("Close"), .close-button').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }

    // =====================================================
    // SECTION 6: APPOINTMENTS / CALENDAR
    // =====================================================
    console.log('6. Navigating to Appointments...');
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Show appointments

    // Toggle view if available
    const viewToggle = page.locator('ion-segment-button').first();
    if (await viewToggle.isVisible()) {
      await viewToggle.click();
      await page.waitForTimeout(2000);
    }

    // Navigate calendar dates
    const nextBtn = page.locator('ion-button:has(ion-icon[name*="forward"]), ion-button:has(ion-icon[name*="chevron-forward"]), .next-btn').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
      await nextBtn.click();
      await page.waitForTimeout(1500);
    }

    const prevBtn = page.locator('ion-button:has(ion-icon[name*="back"]), ion-button:has(ion-icon[name*="chevron-back"]), .prev-btn').first();
    if (await prevBtn.isVisible()) {
      await prevBtn.click();
      await page.waitForTimeout(1500);
      await prevBtn.click();
      await page.waitForTimeout(1500);
    }

    // Try to open new appointment form
    const addBtn = page.locator('ion-fab-button, ion-button:has(ion-icon[name="add"])').first();
    if (await addBtn.isVisible()) {
      console.log('   Opening new appointment form...');
      await addBtn.click();
      await page.waitForTimeout(3000); // Show form

      // Scroll through form
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);

      // Close form/modal
      const cancelBtn = page.locator('ion-button:has-text("Cancelar"), ion-button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    // =====================================================
    // SECTION 7: BUDGETS
    // =====================================================
    console.log('7. Navigating to Budgets...');
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll through budgets
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(1500);

    // Click on first budget if available
    const budgetItem = page.locator('ion-item, ion-card, .budget-item').first();
    if (await budgetItem.isVisible()) {
      await budgetItem.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2500);

      // Go back
      await page.goBack();
      await page.waitForTimeout(1500);
    }

    // =====================================================
    // SECTION 8: OTHER SECTIONS (if available)
    // =====================================================
    console.log('8. Exploring other sections...');

    // Professionals
    await page.goto('/professionals').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Payments
    await page.goto('/payments').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // =====================================================
    // SECTION 9: LOGOUT
    // =====================================================
    console.log('9. Logging out...');

    // Open menu
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(1500);
    }

    // Find logout button
    const logoutBtn = page.locator('ion-item:has-text("Cerrar sesión"), ion-item:has-text("Salir"), ion-button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(3000); // Show logout transition
    }

    // =====================================================
    // FINAL: Back to login
    // =====================================================
    console.log('10. Tour completed - Back to login...');
    await page.waitForTimeout(2000);

    console.log('=== DEMO TOUR COMPLETED SUCCESSFULLY ===');
  });
});
