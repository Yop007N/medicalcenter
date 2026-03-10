import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientApiService } from '../../core/services/patient-api.service';
import { PatientAppointment } from '../../core/models/appointment.model';
import { PatientMedicalRecord } from '../../core/models/patient.model';
import { SpecialtyCatalogItem, PatientSpecialtyHistory, PatientSpecialtyOverview } from '../../core/models/specialty.model';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

type CareInstruction = {
  id: string;
  title: string;
  detail: string;
  date: string;
  professional: string;
};

@Component({
  selector: 'app-my-care-plan-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Plan de cuidado</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel care-hero">
        <h2 class="panel-title">Indicaciones del equipo profesional</h2>
        <p class="panel-text">
          Aqui ves de forma clara que debes seguir en medicacion, tratamientos y controles.
        </p>
        <div class="hero-grid">
          <article class="hero-card">
            <strong>{{ instructions.length }}</strong>
            <span>Indicaciones</span>
          </article>
          <article class="hero-card">
            <strong>{{ medications.length }}</strong>
            <span>Medicamentos</span>
          </article>
          <article class="hero-card">
            <strong>{{ treatmentItems.length }}</strong>
            <span>Tratamientos</span>
          </article>
          <article class="hero-card">
            <strong>{{ nextControlDate ? (nextControlDate | date:'dd/MM') : '--' }}</strong>
            <span>Proximo control</span>
          </article>
        </div>
      </section>

      <section class="panel">
        <h3 class="panel-title">Enfoque por especialidad</h3>
        <p class="panel-text">Filtra las indicaciones para revisar el seguimiento de un módulo clínico específico.</p>
        <ion-item lines="none">
          <ion-label>Especialidad</ion-label>
          <ion-select
            [value]="selectedSpecialtyKey"
            placeholder="Todas"
            interface="popover"
            (ionChange)="onSpecialtyChange($event)"
          >
            <ion-select-option value="">Todas</ion-select-option>
            @for (specialty of specialtyCatalog; track specialty.key) {
              <ion-select-option [value]="specialty.key">{{ specialty.label }}</ion-select-option>
            }
          </ion-select>
        </ion-item>

        @if (selectedSpecialtyKey && specialtyOverview) {
          <div class="hero-grid specialty-grid">
            <article class="hero-card">
              <strong>{{ specialtyOverview.totals.appointments_upcoming }}</strong>
              <span>Turnos próximos</span>
            </article>
            <article class="hero-card">
              <strong>{{ specialtyOverview.totals.medical_records }}</strong>
              <span>Registros del módulo</span>
            </article>
            <article class="hero-card">
              <strong>{{ specialtyHistory?.totals?.encounters ?? 0 }}</strong>
              <span>Atenciones</span>
            </article>
            <article class="hero-card">
              <strong>{{ specialtyHistory?.totals?.documents ?? 0 }}</strong>
              <span>Documentos</span>
            </article>
          </div>

          @if (specialtyCareTeam.length > 0) {
            <p class="panel-text">
              Equipo tratante:
              <strong>{{ specialtyCareTeam[0].name }}</strong>
              @if (specialtyCareTeam.length > 1) {
                <span> y {{ specialtyCareTeam.length - 1 }} profesional(es) más</span>
              }
            </p>
          }
        }
      </section>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      <ion-segment [value]="activeView" (ionChange)="onViewChange($event)">
        <ion-segment-button value="instructions">Indicaciones</ion-segment-button>
        <ion-segment-button value="medications">Medicacion</ion-segment-button>
        <ion-segment-button value="treatments">Tratamientos</ion-segment-button>
      </ion-segment>

      @if (loading) {
        <section class="panel loading-panel">
          <ion-spinner name="crescent"></ion-spinner>
          <p class="panel-text">Preparando plan de cuidado...</p>
        </section>
      }

      @if (!loading && activeView === 'instructions') {
        @if (instructions.length === 0) {
          <section class="panel">
            <p class="panel-text">Aun no hay indicaciones registradas en tu historia reciente.</p>
          </section>
        } @else {
          @for (item of instructions; track item.id) {
            <section class="panel">
              <div class="row-head">
                <h3 class="panel-title">{{ item.title }}</h3>
                <span class="status-chip status-sent">{{ item.date | date:'dd/MM/yyyy' }}</span>
              </div>
              <p class="panel-text">{{ item.detail }}</p>
              <p class="panel-text">
                Profesional responsable: <strong>{{ item.professional }}</strong>
              </p>
            </section>
          }
        }
      }

      @if (!loading && activeView === 'medications') {
        @if (medications.length === 0) {
          <section class="panel">
            <p class="panel-text">No hay medicamentos activos documentados por ahora.</p>
          </section>
        } @else {
          <ion-list inset="true">
            @for (medication of medications; track medication) {
              <ion-item>
                <ion-label>
                  <h3>{{ medication }}</h3>
                  <p>Seguir indicacion profesional y no automedicarse.</p>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }
      }

      @if (!loading && activeView === 'treatments') {
        @if (treatmentItems.length === 0) {
          <section class="panel">
            <p class="panel-text">No hay tratamientos clínicos cargados para mostrar.</p>
          </section>
        } @else {
          @for (item of treatmentItems; track item.id) {
            <section class="panel">
              <div class="row-head">
                <h3 class="panel-title">{{ item.title }}</h3>
                <span class="status-chip status-confirmed">{{ item.date | date:'dd/MM/yyyy' }}</span>
              </div>
              <p class="panel-text">{{ item.detail }}</p>
              <p class="panel-text">
                Profesional: <strong>{{ item.professional }}</strong>
              </p>
            </section>
          }
        }
      }

      <section class="panel">
        <h3 class="panel-title">Proximo control sugerido</h3>
        @if (nextControlDate) {
          <p class="panel-text">
            Tu siguiente cita esta programada para
            <strong>{{ nextControlDate | date:'fullDate' }}</strong>.
          </p>
        } @else {
          <p class="panel-text">No hay una fecha de control registrada en este momento.</p>
        }
      </section>
    </ion-content>
  `,
  styleUrls: ['../../shared/styles/page-shell.styles.scss'],
  styles: [`
      .care-hero {
        background: linear-gradient(
          140deg,
          rgba(var(--ion-color-primary-rgb), 0.14) 0%,
          rgba(var(--ion-color-primary-rgb), 0.06) 100%
        );
      }

      .hero-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 12px;
      }

      .hero-card {
        background: var(--patient-surface);
        border: 1px solid var(--patient-border);
        border-radius: 12px;
        display: grid;
        gap: 2px;
        min-height: 76px;
        padding: 10px;
      }

      .hero-card strong {
        color: var(--ion-color-dark);
        font-size: 1.15rem;
        font-weight: 700;
      }

      .hero-card span {
        color: var(--ion-color-medium);
        font-size: 0.74rem;
      }

      .row-head {
        align-items: center;
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }

      .loading-panel {
        align-items: center;
        display: flex;
        gap: 10px;
      }

      @media (min-width: 768px) {
        .hero-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
    `]
})
export class MyCarePlanPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  errorMessage: string | null = null;
  activeView: 'instructions' | 'medications' | 'treatments' = 'instructions';
  specialtyCatalog: SpecialtyCatalogItem[] = [];
  selectedSpecialtyKey = '';
  specialtyOverview: PatientSpecialtyOverview | null = null;
  specialtyHistory: PatientSpecialtyHistory | null = null;

  instructions: CareInstruction[] = [];
  medications: string[] = [];
  treatmentItems: CareInstruction[] = [];
  nextControlDate: string | null = null;

  ngOnInit(): void {
    this.loadSpecialtyCatalog();
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.selectedSpecialtyKey = this.normalizeSpecialtyKey(params.get('specialty_key')) || '';
        this.loadCarePlan();
      });
  }

  onViewChange(event: CustomEvent): void {
    const candidate = String(event.detail.value ?? '').trim().toLowerCase();
    if (candidate === 'instructions' || candidate === 'medications' || candidate === 'treatments') {
      this.activeView = candidate;
    }
  }

  onSpecialtyChange(event: CustomEvent<{ value: string }>): void {
    const nextKey = this.normalizeSpecialtyKey(event.detail?.value || '');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { specialty_key: nextKey || null },
      queryParamsHandling: 'merge'
    });
  }

  get specialtyCareTeam(): Array<{ name: string; touchpoints: number }> {
    const counters = new Map<string, number>();
    const register = (name?: string | null) => {
      const cleanName = String(name || '').trim();
      if (!cleanName) {
        return;
      }
      counters.set(cleanName, (counters.get(cleanName) ?? 0) + 1);
    };

    this.specialtyHistory?.medical_records?.forEach((record) => register(record.professional_name));
    this.specialtyHistory?.specialty_encounters?.forEach((encounter) => register(encounter.professional_name));
    this.specialtyHistory?.appointments?.forEach((appointment) => register(appointment.professional_name));

    return [...counters.entries()]
      .map(([name, touchpoints]) => ({ name, touchpoints }))
      .sort((left, right) => right.touchpoints - left.touchpoints || left.name.localeCompare(right.name));
  }

  private loadCarePlan(): void {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      records: this.patientApi.getMyMedicalRecords().pipe(catchError(() => of([] as PatientMedicalRecord[]))),
      appointments: this.patientApi.getMyAppointments().pipe(catchError(() => of([] as PatientAppointment[]))),
      specialtyOverview: this.selectedSpecialtyKey
        ? this.patientApi.getMySpecialtyOverview(this.selectedSpecialtyKey).pipe(
            catchError(() => of(null as PatientSpecialtyOverview | null))
          )
        : of(null as PatientSpecialtyOverview | null),
      specialtyHistory: this.selectedSpecialtyKey
        ? this.patientApi.getMySpecialtyHistory(this.selectedSpecialtyKey).pipe(
            catchError(() => of(null as PatientSpecialtyHistory | null))
          )
        : of(null as PatientSpecialtyHistory | null),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ records, appointments, specialtyOverview, specialtyHistory }) => {
          const sortedRecords = [...records].sort(
            (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
          );
          const scopedRecords = this.filterRecordsBySelectedSpecialty(sortedRecords);
          const recordsSource =
            this.selectedSpecialtyKey
              ? scopedRecords
              : sortedRecords;

          this.specialtyOverview = specialtyOverview;
          this.specialtyHistory = specialtyHistory;

          this.instructions = this.extractInstructions(recordsSource);
          this.medications = this.extractMedications(recordsSource);
          this.treatmentItems = this.extractTreatments(recordsSource);
          this.nextControlDate = this.extractNextControlDate(
            appointments,
            specialtyOverview,
          );
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private extractInstructions(records: PatientMedicalRecord[]): CareInstruction[] {
    return records
      .filter((record) => this.hasText(record.notes) || this.hasText(record.diagnosis))
      .slice(0, 8)
      .map((record) => ({
        id: `instruction-${record.id}`,
        title: record.diagnosis?.trim() || 'Indicacion clinica',
        detail: record.notes?.trim() || 'Verificar evolucion en el siguiente control.',
        date: record.record_date,
        professional: this.formatProfessional(record)
      }));
  }

  private extractTreatments(records: PatientMedicalRecord[]): CareInstruction[] {
    return records
      .filter((record) => this.hasText(record.treatment))
      .slice(0, 8)
      .map((record) => ({
        id: `treatment-${record.id}`,
        title: record.treatment?.trim() || 'Tratamiento indicado',
        detail: record.chief_complaint?.trim() || record.symptoms?.trim() || 'Seguimiento clínico programado.',
        date: record.record_date,
        professional: this.formatProfessional(record)
      }));
  }

  private extractMedications(records: PatientMedicalRecord[]): string[] {
    const medications = new Set<string>();
    for (const record of records) {
      const raw = record.prescriptions;
      if (!this.hasText(raw)) {
        continue;
      }
      raw
        ?.split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .forEach((item) => medications.add(item));
    }
    return [...medications].slice(0, 20);
  }

  private extractNextControlDate(
    appointments: PatientAppointment[],
    specialtyOverview?: PatientSpecialtyOverview | null
  ): string | null {
    if (specialtyOverview?.upcoming_appointments?.length) {
      const nextSpecialtyAppointment = [...specialtyOverview.upcoming_appointments]
        .map((appointment) => ({
          date: appointment.appointment_date,
          ts: new Date(appointment.appointment_date).getTime()
        }))
        .filter((item) => Number.isFinite(item.ts))
        .sort((a, b) => a.ts - b.ts)[0];

      if (nextSpecialtyAppointment?.date) {
        return nextSpecialtyAppointment.date;
      }
    }

    const now = Date.now();
    const next = appointments
      .filter((appointment) => ['scheduled', 'confirmed', 'pending'].includes(appointment.status))
      .map((appointment) => ({
        date: appointment.appointment_date,
        ts: new Date(appointment.appointment_date).getTime()
      }))
      .filter((item) => Number.isFinite(item.ts) && item.ts >= now)
      .sort((a, b) => a.ts - b.ts)[0];

    return next?.date ?? null;
  }

  private formatProfessional(record: PatientMedicalRecord): string {
    const first = record.professional?.first_name?.trim() ?? '';
    const last = record.professional?.last_name?.trim() ?? '';
    const fullName = `${first} ${last}`.trim();
    return fullName || 'Profesional tratante';
  }

  private filterRecordsBySelectedSpecialty(records: PatientMedicalRecord[]): PatientMedicalRecord[] {
    if (!this.selectedSpecialtyKey) {
      return records;
    }

    return records.filter((record) =>
      this.matchesSelectedSpecialty(record.professional?.specialty)
    );
  }

  private matchesSelectedSpecialty(specialty?: string | null): boolean {
    if (!this.selectedSpecialtyKey) {
      return true;
    }

    const normalizedSpecialty = this.normalizeText(specialty || '');
    if (!normalizedSpecialty) {
      return false;
    }

    const selectedLabel = this.specialtyCatalog.find(
      (item) => item.key === this.selectedSpecialtyKey
    )?.label;
    const candidates = [
      this.normalizeText(this.selectedSpecialtyKey.replace(/-/g, ' ')),
      this.normalizeText(selectedLabel || '')
    ].filter(Boolean);

    return candidates.some((candidate) =>
      normalizedSpecialty.includes(candidate) || candidate.includes(normalizedSpecialty)
    );
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

  private normalizeSpecialtyKey(rawValue: string): string | null {
    const normalized = String(rawValue || '').trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private hasText(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return 'No se pudo cargar el plan de cuidado.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
