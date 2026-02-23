import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Appointments Page Object Model
 * Handles all interactions with appointment management pages
 */
export class AppointmentsPage extends BasePage {
  // List/Calendar View Locators
  readonly calendarView: Locator;
  readonly listView: Locator;
  readonly viewToggle: Locator;
  readonly appointmentCards: Locator;
  readonly addAppointmentButton: Locator;
  readonly datePicker: Locator;
  readonly todayButton: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly emptyState: Locator;
  readonly searchInput: Locator;

  // Form Locators
  readonly patientSelect: Locator;
  readonly professionalSelect: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;
  readonly durationSelect: Locator;
  readonly typeSelect: Locator;
  readonly reasonInput: Locator;
  readonly notesInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Detail/Modal Locators
  readonly appointmentDetail: Locator;
  readonly appointmentTitle: Locator;
  readonly appointmentStatus: Locator;
  readonly editButton: Locator;
  readonly cancelAppointmentButton: Locator;
  readonly confirmButton: Locator;
  readonly completeButton: Locator;
  readonly rescheduleButton: Locator;
  readonly closeButton: Locator;

  // Status filters
  readonly statusFilter: Locator;
  readonly pendingFilter: Locator;
  readonly confirmedFilter: Locator;
  readonly completedFilter: Locator;
  readonly cancelledFilter: Locator;

  constructor(page: Page) {
    super(page);
    // List/Calendar
    this.calendarView = page.locator('.calendar-view, ion-calendar');
    this.listView = page.locator('.list-view, .appointments-list');
    this.viewToggle = page.locator('ion-segment, [data-testid="view-toggle"]');
    this.appointmentCards = page.locator('.appointment-card, ion-item.appointment-item');
    this.addAppointmentButton = page.locator('ion-fab-button, ion-button:has-text("Nueva cita"), ion-button:has-text("Agregar")');
    this.datePicker = page.locator('ion-datetime, .date-picker');
    this.todayButton = page.locator('ion-button:has-text("Hoy"), [data-testid="today-button"]');
    this.previousButton = page.locator('[data-testid="prev-button"], ion-button:has(ion-icon[name="chevron-back"])');
    this.nextButton = page.locator('[data-testid="next-button"], ion-button:has(ion-icon[name="chevron-forward"])');
    this.emptyState = page.locator('.empty-state, .no-appointments');
    this.searchInput = page.locator('ion-searchbar');

    // Form - Ionic web components wrap native inputs
    this.patientSelect = page.locator('ion-select[formControlName="patientId"], ion-select[formControlName="paciente"]');
    this.professionalSelect = page.locator('ion-select[formControlName="professionalId"], ion-select[formControlName="profesional"]');
    this.dateInput = page.locator('ion-datetime[formControlName="date"], ion-input[formControlName="fecha"] input');
    this.timeInput = page.locator('ion-datetime[formControlName="time"], ion-input[formControlName="hora"] input');
    this.durationSelect = page.locator('ion-select[formControlName="duration"], ion-select[formControlName="duracion"]');
    this.typeSelect = page.locator('ion-select[formControlName="type"], ion-select[formControlName="tipo"]');
    this.reasonInput = page.locator('ion-input[formControlName="reason"] input, ion-textarea[formControlName="motivo"] textarea');
    this.notesInput = page.locator('ion-textarea[formControlName="notes"] textarea, ion-textarea[formControlName="notas"] textarea');
    this.saveButton = page.locator('ion-button[type="submit"], ion-button:has-text("Guardar")');
    this.cancelButton = page.locator('ion-button:has-text("Cancelar"):not([color="danger"])');

    // Detail
    this.appointmentDetail = page.locator('.appointment-detail, ion-modal, .detail-card');
    this.appointmentTitle = page.locator('.appointment-title, h2');
    this.appointmentStatus = page.locator('.appointment-status, ion-badge');
    this.editButton = page.locator('ion-button:has-text("Editar")');
    this.cancelAppointmentButton = page.locator('ion-button:has-text("Cancelar cita"), ion-button[color="danger"]:has-text("Cancelar")');
    this.confirmButton = page.locator('ion-button:has-text("Confirmar")');
    this.completeButton = page.locator('ion-button:has-text("Completar"), ion-button:has-text("Finalizar")');
    this.rescheduleButton = page.locator('ion-button:has-text("Reprogramar")');
    this.closeButton = page.locator('ion-button:has(ion-icon[name="close"]), ion-button:has-text("Cerrar")');

    // Status filters
    this.statusFilter = page.locator('[data-testid="status-filter"], ion-segment');
    this.pendingFilter = page.locator('ion-segment-button[value="pending"]');
    this.confirmedFilter = page.locator('ion-segment-button[value="confirmed"]');
    this.completedFilter = page.locator('ion-segment-button[value="completed"]');
    this.cancelledFilter = page.locator('ion-segment-button[value="cancelled"]');
  }

  /**
   * Navigate to appointments page
   */
  async navigate(): Promise<void> {
    await this.goto('/appointments');
    await this.waitForLoadingComplete();
  }

  /**
   * Verify appointments page is displayed
   */
  async expectAppointmentsPage(): Promise<void> {
    await this.page.waitForURL('**/appointments**');
    await this.waitForLoadingComplete();
  }

