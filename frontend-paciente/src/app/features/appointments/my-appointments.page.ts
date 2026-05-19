import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientApiService } from '../../core/services/patient-api.service';
import { CreatePatientAppointmentPayload, PatientAppointment, ProfessionalAvailabilityItem } from '../../core/models/appointment.model';
import { SpecialtyCatalogItem } from '../../core/models/specialty.model';
import { UiDialogService } from '../../core/services/ui-dialog.service';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-my-appointments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mis turnos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel hero-panel">
        <h2 class="panel-title">Agenda personal</h2>
        <p class="panel-text">Agenda solo en horarios disponibles, cercanos y confirmables.</p>

        <div class="summary-grid">
          <article>
            <strong>{{ appointments.length }}</strong>
            <span>Total</span>
          </article>
          <article>
            <strong>{{ upcomingCount }}</strong>
            <span>Proximos</span>
          </article>
          <article>
            <strong>{{ completedCount }}</strong>
            <span>Completados</span>
          </article>
          <article>
            <strong>{{ cancelledCount }}</strong>
            <span>Cancelados</span>
          </article>
        </div>

        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="applyFilter()" class="filter-segment">
          <ion-segment-button value="all">Todos</ion-segment-button>
          <ion-segment-button value="upcoming">Proximos</ion-segment-button>
          <ion-segment-button value="completed">Completados</ion-segment-button>
          <ion-segment-button value="cancelled">Cancelados</ion-segment-button>
        </ion-segment>
      </section>

      <section class="panel">
        <h3 class="panel-title">Solicitar nuevo turno</h3>
        <p class="panel-text">Selecciona profesional y horario libre mas cercano.</p>

        <ion-searchbar
          [(ngModel)]="professionalQuery"
          (ionInput)="applyProfessionalFilters()"
          placeholder="Buscar profesional por nombre o especialidad"
          class="compact-search"
        ></ion-searchbar>

        <div class="booking-filters">
          <ion-item>
            <ion-label position="stacked">Especialidad</ion-label>
              <ion-select interface="popover" [(ngModel)]="specialtyFilter" (ionChange)="onSpecialtyFilterChange()">
              <ion-select-option value="all">Todas</ion-select-option>
              @for (specialty of specialtyOptions; track specialty) {
                <ion-select-option [value]="specialty">{{ getSpecialtyDisplayName(specialty) }}</ion-select-option>
              }
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Buscar desde</ion-label>
            <ion-input type="date" [(ngModel)]="slotSearchDate" (ionBlur)="reloadAvailability()"></ion-input>
          </ion-item>
        </div>

        <div class="item-actions">
          <ion-button size="small" fill="outline" (click)="reloadAvailability()">
            Actualizar disponibilidad
          </ion-button>
        </div>

        <div class="professional-picker">
          @if (professionalLoading) {
            <p class="panel-text">Buscando horarios disponibles...</p>
          } @else if (filteredProfessionals.length === 0) {
            <p class="panel-text">
              No hay profesionales con horarios libres para ese criterio cercano.
            </p>
          } @else {
            @for (professional of filteredProfessionals; track professional.id) {
              <article class="professional-option" [class.active]="professional.id === bookingProfessionalId">
                <header>
                  <strong>{{ professional.first_name }} {{ professional.last_name }}</strong>
                  <span>{{ getSpecialtyDisplayName(professional.specialty) }}</span>
                </header>
                <p class="slot-hint">
                  Proximo horario: {{ professional.next_available_slot | date:'dd/MM/yyyy HH:mm' }}
                </p>
                @if (getProfessionalAffinityScore(professional.id) > 0) {
                  <p class="slot-hint">
                    Continuidad clínica: {{ getProfessionalAffinityScore(professional.id) }} turno(s) previo(s)
                  </p>
                }
                <div class="slot-grid">
                  @for (slot of professional.available_slots; track slot) {
                    <button
                      type="button"
                      class="slot-chip"
                      [class.selected]="isSelectedSlot(professional.id, slot)"
                      (click)="selectSlot(professional, slot)"
                      [attr.aria-label]="'Seleccionar turno para el ' + (slot | date:'dd/MM HH:mm')"
                    >
                      {{ slot | date:'dd/MM HH:mm' }}
                    </button>
                  }
                </div>
              </article>
            }
          }
        </div>

        <ion-item>
          <ion-label position="stacked">Tipo de cita</ion-label>
          <ion-input maxlength="80" [(ngModel)]="bookingType" [disabled]="booking"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Motivo</ion-label>
          <ion-textarea
            autoGrow="true"
            maxlength="220"
            [(ngModel)]="bookingReason"
            [disabled]="booking"
            placeholder="Describe brevemente el motivo de tu consulta"
          ></ion-textarea>
        </ion-item>

        @if (selectedSlotLabel) {
          <p class="panel-text selected-professional">
            Slot seleccionado: <strong>{{ selectedSlotLabel }}</strong>
          </p>
        }

        <div class="item-actions">
          <ion-button size="small" (click)="createAppointment()" [disabled]="!canCreateAppointment() || booking">
            @if (booking) { Solicitando... } @else { Solicitar turno }
          </ion-button>
        </div>
      </section>

      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (!loading && appointments.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin turnos registrados</h3>
          <p class="panel-text">Todavia no hay turnos en tu agenda.</p>
        </section>
      }

      @if (!loading && appointments.length > 0 && filteredAppointments.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin resultados</h3>
          <p class="panel-text">No hay turnos para el filtro seleccionado.</p>
        </section>
      }

      @if (filteredAppointments.length > 0) {
        <ion-list inset="true">
          @for (appointment of filteredAppointments; track appointment.id) {
            <ion-item>
              <ion-label>
                <h2>{{ appointment.appointment_date | date:'medium' }}</h2>
                <p>
                  {{ appointment.appointment_type || 'Consulta general' }}
                  <br />
                  Profesional: {{ appointment.professional?.first_name }} {{ appointment.professional?.last_name }}
                  @if (appointment.professional?.specialty) {
                    ({{ getSpecialtyDisplayName(appointment.professional?.specialty) }})
                  }
                </p>
                <div class="item-actions">
                  <span class="status-chip" [class]="'status-' + appointment.status">
                    {{ toStatusLabel(appointment.status) }}
                  </span>
                  @if (canCancel(appointment)) {
                    <ion-button
                      size="small"
                      fill="outline"
                      color="danger"
                      (click)="cancelAppointment(appointment)"
                      [disabled]="cancellingIds.has(appointment.id)"
                    >
                      @if (cancellingIds.has(appointment.id)) { Cancelando... } @else { Cancelar }
                    </ion-button>
                  }
                </div>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styleUrls: ['../../shared/styles/page-shell.styles.scss'],
  styles: [`
      .hero-panel {
        background: linear-gradient(
          140deg,
          rgba(var(--ion-color-primary-rgb), 0.14) 0%,
          rgba(var(--ion-color-primary-rgb), 0.06) 100%
        );
      }

      .summary-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 12px;
      }

      .summary-grid article {
        background: var(--patient-surface);
        border: 1px solid var(--patient-border);
        border-radius: 10px;
        display: grid;
        gap: 2px;
        min-height: 72px;
        padding: 10px;
      }

      .summary-grid strong {
        color: var(--ion-color-dark);
        font-size: 1.05rem;
      }

      .summary-grid span {
        color: var(--ion-color-medium);
        font-size: 0.74rem;
      }

      .filter-segment {
        margin-top: 10px;
      }

      .compact-search {
        --background: var(--patient-surface);
        --box-shadow: none;
        --border-radius: 10px;
        --placeholder-color: var(--ion-color-medium);
        margin-bottom: 8px;
      }

      .booking-filters {
        display: grid;
        gap: 8px;
      }

      .professional-picker {
        border: 1px solid var(--patient-border);
        border-radius: 12px;
        display: grid;
        gap: 8px;
        margin-bottom: 10px;
        max-height: 320px;
        overflow: auto;
        padding: 8px;
      }

      .professional-option {
        background: var(--patient-surface-soft);
        border: 1px solid transparent;
        border-radius: 10px;
        display: grid;
        gap: 6px;
        padding: 10px;
      }

      .professional-option header {
        display: grid;
        gap: 2px;
      }

      .professional-option strong {
        color: var(--ion-color-dark);
        font-size: 0.84rem;
      }

      .professional-option span {
        color: var(--ion-color-medium);
        font-size: 0.74rem;
      }

      .professional-option.active {
        background: rgba(var(--ion-color-primary-rgb), 0.12);
        border-color: rgba(var(--ion-color-primary-rgb), 0.35);
      }

      .slot-hint {
        color: var(--ion-color-medium);
        font-size: 0.74rem;
        margin: 0;
      }

      .slot-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .slot-chip {
        background: var(--patient-surface);
        border: 1px solid var(--patient-border);
        border-radius: 999px;
        color: var(--ion-color-dark);
        font-size: 0.73rem;
        padding: 4px 10px;
      }

      .slot-chip.selected {
        background: rgba(var(--ion-color-primary-rgb), 0.16);
        border-color: rgba(var(--ion-color-primary-rgb), 0.45);
        color: var(--ion-color-primary-shade);
        font-weight: 700;
      }

      .selected-professional {
        margin-top: 2px;
      }

      .item-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }

      @media (min-width: 768px) {
        .summary-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .booking-filters {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `]
})
export class MyAppointmentsPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);
  private readonly uiDialog = inject(UiDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  appointments: PatientAppointment[] = [];
  filteredAppointments: PatientAppointment[] = [];
  professionals: ProfessionalAvailabilityItem[] = [];
  filteredProfessionals: ProfessionalAvailabilityItem[] = [];
  specialtyOptions: string[] = [];
  specialtyCatalog: SpecialtyCatalogItem[] = [];
  loading = false;
  professionalLoading = false;
  booking = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFilter: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all';
  cancellingIds = new Set<number>();
  bookingProfessionalId: number | null = null;
  bookingDate = '';
  bookingType = 'Consulta general';
  bookingReason = '';
  professionalQuery = '';
  specialtyFilter = 'all';
  slotSearchDate = '';

  upcomingCount = 0;
  completedCount = 0;
  cancelledCount = 0;

  get selectedSlotLabel(): string | null {
    if (!this.bookingProfessionalId || !this.bookingDate) {
      return null;
    }
    const professional = this.professionals.find((item) => item.id === this.bookingProfessionalId);
    if (!professional) {
      return null;
    }
    return `${professional.first_name} ${professional.last_name} - ${this.formatSlot(this.bookingDate)}`;
  }

  ngOnInit(): void {
    this.slotSearchDate = this.toDateInput(new Date());
    this.loadSpecialtyCatalog();
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.specialtyFilter = params.get('specialty_key')?.trim() || 'all';
        this.loadAppointments();
        this.loadAvailableProfessionals();
      });
  }

  refresh(event: CustomEvent): void {
    this.loadAppointments(() => event.detail.complete());
    this.loadAvailableProfessionals();
  }

  private loadAppointments(onComplete?: () => void): void {
    this.loading = true;
    this.errorMessage = null;

    this.patientApi.getMyAppointments().subscribe({
      next: (appointments) => {
        this.appointments = this.sortAppointments(appointments);
        this.recalculateCounters();
        this.applyFilter();
        if (this.professionals.length > 0) {
          this.professionals = this.sortProfessionalsByAvailability(this.professionals);
          this.applyProfessionalFilters();
        }
        this.loading = false;
        onComplete?.();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
        onComplete?.();
      }
    });
  }

  reloadAvailability(): void {
    this.loadAvailableProfessionals();
  }

  onSpecialtyFilterChange(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { specialty_key: this.specialtyFilter === 'all' ? null : this.specialtyFilter },
      queryParamsHandling: 'merge'
    });
  }

  private loadAvailableProfessionals(): void {
    this.professionalLoading = true;
    const specialty =
      this.specialtyFilter === 'all' ? undefined : this.specialtyFilter;
    const normalizedDate = this.slotSearchDate?.trim() || this.toDateInput(new Date());
    this.slotSearchDate = normalizedDate;

    this.patientApi
      .listAvailableProfessionals({
        specialty,
        date_from: `${normalizedDate}T00:00:00`,
        days: 7,
        slots_per_professional: 6
      })
      .subscribe({
        next: (professionals) => {
          this.professionals = this.sortProfessionalsByAvailability(professionals);
          this.specialtyOptions = this.buildSpecialtyOptions(this.professionals);
          if (this.specialtyFilter !== 'all' && !this.specialtyOptions.includes(this.specialtyFilter)) {
            this.specialtyFilter = 'all';
          }
          this.applyProfessionalFilters();
          this.professionalLoading = false;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
          this.professionalLoading = false;
        }
      });
  }

  canCreateAppointment(): boolean {
    return Boolean(this.bookingProfessionalId) && Boolean(this.bookingDate);
  }

  isSelectedSlot(professionalId: number, slot: string): boolean {
    return professionalId === this.bookingProfessionalId && slot === this.bookingDate;
  }

  selectSlot(professional: ProfessionalAvailabilityItem, slot: string): void {
    this.bookingProfessionalId = professional.id;
    this.bookingDate = slot;
  }

  applyProfessionalFilters(): void {
    const normalizedQuery = this.professionalQuery.trim().toLowerCase();
    this.filteredProfessionals = this.professionals.filter((professional) => {
      if (!normalizedQuery) {
        return true;
      }

      const professionalText = `${professional.first_name} ${professional.last_name} ${professional.specialty ?? ''} ${this.getSpecialtyDisplayName(professional.specialty)}`
        .toLowerCase()
        .trim();
      return professionalText.includes(normalizedQuery);
    });
    this.ensureSelectionForFilteredProfessionals();
  }

  createAppointment(): void {
    if (!this.bookingProfessionalId || !this.bookingDate) {
      return;
    }

    const payload: CreatePatientAppointmentPayload = {
      professional_id: this.bookingProfessionalId,
      appointment_date: this.bookingDate,
      appointment_type: this.bookingType.trim() || null,
      reason: this.bookingReason.trim() || null
    };

    this.errorMessage = null;
    this.successMessage = null;
    this.booking = true;

    this.patientApi.createMyAppointment(payload).subscribe({
      next: (appointment) => {
        this.appointments = this.sortAppointments([appointment, ...this.appointments]);
        this.recalculateCounters();
        this.selectedFilter = 'upcoming';
        this.applyFilter();
        this.successMessage = `Turno #${appointment.id} solicitado correctamente.`;
        this.bookingDate = '';
        this.bookingReason = '';
        this.booking = false;
        this.loadAvailableProfessionals();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.booking = false;
        this.loadAvailableProfessionals();
      }
    });
  }

  applyFilter(): void {
    const now = Date.now();

    if (this.selectedFilter === 'all') {
      this.filteredAppointments = [...this.appointments];
      return;
    }

    if (this.selectedFilter === 'upcoming') {
      this.filteredAppointments = this.appointments.filter((appointment) => {
        const status = appointment.status;
        const appointmentTime = new Date(appointment.appointment_date).getTime();
        return ['pending', 'scheduled', 'confirmed'].includes(status) && appointmentTime >= now;
      });
      return;
    }

    if (this.selectedFilter === 'completed') {
      this.filteredAppointments = this.appointments.filter(
        (appointment) => appointment.status === 'completed'
      );
      return;
    }

    this.filteredAppointments = this.appointments.filter(
      (appointment) => appointment.status === 'cancelled' || appointment.status === 'no_show'
    );
  }

  canCancel(appointment: PatientAppointment): boolean {
    return ['pending', 'scheduled', 'confirmed'].includes(appointment.status);
  }

  async cancelAppointment(appointment: PatientAppointment): Promise<void> {
    const reason = await this.uiDialog.promptText({
      header: 'Cancelar turno',
      message: `Turno #${appointment.id}: indica un motivo opcional`,
      placeholder: 'Motivo de cancelacion',
      confirmText: 'Confirmar cancelacion',
      cancelText: 'Volver',
      multiline: true,
      maxLength: 220
    });
    if (reason === null) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.cancellingIds.add(appointment.id);
    this.patientApi.cancelMyAppointment(appointment.id, reason.trim() || undefined).subscribe({
      next: () => {
        this.appointments = this.appointments.map((item) =>
          item.id === appointment.id ? { ...item, status: 'cancelled' } : item
        );
        this.recalculateCounters();
        this.applyFilter();
        this.successMessage = `Turno #${appointment.id} cancelado.`;
        this.cancellingIds.delete(appointment.id);
        this.loadAvailableProfessionals();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.cancellingIds.delete(appointment.id);
      }
    });
  }

  toStatusLabel(status: PatientAppointment['status']): string {
    const labels: Record<PatientAppointment['status'], string> = {
      pending: 'Pendiente',
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Completado',
      cancelled: 'Cancelado',
      no_show: 'No asistio'
    };
    return labels[status] ?? status;
  }

  private buildSpecialtyOptions(professionals: ProfessionalAvailabilityItem[]): string[] {
    const specialties = professionals
      .map((professional) => (professional.specialty ?? '').trim())
      .filter((specialty) => specialty.length > 0);
    return [...new Set(specialties)].sort((a, b) =>
      this.getSpecialtyDisplayName(a).localeCompare(this.getSpecialtyDisplayName(b))
    );
  }

  private sortProfessionalsByAvailability(
    professionals: ProfessionalAvailabilityItem[]
  ): ProfessionalAvailabilityItem[] {
    const normalizeSlots = (slots: string[]): string[] =>
      [...slots].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return [...professionals]
      .map((professional) => ({
        ...professional,
        available_slots: normalizeSlots(professional.available_slots ?? []),
      }))
      .sort((a, b) => {
        const nearestA = this.nearestSlotEpoch(a);
        const nearestB = this.nearestSlotEpoch(b);
        if (nearestA !== nearestB) {
          return nearestA - nearestB;
        }
        const affinityDelta = this.getProfessionalAffinityScore(b.id) - this.getProfessionalAffinityScore(a.id);
        if (affinityDelta !== 0) {
          return affinityDelta;
        }
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });
  }

  private nearestSlotEpoch(professional: ProfessionalAvailabilityItem): number {
    const firstSlot = professional.available_slots?.[0] || professional.next_available_slot;
    const epoch = firstSlot ? new Date(firstSlot).getTime() : Number.POSITIVE_INFINITY;
    return Number.isFinite(epoch) ? epoch : Number.POSITIVE_INFINITY;
  }

  private ensureSelectionForFilteredProfessionals(): void {
    if (this.filteredProfessionals.length === 0) {
      this.bookingProfessionalId = null;
      this.bookingDate = '';
      return;
    }

    if (this.bookingProfessionalId) {
      const selectedProfessional = this.filteredProfessionals.find(
        (professional) => professional.id === this.bookingProfessionalId
      );
      if (selectedProfessional) {
        if (!selectedProfessional.available_slots.includes(this.bookingDate)) {
          this.bookingDate = selectedProfessional.available_slots[0] ?? '';
        }
        return;
      }
    }

    const nearestProfessional = this.filteredProfessionals.find(
      (professional) => professional.available_slots.length > 0
    );
    this.bookingProfessionalId = nearestProfessional?.id ?? null;
    this.bookingDate = nearestProfessional?.available_slots[0] ?? '';
  }

  getSpecialtyDisplayName(rawSpecialty?: string | null): string {
    const specialty = (rawSpecialty ?? '').trim();
    if (!specialty) {
      return 'Especialidad general';
    }

    const normalized = this.normalizeText(specialty);
    const catalogItem = this.specialtyCatalog.find((item) => {
      const itemKey = this.normalizeText(item.key);
      const itemLabel = this.normalizeText(item.label);
      return normalized === itemKey || normalized === itemLabel;
    });
    return catalogItem?.label ?? specialty;
  }

  getProfessionalAffinityScore(professionalId: number): number {
    return this.appointments.filter((appointment) => appointment.professional?.id === professionalId).length;
  }

  private loadSpecialtyCatalog(): void {
    this.patientApi.getSpecialtiesCatalog().subscribe({
      next: (catalog) => {
        this.specialtyCatalog = [...catalog].sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {
        this.specialtyCatalog = [];
      }
    });
  }

  private normalizeText(rawValue: string): string {
    return rawValue
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private recalculateCounters(): void {
    const now = Date.now();
    this.upcomingCount = this.appointments.filter((appointment) => {
      const appointmentTime = new Date(appointment.appointment_date).getTime();
      return ['pending', 'scheduled', 'confirmed'].includes(appointment.status) && appointmentTime >= now;
    }).length;
    this.completedCount = this.appointments.filter((appointment) => appointment.status === 'completed').length;
    this.cancelledCount = this.appointments.filter(
      (appointment) => appointment.status === 'cancelled' || appointment.status === 'no_show'
    ).length;
  }

  private toDateInput(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private formatSlot(slotIso: string): string {
    const date = new Date(slotIso);
    return date.toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'No se pudieron cargar tus turnos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }

  private sortAppointments(appointments: PatientAppointment[]): PatientAppointment[] {
    return [...appointments].sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime()
    );
  }
}
