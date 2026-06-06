import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  documentTextOutline,
  medicalOutline,
  pulseOutline,
  syncOutline,
  walletOutline
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { PatientApiService } from '../../core/services/patient-api.service';
import { PatientAppointment } from '../../core/models/appointment.model';
import { PatientBudget } from '../../core/models/budget.model';
import { PatientMedicalRecord } from '../../core/models/patient.model';
import { SyncService, SyncStatus } from '../../core/services/sync.service';
import { OfflineService } from '../../core/services/offline.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú principal"></ion-menu-button>
        </ion-buttons>
        <ion-title>Mi panel</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel hero-panel">
        <div class="hero-row">
          <div>
            <h2 class="panel-title">Hola {{ fullName }}</h2>
            <p class="panel-text">Resumen de tu estado clinico y administrativo.</p>
          </div>
          <ion-badge [color]="isOnline ? 'success' : 'medium'">
            {{ isOnline ? 'Online' : 'Offline' }}
          </ion-badge>
        </div>

        <div class="hero-stats">
          <article class="hero-stat">
            <span class="hero-stat__value">{{ upcomingAppointmentsCount }}</span>
            <span class="hero-stat__label">Proximos turnos</span>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__value">{{ pendingBudgetsCount }}</span>
            <span class="hero-stat__label">Presupuestos pendientes</span>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__value">{{ syncStatus?.pending ?? 0 }}</span>
            <span class="hero-stat__label">Sync pendientes</span>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__value">{{ completedAppointmentsCount }}</span>
            <span class="hero-stat__label">Turnos completados</span>
          </article>
        </div>
      </section>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      <section class="panel">
        <div class="section-head">
          <h3 class="panel-title">Conectividad y sincronizacion</h3>
          <ion-chip [color]="isOnline ? 'success' : 'warning'">
            {{ isOnline ? 'Red estable' : 'Modo offline' }}
          </ion-chip>
        </div>

        <p class="panel-text">Sincronizaciones completadas: <strong>{{ syncStatus?.completed ?? 0 }}</strong></p>
        <p class="panel-text">Sincronizaciones pendientes: <strong>{{ syncStatus?.pending ?? 0 }}</strong></p>

        <div class="item-actions">
          <ion-button size="small" fill="outline" (click)="triggerSync()" [disabled]="!isOnline">
            <ion-icon slot="start" name="sync-outline"></ion-icon>
            Sincronizar ahora
          </ion-button>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h3 class="panel-title">Proximo turno</h3>
          <ion-button size="small" fill="clear" routerLink="/my-appointments">Ver todos</ion-button>
        </div>

        @if (nextAppointment) {
          <div class="next-appointment">
            <div class="next-appointment__line">
              <ion-icon name="calendar-outline"></ion-icon>
              <span>{{ nextAppointment.appointment_date | date:'fullDate' }}</span>
            </div>
            <div class="next-appointment__line">
              <ion-icon name="pulse-outline"></ion-icon>
              <span>{{ nextAppointment.appointment_type || 'Consulta general' }}</span>
            </div>
            <div class="next-appointment__line">
              <ion-icon name="document-text-outline"></ion-icon>
              <span>
                Profesional: {{ nextAppointment.professional?.first_name }} {{ nextAppointment.professional?.last_name }}
              </span>
            </div>
            <span class="status-chip" [class]="'status-' + nextAppointment.status">
              {{ toStatusLabel(nextAppointment.status) }}
            </span>
          </div>
        } @else {
          <p class="panel-text">No tienes turnos futuros confirmados.</p>
        }
      </section>

      <section class="panel">
        <h3 class="panel-title">Accesos rapidos</h3>
        <div class="quick-actions">
          <a class="quick-action" routerLink="/my-appointments">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Mis turnos</span>
          </a>
          <a class="quick-action" routerLink="/my-care-plan">
            <ion-icon name="medical-outline"></ion-icon>
            <span>Plan de cuidado</span>
          </a>
          <a class="quick-action" routerLink="/my-budgets">
            <ion-icon name="wallet-outline"></ion-icon>
            <span>Presupuestos</span>
          </a>
          <a class="quick-action" routerLink="/my-history">
            <ion-icon name="document-text-outline"></ion-icon>
            <span>Historia clinica</span>
          </a>
          <a class="quick-action" routerLink="/my-profile">
            <ion-icon name="pulse-outline"></ion-icon>
            <span>Mi perfil</span>
          </a>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h3 class="panel-title">Indicaciones recientes</h3>
          <ion-button size="small" fill="clear" routerLink="/my-care-plan">Ver plan</ion-button>
        </div>
        @if (careHints.length === 0) {
          <p class="panel-text">No hay indicaciones recientes registradas.</p>
        } @else {
          <ul class="hint-list">
            @for (hint of careHints; track hint.id) {
              <li>
                <strong>{{ hint.title }}</strong>
                <span>{{ hint.subtitle }}</span>
              </li>
            }
          </ul>
        }
      </section>
    </ion-content>
  `,
  styleUrls: ['../../shared/styles/page-shell.styles.scss'],
  styles: [`
      .hero-panel {
        background: linear-gradient(145deg, rgba(var(--ion-color-primary-rgb), 0.12) 0%, rgba(var(--ion-color-primary-rgb), 0.06) 100%);
      }

      .hero-row {
        align-items: center;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
      }

      .hero-stats {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .hero-stat {
        background: var(--patient-surface);
        border: 1px solid var(--patient-border);
        border-radius: 11px;
        display: grid;
        gap: 2px;
        min-height: 74px;
        padding: 10px;
      }

      .hero-stat__value {
        color: var(--ion-color-dark);
        font-size: 1.2rem;
        font-weight: 700;
      }

      .hero-stat__label {
        color: var(--ion-color-medium);
        font-size: 0.74rem;
      }

      .section-head {
        align-items: center;
        display: flex;
        gap: 8px;
        justify-content: space-between;
        margin-bottom: 2px;
      }

      .next-appointment {
        display: grid;
        gap: 8px;
      }

      .next-appointment__line {
        align-items: center;
        color: var(--ion-color-dark);
        display: flex;
        font-size: 0.84rem;
        gap: 8px;
      }

      .next-appointment__line ion-icon {
        color: var(--ion-color-primary);
        font-size: 16px;
      }

      .quick-actions {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 8px;
      }

      .quick-action {
        align-items: center;
        background: var(--patient-surface-soft);
        border: 1px solid var(--patient-border);
        border-radius: 12px;
        color: var(--ion-color-dark);
        display: flex;
        flex-direction: column;
        font-size: 0.78rem;
        font-weight: 600;
        gap: 8px;
        min-height: 88px;
        justify-content: center;
        padding: 10px;
        text-align: center;
        text-decoration: none;
      }

      .quick-action ion-icon {
        color: var(--ion-color-primary);
        font-size: 20px;
      }

      .hint-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 8px 0 0;
        padding: 0;
      }

      .hint-list li {
        background: var(--patient-surface-soft);
        border: 1px solid var(--patient-border);
        border-radius: 10px;
        display: grid;
        gap: 3px;
        padding: 10px;
      }

      .hint-list strong {
        color: var(--ion-color-dark);
        font-size: 0.82rem;
      }

      .hint-list span {
        color: var(--ion-color-medium);
        font-size: 0.76rem;
      }

      @media (min-width: 768px) {
        .hero-stats {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .quick-actions {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
      }
    `]
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly patientApi = inject(PatientApiService);
  private readonly syncService = inject(SyncService);
  private readonly offlineService = inject(OfflineService);

  fullName = 'Paciente';
  isOnline = true;
  errorMessage: string | null = null;

  syncStatus: SyncStatus | null = null;
  nextAppointment: PatientAppointment | null = null;
  careHints: Array<{ id: string; title: string; subtitle: string }> = [];
  pendingBudgetsCount = 0;
  upcomingAppointmentsCount = 0;
  completedAppointmentsCount = 0;

  constructor() {
    addIcons({
      calendarOutline,
      documentTextOutline,
      medicalOutline,
      pulseOutline,
      syncOutline,
      walletOutline
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.first_name) {
        this.fullName = `${user.first_name} ${user.last_name || ''}`.trim();
      }
    });

    this.isOnline = this.offlineService.isOnline;
    this.offlineService.online$.subscribe((online) => {
      this.isOnline = online;
    });

    this.loadDashboardData();
  }

  triggerSync(): void {
    this.syncService.syncPendingChanges();
    this.syncService
      .getSyncStatus()
      .pipe(catchError(() => of(null)))
      .subscribe((status) => {
        this.syncStatus = status;
      });
  }

  toStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      scheduled: 'Programado',
      confirmed: 'Confirmado',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return map[status] || status;
  }

  private loadDashboardData(): void {
    this.errorMessage = null;

    forkJoin({
      appointments: this.patientApi.getMyAppointments().pipe(catchError(() => of([] as PatientAppointment[]))),
      budgets: this.patientApi.getMyBudgets().pipe(catchError(() => of([] as PatientBudget[]))),
      medicalRecords: this.patientApi.getMyMedicalRecords().pipe(catchError(() => of([] as PatientMedicalRecord[]))),
      syncStatus: this.syncService.getSyncStatus().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ appointments, budgets, medicalRecords, syncStatus }) => {
        const now = new Date();
        const futureAppointments = appointments
          .filter((appointment) => {
            const date = new Date(appointment.appointment_date);
            return date.getTime() >= now.getTime() && !['cancelled', 'completed'].includes(appointment.status);
          })
          .sort(
            (a, b) =>
              new Date(a.appointment_date).getTime() -
              new Date(b.appointment_date).getTime()
          );

        this.nextAppointment = futureAppointments.length > 0 ? futureAppointments[0] : null;
        this.upcomingAppointmentsCount = futureAppointments.length;
        this.completedAppointmentsCount = appointments.filter((appointment) => appointment.status === 'completed').length;
        this.pendingBudgetsCount = budgets.filter((budget) => ['draft', 'sent'].includes(budget.status)).length;
        this.careHints = this.mapCareHints(medicalRecords);
        this.syncStatus = syncStatus;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el resumen del paciente.';
      }
    });
  }

  private mapCareHints(records: PatientMedicalRecord[]): Array<{ id: string; title: string; subtitle: string }> {
    return records
      .filter((record) => this.hasText(record.diagnosis) || this.hasText(record.treatment) || this.hasText(record.notes))
      .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
      .slice(0, 3)
      .map((record) => ({
        id: `hint-${record.id}`,
        title: record.diagnosis?.trim() || record.treatment?.trim() || 'Indicacion clinica',
        subtitle: record.notes?.trim() || record.treatment?.trim() || 'Revisar plan de cuidado.'
      }));
  }

  private hasText(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
