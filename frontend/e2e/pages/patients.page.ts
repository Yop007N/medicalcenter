import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Patients Page Object Model
 * Handles all interactions with patient management pages
 */
export class PatientsPage extends BasePage {
  // List Page Locators
  readonly patientsList: Locator;
  readonly patientCards: Locator;
  readonly searchInput: Locator;
  readonly addPatientButton: Locator;
  readonly filterButton: Locator;
  readonly emptyState: Locator;

  // Form Locators
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly dniInput: Locator;
  readonly birthDateInput: Locator;
  readonly addressInput: Locator;
  readonly genderSelect: Locator;
  readonly bloodTypeSelect: Locator;
  readonly allergiesInput: Locator;
  readonly notesInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Detail Page Locators
  readonly patientName: Locator;
  readonly patientInfo: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly appointmentsTab: Locator;
  readonly medicalRecordsTab: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    // List page
    this.patientsList = page.locator('.patients-list, ion-list');
    this.patientCards = page.locator('.patient-card, ion-item.patient-item');
    this.searchInput = page.locator('ion-searchbar, input[type="search"]');
    this.addPatientButton = page.locator('ion-fab-button, ion-button:has-text("Nuevo paciente"), ion-button:has-text("Agregar")');
    this.filterButton = page.locator('[data-testid="filter-button"], ion-button:has-text("Filtrar")');
    this.emptyState = page.locator('.empty-state, .no-patients');

    // Form fields - Ionic web components wrap native inputs
    this.firstNameInput = page.locator('ion-input[formControlName="firstName"] input, ion-input[formControlName="nombre"] input');
    this.lastNameInput = page.locator('ion-input[formControlName="lastName"] input, ion-input[formControlName="apellido"] input');
    this.emailInput = page.locator('ion-input[formControlName="email"] input');
    this.phoneInput = page.locator('ion-input[formControlName="phone"] input, ion-input[formControlName="telefono"] input');
    this.dniInput = page.locator('ion-input[formControlName="dni"] input, ion-input[formControlName="documento"] input');
    this.birthDateInput = page.locator('ion-datetime[formControlName="birthDate"], ion-input[formControlName="fechaNacimiento"] input');
    this.addressInput = page.locator('ion-input[formControlName="address"] input, ion-textarea[formControlName="direccion"] textarea');
    this.genderSelect = page.locator('ion-select[formControlName="gender"], ion-select[formControlName="genero"]');
    this.bloodTypeSelect = page.locator('ion-select[formControlName="bloodType"], ion-select[formControlName="grupoSanguineo"]');
    this.allergiesInput = page.locator('ion-textarea[formControlName="allergies"] textarea, ion-textarea[formControlName="alergias"] textarea');
    this.notesInput = page.locator('ion-textarea[formControlName="notes"] textarea, ion-textarea[formControlName="notas"] textarea');
    this.saveButton = page.locator('ion-button[type="submit"], ion-button:has-text("Guardar")');
    this.cancelButton = page.locator('ion-button:has-text("Cancelar")');

