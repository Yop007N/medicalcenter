import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonBadge,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  addOutline,
  calendarOutline,
  timeOutline,
  personOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppState } from '../../../store';
import * as AppointmentsActions from '../../../store/appointments/appointments.actions';
import { selectAllAppointments, selectAppointmentsLoading, selectAppointmentsError } from '../../../store/appointments/appointments.selectors';
import { Appointment } from '../../../models/appointment.model';

type ViewMode = 'month' | 'week';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
  previewAppointments: Appointment[];
  extraAppointmentsCount: number;
}

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonBadge,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonChip
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/appointments"></ion-back-button>
        </ion-buttons>
        <ion-title>Calendario de Citas</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="viewMode" (ionChange)="onViewModeChange()">
          <ion-segment-button value="month">
            <ion-label>Mes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="week">
            <ion-label>Semana</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Navigation Header -->
      <div class="calendar-nav">
        <ion-button fill="clear" aria-label="Periodo anterior" (click)="navigatePrevious()">
          <ion-icon name="chevron-back-outline"></ion-icon>
        </ion-button>
        <h2>{{ currentPeriodLabel }}</h2>
        <ion-button fill="clear" aria-label="Periodo siguiente" (click)="navigateNext()">
          <ion-icon name="chevron-forward-outline"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" (click)="goToToday()">Hoy</ion-button>
      </div>

      @if (loading$ | async) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
        </div>
      } @else if (error$ | async; as error) {
        <div class="error-state" role="alert" aria-live="assertive">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <h3>Error al cargar citas</h3>
          <p>{{ error }}</p>
          <ion-button fill="outline" (click)="loadAppointments()">Reintentar</ion-button>
        </div>
      } @else if (!hasAppointments) {
        <div class="empty-state">
          <ion-icon name="calendar-outline"></ion-icon>
          <h3>No hay citas registradas</h3>
          <p>Crea la primera cita para comenzar a usar el calendario.</p>
          <ion-button (click)="createAppointment()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Nueva Cita
          </ion-button>
        </div>
      } @else {
        <!-- Calendar Grid -->
        <div class="calendar-container">
          <!-- Weekday Headers -->
          <div class="weekday-headers">
            @for (day of weekdays; track day) {
              <div class="weekday-header">{{ day }}</div>
            }
          </div>

          <!-- Calendar Days -->
          <div class="calendar-grid" [class.week-view]="viewMode === 'week'">
            @for (day of calendarDays; track day.date.getTime()) {
              <div
                class="calendar-day"
                [class.other-month]="!day.isCurrentMonth"
                [class.today]="day.isToday"
                [class.has-appointments]="day.appointments.length > 0"
                (click)="selectDay(day)"
              >
                <span class="day-number">{{ day.date.getDate() }}</span>
                @if (day.appointments.length > 0) {
                  <div class="appointment-indicators">
                    @for (apt of day.previewAppointments; track apt.id) {
                      <div
                        class="appointment-dot"
                        [class.confirmed]="apt.status === 'confirmed'"
                        [class.pending]="apt.status === 'pending'"
                        [class.cancelled]="apt.status === 'cancelled'"
                      ></div>
                    }
                    @if (day.extraAppointmentsCount > 0) {
                      <span class="more-count">+{{ day.extraAppointmentsCount }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Selected Day Details -->
        @if (selectedDay) {
          <ion-card class="day-details">
            <ion-card-header>
              <ion-card-title>
                {{ format(selectedDay.date, "EEEE, d 'de' MMMM", { locale: esLocale }) }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (selectedDay.appointments.length === 0) {
                <p class="no-appointments">No hay citas para este día</p>
                <ion-button expand="block" fill="outline" (click)="createAppointment(selectedDay.date)">
                  <ion-icon name="add-outline" slot="start"></ion-icon>
                  Crear Cita
                </ion-button>
              } @else {
                <ion-list>
                  @for (apt of selectedDay.appointments; track apt.id) {
                    <ion-item button (click)="viewAppointment(apt.id)">
                      <ion-icon name="time-outline" slot="start"></ion-icon>
                      <ion-label>
                        <h3>{{ getAppointmentTime(apt.appointment_date) }} ({{ apt.duration_minutes }} min)</h3>
                        <p>
                          <ion-icon name="person-outline" size="small"></ion-icon>
                          {{ apt.patient ? apt.patient.first_name + ' ' + apt.patient.last_name : 'Paciente #' + apt.patient_id }}
                        </p>
                        <p>{{ apt.reason || apt.appointment_type || 'Sin motivo especificado' }}</p>
                      </ion-label>
                      <ion-badge slot="end" [color]="getStatusColor(apt.status)">
                        {{ getStatusLabel(apt.status) }}
                      </ion-badge>
                    </ion-item>
                  }
                </ion-list>
              }
            </ion-card-content>
          </ion-card>
        }

        <!-- Legend -->
        <div class="legend">
          <ion-chip color="success">
            <ion-label>Confirmada</ion-label>
          </ion-chip>
          <ion-chip color="warning">
            <ion-label>Pendiente</ion-label>
          </ion-chip>
          <ion-chip color="danger">
            <ion-label>Cancelada</ion-label>
          </ion-chip>
        </div>
      }

      <!-- FAB para crear (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button aria-label="Crear nueva cita" (click)="createAppointment()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button (click)="createAppointment()" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Nueva Cita
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .calendar-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      background: var(--medical-bg-card);
      border-bottom: 1px solid var(--medical-border-light);

      h2 {
        margin: 0 16px;
        font-size: 18px;
        font-weight: 600;
        text-transform: capitalize;
        min-width: 180px;
        text-align: center;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }

    .error-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 56px 24px;
      gap: 12px;

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-primary);
      }

      h3 {
        margin: 0;
      }

      p {
        margin: 0;
        color: var(--ion-color-medium);
        max-width: 280px;
      }
    }

    .error-state {
      ion-icon {
        color: var(--ion-color-danger);
      }
    }

    .calendar-container {
      padding: 8px;
    }

    .weekday-headers {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 8px;

      .weekday-header {
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--ion-color-medium);
        padding: 8px 0;
        text-transform: uppercase;
      }
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;

      &.week-view {
        .calendar-day {
          min-height: 120px;
        }
      }
    }

    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 4px;
      border-radius: 8px;
      background: var(--medical-bg-card);
      border: 1px solid var(--medical-border-light);
      cursor: pointer;
      transition: all 0.2s;
      min-height: 50px;

      &:hover {
        background: var(--medical-bg-hover);
      }

      &.other-month {
        opacity: 0.4;
      }

      &.today {
        background: rgba(var(--ion-color-primary-rgb), 0.12);
        border-color: rgba(var(--ion-color-primary-rgb), 0.36);

        .day-number {
          color: var(--ion-color-primary);
          font-weight: bold;
        }
      }

      &.has-appointments {
        border-color: rgba(var(--ion-color-primary-rgb), 0.42);
      }

      .day-number {
        font-size: 14px;
        font-weight: 500;
      }

      .appointment-indicators {
        display: flex;
        gap: 2px;
        margin-top: 4px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .appointment-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.confirmed { background: var(--ion-color-success); }
        &.pending { background: var(--ion-color-warning); }
        &.cancelled { background: var(--ion-color-danger); }
      }

      .more-count {
        font-size: 10px;
        color: var(--ion-color-medium);
      }
    }

    .day-details {
      margin: 16px;

      .no-appointments {
        text-align: center;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      ion-item {
        --padding-start: 0;

        h3 {
          font-weight: 600;
        }

        p {
          display: flex;
          align-items: center;
          gap: 4px;

          ion-icon {
            font-size: 14px;
          }
        }
      }
    }

    .legend {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      flex-wrap: wrap;

      ion-chip {
        --background: var(--medical-bg-card);
      }

      ion-chip[color="success"] {
        --color: var(--ion-color-success);
        border: 1px solid rgba(var(--ion-color-success-rgb), 0.32);
      }

      ion-chip[color="warning"] {
        --color: var(--ion-color-warning);
        border: 1px solid rgba(var(--ion-color-warning-rgb), 0.32);
      }

      ion-chip[color="danger"] {
        --color: var(--ion-color-danger);
        border: 1px solid rgba(var(--ion-color-danger-rgb), 0.32);
      }
    }

    /* FAB */
    ion-fab-button {
      --background: var(--ion-color-primary);
      --box-shadow: var(--medical-shadow-lg);
    }

    /* Desktop create button */
    .desktop-create-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;

      ion-button {
        --border-radius: 25px;
        --box-shadow: var(--medical-shadow-lg);
        height: 48px;
        font-weight: 600;
      }
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: block;
    }

    @media (min-width: 768px) {
      .hide-mobile {
        display: block;
      }

      .hide-desktop {
        display: none;
      }
    }
  `]
})
export class AppointmentsCalendarPage implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  viewMode: ViewMode = 'month';
  currentDate = new Date();
  currentPeriodLabel = '';
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  esLocale = es;
  format = format;
  hasAppointments = false;

  readonly appointments$ = this.store.select(selectAllAppointments);
  readonly loading$ = this.store.select(selectAppointmentsLoading);
  readonly error$ = this.store.select(selectAppointmentsError);

  private appointments: Appointment[] = [];
  private appointmentsByDate = new Map<string, Appointment[]>();

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      addOutline,
      calendarOutline,
      timeOutline,
      personOutline,
      alertCircleOutline
    });
  }

  ngOnInit(): void {
    this.updateCurrentPeriodLabel();
    this.loadAppointments();

    this.appointments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((appointments) => {
        this.appointments = appointments ?? [];
        this.hasAppointments = this.appointments.length > 0;
        this.rebuildAppointmentsIndex();
        this.generateCalendar();
        this.cdr.markForCheck();
      });
  }

  loadAppointments(): void {
    this.store.dispatch(AppointmentsActions.loadAppointments());
  }

  generateCalendar(): void {
    if (this.viewMode === 'month') {
      this.generateMonthView();
    } else {
      this.generateWeekView();
    }
    this.syncSelectedDay();
  }

  private generateMonthView(): void {
    const monthStart = startOfMonth(this.currentDate);
    const monthEnd = endOfMonth(this.currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    this.calendarDays = days.map((date) => this.createCalendarDay(date, isSameMonth(date, this.currentDate)));
  }

  private generateWeekView(): void {
    const weekStart = startOfWeek(this.currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(this.currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    this.calendarDays = days.map((date) => this.createCalendarDay(date, true));
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const appointments = this.getAppointmentsForDay(date);
    const previewAppointments = appointments.slice(0, 3);

    return {
      date,
      isCurrentMonth,
      isToday: isToday(date),
      appointments,
      previewAppointments,
      extraAppointmentsCount: Math.max(appointments.length - previewAppointments.length, 0)
    };
  }

  private rebuildAppointmentsIndex(): void {
    const byDate = new Map<string, Appointment[]>();

    for (const appointment of this.appointments) {
      const dateKey = appointment.appointment_date?.split('T')[0];
      if (!dateKey) {
        continue;
      }

      const appointmentsInDay = byDate.get(dateKey);
      if (appointmentsInDay) {
        appointmentsInDay.push(appointment);
      } else {
        byDate.set(dateKey, [appointment]);
      }
    }

    this.appointmentsByDate = byDate;
  }

  private getAppointmentsForDay(date: Date): Appointment[] {
    const dateKey = format(date, 'yyyy-MM-dd');
    return this.appointmentsByDate.get(dateKey) ?? [];
  }

  private updateCurrentPeriodLabel(): void {
    if (this.viewMode === 'month') {
      this.currentPeriodLabel = format(this.currentDate, 'MMMM yyyy', { locale: es });
      return;
    }

    const start = startOfWeek(this.currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(this.currentDate, { weekStartsOn: 0 });
    this.currentPeriodLabel = `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`;
  }

  private syncSelectedDay(): void {
    if (!this.selectedDay) {
      return;
    }

    this.selectedDay = this.calendarDays.find((day) => isSameDay(day.date, this.selectedDay!.date)) ?? null;
  }

  getAppointmentTime(appointmentDate: string): string {
    try {
      const date = new Date(appointmentDate);
      return format(date, 'HH:mm');
    } catch {
      return appointmentDate;
    }
  }

  onViewModeChange(): void {
    this.selectedDay = null;
    this.updateCurrentPeriodLabel();
    this.generateCalendar();
  }

  navigatePrevious(): void {
    if (this.viewMode === 'month') {
      this.currentDate = subMonths(this.currentDate, 1);
    } else {
      this.currentDate = subWeeks(this.currentDate, 1);
    }

    this.selectedDay = null;
    this.updateCurrentPeriodLabel();
    this.generateCalendar();
  }

  navigateNext(): void {
    if (this.viewMode === 'month') {
      this.currentDate = addMonths(this.currentDate, 1);
    } else {
      this.currentDate = addWeeks(this.currentDate, 1);
    }

    this.selectedDay = null;
    this.updateCurrentPeriodLabel();
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDay = null;
    this.updateCurrentPeriodLabel();
    this.generateCalendar();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  viewAppointment(id: number): void {
    this.router.navigate(['/appointments', id]);
  }

  createAppointment(date?: Date): void {
    if (date) {
      this.router.navigate(['/appointments/new'], {
        queryParams: { date: format(date, 'yyyy-MM-dd') }
      });
      return;
    }

    this.router.navigate(['/appointments/new']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'completed': return 'primary';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  }
}