  /**
   * Switch to calendar view
   */
  async switchToCalendarView(): Promise<void> {
    const calendarButton = this.page.locator('ion-segment-button[value="calendar"]');
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
    }
  }

  /**
   * Switch to list view
   */
  async switchToListView(): Promise<void> {
    const listButton = this.page.locator('ion-segment-button[value="list"]');
    if (await listButton.isVisible()) {
      await listButton.click();
    }
  }

  /**
   * Click add new appointment button
   */
  async clickAddAppointment(): Promise<void> {
    await this.addAppointmentButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Fill appointment form
   */
  async fillAppointmentForm(appointmentData: {
    patientId?: string;
    professionalId?: string;
    date: string;
    time: string;
    duration?: number;
    type?: string;
    reason: string;
    notes?: string;
  }): Promise<void> {
    if (appointmentData.patientId) {
      await this.patientSelect.click();
      await this.page.locator(`ion-select-option[value="${appointmentData.patientId}"]`).click();
    }

    if (appointmentData.professionalId) {
      await this.professionalSelect.click();
      await this.page.locator(`ion-select-option[value="${appointmentData.professionalId}"]`).click();
    }

    // Handle date input
    await this.dateInput.fill(appointmentData.date);
    await this.timeInput.fill(appointmentData.time);

    if (appointmentData.duration) {
      await this.durationSelect.click();
      await this.page.locator(`ion-select-option[value="${appointmentData.duration}"]`).click();
    }

    if (appointmentData.type) {
      await this.typeSelect.click();
      await this.page.locator(`ion-select-option[value="${appointmentData.type}"]`).click();
    }

    await this.reasonInput.fill(appointmentData.reason);

    if (appointmentData.notes) {
      await this.notesInput.fill(appointmentData.notes);
    }
  }

  /**
   * Submit appointment form
   */
  async submitForm(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: {
    patientId?: string;
    professionalId?: string;
    date: string;
    time: string;
    duration?: number;
    type?: string;
    reason: string;
    notes?: string;
  }): Promise<void> {
    await this.clickAddAppointment();
    await this.fillAppointmentForm(appointmentData);
    await this.submitForm();
    await this.waitForLoadingComplete();
  }

  /**
   * Select an appointment from list
   */
  async selectAppointment(patientName: string): Promise<void> {
    const appointmentItem = this.page.locator(`.appointment-card:has-text("${patientName}")`).first();
    await appointmentItem.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get appointment count
   */
  async getAppointmentCount(): Promise<number> {
    await this.waitForLoadingComplete();
    return await this.appointmentCards.count();
  }

  /**
   * Navigate to today
   */
  async goToToday(): Promise<void> {
    if (await this.todayButton.isVisible()) {
      await this.todayButton.click();
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Navigate to previous day/week
   */
  async goToPrevious(): Promise<void> {
    await this.previousButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Navigate to next day/week
   */
  async goToNext(): Promise<void> {
    await this.nextButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Confirm an appointment
   */
  async confirmAppointment(): Promise<void> {
    await this.confirmButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(): Promise<void> {
    await this.cancelAppointmentButton.click();
    // Confirm cancellation
    const confirmButton = this.page.locator('ion-alert button:has-text("Sí"), ion-alert button:has-text("Confirmar")');
    await confirmButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(): Promise<void> {
    await this.completeButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(newDate: string, newTime: string): Promise<void> {
    await this.rescheduleButton.click();
    await this.dateInput.fill(newDate);
    await this.timeInput.fill(newTime);
    await this.saveButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<void> {
    const filterButton = this.page.locator(`ion-segment-button[value="${status}"]`);
    await filterButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Search appointments
   */
  async searchAppointments(query: string): Promise<void> {
    // ion-searchbar has native input inside
    const nativeInput = this.searchInput.locator('input');
    await nativeInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForLoadingComplete();
  }

  /**
   * Verify appointment was created
   */
  async expectAppointmentCreated(): Promise<void> {
    await this.waitForLoadingComplete();
    // Check for success toast or redirect
    const toast = this.page.locator('ion-toast');
    if (await toast.isVisible()) {
      await expect(toast).toContainText(/creada|guardada|exitoso/i);
    }
  }

  /**
   * Get appointment status
   */
  async getAppointmentStatus(): Promise<string> {
    return await this.appointmentStatus.textContent() || '';
  }

  /**
   * Check if appointment exists
   */
  async appointmentExists(patientName: string, date?: string): Promise<boolean> {
    await this.waitForLoadingComplete();
    let locator = this.page.locator(`.appointment-card:has-text("${patientName}")`);
    if (date) {
      locator = locator.filter({ hasText: date });
    }
    return await locator.isVisible();
  }

  /**
   * Get all appointments for today
   */
  async getTodayAppointments(): Promise<string[]> {
    await this.goToToday();
    const appointments = await this.appointmentCards.allTextContents();
    return appointments;
  }

  /**
   * Close appointment detail/modal
   */
  async closeDetail(): Promise<void> {
    if (await this.closeButton.isVisible()) {
      await this.closeButton.click();
    }
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Select date from calendar
   */
  async selectDate(date: string): Promise<void> {
    // Format: YYYY-MM-DD
    const [year, month, day] = date.split('-');
    const dayButton = this.page.locator(`.calendar-day[data-day="${day}"]`);
    if (await dayButton.isVisible()) {
      await dayButton.click();
      await this.waitForLoadingComplete();
    }
  }
}