    // Detail page
    this.patientName = page.locator('.patient-name, h1, ion-title');
    this.patientInfo = page.locator('.patient-info, .patient-details');
    this.editButton = page.locator('ion-button:has-text("Editar"), [data-testid="edit-patient"]');
    this.deleteButton = page.locator('ion-button:has-text("Eliminar"), [data-testid="delete-patient"]');
    this.appointmentsTab = page.locator('ion-segment-button[value="appointments"], ion-tab-button:has-text("Citas")');
    this.medicalRecordsTab = page.locator('ion-segment-button[value="records"], ion-tab-button:has-text("Historial")');
    this.backButton = page.locator('ion-back-button, ion-button:has(ion-icon[name="arrow-back"])');
  }

  /**
   * Navigate to patients list
   */
  async navigate(): Promise<void> {
    await this.goto('/patients');
    await this.waitForLoadingComplete();
  }

  /**
   * Verify patients list page is displayed
   */
  async expectPatientsListPage(): Promise<void> {
    await this.page.waitForURL('**/patients**');
    await this.waitForLoadingComplete();
  }

  /**
   * Search for a patient
   */
  async searchPatient(query: string): Promise<void> {
    // ion-searchbar has native input inside
    const nativeInput = this.searchInput.locator('input');
    await nativeInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForLoadingComplete();
  }

  /**
   * Click add new patient button
   */
  async clickAddPatient(): Promise<void> {
    await this.addPatientButton.click();
    await this.page.waitForURL('**/patients/new**');
  }

  /**
   * Fill patient form
   */
  async fillPatientForm(patientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni?: string;
    birthDate?: string;
    address?: string;
    gender?: string;
    bloodType?: string;
    allergies?: string;
    notes?: string;
  }): Promise<void> {
    // Wait for form to be ready
    await this.firstNameInput.waitFor({ state: 'visible' });

    await this.firstNameInput.fill(patientData.firstName);
    await this.lastNameInput.fill(patientData.lastName);
    await this.emailInput.fill(patientData.email);
    await this.phoneInput.fill(patientData.phone);

    if (patientData.dni) {
      await this.dniInput.fill(patientData.dni);
    }

    if (patientData.birthDate) {
      // ion-datetime may need special handling
      const isDatetime = await this.page.locator('ion-datetime[formControlName="birthDate"]').isVisible();
      if (isDatetime) {
        await this.page.locator('ion-datetime[formControlName="birthDate"]').click();
        // Handle datetime picker modal if needed
      } else {
        await this.birthDateInput.fill(patientData.birthDate);
      }
    }

    if (patientData.address) {
      await this.addressInput.fill(patientData.address);
    }

    if (patientData.gender) {
      await this.selectOption('ion-select[formControlName="gender"]', patientData.gender);
    }

    if (patientData.bloodType) {
      await this.selectOption('ion-select[formControlName="bloodType"]', patientData.bloodType);
    }

    if (patientData.allergies) {
      await this.allergiesInput.fill(patientData.allergies);
    }

    if (patientData.notes) {
      await this.notesInput.fill(patientData.notes);
    }
  }

  /**
   * Submit patient form
   */
  async submitForm(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Create a new patient
   */
  async createPatient(patientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni?: string;
    birthDate?: string;
    address?: string;
    gender?: string;
    bloodType?: string;
    allergies?: string;
    notes?: string;
  }): Promise<void> {
    await this.clickAddPatient();
    await this.fillPatientForm(patientData);
    await this.submitForm();
    await this.waitForLoadingComplete();
  }

  /**
   * Select a patient from list
   */
  async selectPatient(patientName: string): Promise<void> {
    const patientItem = this.page.locator(`ion-item:has-text("${patientName}")`).first();
    await patientItem.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get patient count in list
   */
  async getPatientCount(): Promise<number> {
    await this.waitForLoadingComplete();
    return await this.patientCards.count();
  }

  /**
   * Check if patient exists in list
   */
  async patientExists(patientName: string): Promise<boolean> {
    await this.waitForLoadingComplete();
    const patient = this.page.locator(`ion-item:has-text("${patientName}")`);
    return await patient.isVisible();
  }

  /**
   * Delete current patient
   */
  async deletePatient(): Promise<void> {
    await this.deleteButton.click();
    // Confirm deletion
    const confirmButton = this.page.locator('ion-alert button:has-text("Eliminar"), ion-alert button:has-text("Sí")');
    await confirmButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Edit current patient
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Navigate to patient appointments tab
   */
  async goToAppointmentsTab(): Promise<void> {
    await this.appointmentsTab.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Navigate to medical records tab
   */
  async goToMedicalRecordsTab(): Promise<void> {
    await this.medicalRecordsTab.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Go back to list
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
    await this.expectPatientsListPage();
  }

  /**
   * Verify patient was created successfully
   */
  async expectPatientCreated(): Promise<void> {
    await this.waitForLoadingComplete();
    // Should redirect to patient detail or list
    const url = this.page.url();
    expect(url).toMatch(/\/patients(\/\d+)?/);
  }

  /**
   * Verify patient detail page is displayed
   */
  async expectPatientDetailPage(): Promise<void> {
    await this.page.waitForURL(/\/patients\/\d+/);
    await expect(this.patientName).toBeVisible();
  }

  /**
   * Get patient details from detail page
   */
  async getPatientDetails(): Promise<{ name: string; email: string; phone: string }> {
    const name = await this.patientName.textContent() || '';
    const email = await this.page.locator('.patient-email, [data-testid="patient-email"]').textContent() || '';
    const phone = await this.page.locator('.patient-phone, [data-testid="patient-phone"]').textContent() || '';
    return { name: name.trim(), email: email.trim(), phone: phone.trim() };
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Filter patients
   */
  async applyFilter(filterType: string, value: string): Promise<void> {
    await this.filterButton.click();
    const filterOption = this.page.locator(`ion-select-option[value="${filterType}"]`);
    await filterOption.click();
    await this.searchPatient(value);
  }
}
