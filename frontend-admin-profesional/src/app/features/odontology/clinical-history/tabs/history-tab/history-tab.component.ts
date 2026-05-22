import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  calendarOutline,
  timeOutline,
  checkmarkCircleOutline,
  mailOutline,
  documentOutline,
  printOutline,
  listOutline
} from 'ionicons/icons';
import { ClinicalHistoryEvent, HistoryEventType } from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';

@Component({
  selector: 'app-history-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner
  ],
  template: `
    <div class="history-container">
      <!-- Filters -->
      <div class="filters-row">
        <h2 class="section-title">Historial</h2>
        <div class="filters">
          <ion-item lines="none" class="filter-item">
            <ion-label>Filtrar por mes:</ion-label>
            <ion-select [(ngModel)]="selectedMonth" (ionChange)="filterEvents()" interface="popover">
              <ion-select-option value="all">Todos los meses</ion-select-option>
              @for (month of months; track month.value) {
                <ion-select-option [value]="month.value">{{ month.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>

          <ion-item lines="none" class="filter-item">
            <ion-label>Filtrar por:</ion-label>
            <ion-select [(ngModel)]="selectedType" (ionChange)="filterEvents()" interface="popover">
              <ion-select-option value="all">Todos</ion-select-option>
              @for (type of eventTypes; track type.value) {
                <ion-select-option [value]="type.value">{{ type.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>

          <ion-button fill="clear" (click)="print()">
            <ion-icon slot="start" name="print-outline"></ion-icon>
          </ion-button>

          <ion-item lines="none" class="filter-item">
            <ion-checkbox [(ngModel)]="showAnnulled" (ionChange)="filterEvents()"></ion-checkbox>
            <ion-label>Mostrar anuladas</ion-label>
          </ion-item>
        </div>
      </div>

      <!-- Timeline -->
      <div class="timeline">
        @if (loading) {
          <div class="ion-text-center ion-padding">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Cargando historial...</p>
          </div>
        } @else if (filteredEvents.length === 0) {
          <div class="empty-state">
            <ion-icon name="time-outline"></ion-icon>
            <p>No hay eventos en el historial</p>
          </div>
        } @else {
          @for (group of groupedEvents; track group.date) {
            <div class="timeline-group">
              <div class="timeline-date">
                <span class="date-dot"></span>
                <span class="date-text">{{ group.date }}</span>
              </div>

              @for (event of group.events; track event.id) {
                <ion-card class="event-card" [class]="getEventClass(event.event_type)">
                  <ion-card-header>
                    <div class="event-header">
                      <ion-badge [color]="getEventColor(event.event_type)">
                        {{ getEventLabel(event.event_type) }}
                      </ion-badge>
                      @if (event.event_type === 'budget_created' || event.event_type === 'evolution_added') {
                        <ion-button aria-label="Ver lista" fill="clear" size="small">
                          <ion-icon slot="icon-only" name="list-outline"></ion-icon>
                        </ion-button>
                      }
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    <div class="event-content">
                      <p class="event-title">{{ event.title }}</p>
                      @if (event.description) {
                        <p class="event-description">{{ event.description }}</p>
                      }
                      @if (event.professional) {
                        <p class="event-professional">
                          Dr.(a) {{ event.professional.first_name }} {{ event.professional.last_name }}
                          - {{ event.event_date | date:'HH:mm' }}
                        </p>
                      }
                    </div>
                  </ion-card-content>
                </ion-card>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filters-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 300;
      margin: 0;
      color: var(--ion-text-color);
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .filter-item {
      --background: var(--ion-color-light);
      --border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
      font-size: 14px;
    }

    .filter-item ion-label {
      margin-right: 8px;
    }

    /* Timeline Styles */
    .timeline {
      position: relative;
      padding-left: 24px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--ion-color-primary);
    }

    .timeline-group {
      margin-bottom: 24px;
    }

    .timeline-date {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      position: relative;
    }

    .date-dot {
      position: absolute;
      left: -20px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      border: 3px solid var(--ion-background-color);
    }

    .date-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-medium);
    }

    .event-card {
      margin: 8px 0;
      border-left: 4px solid var(--ion-color-primary);
    }

    .event-card.budget {
      border-left-color: var(--ion-color-primary);
    }

    .event-card.appointment {
      border-left-color: var(--ion-color-danger);
    }

    .event-card.treatment {
      border-left-color: var(--ion-color-success);
    }

    .event-card.document {
      border-left-color: var(--ion-color-tertiary);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .event-content {
      padding: 0;
    }

    .event-title {
      font-size: 15px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .event-description {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0 0 8px 0;
      font-style: italic;
    }

    .event-professional {
      font-size: 13px;
      color: var(--ion-color-primary);
      margin: 0;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: var(--ion-color-medium);
    }

    .empty-state ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .filters-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .filters {
        width: 100%;
        overflow-x: auto;
      }

      .filter-item {
        flex-shrink: 0;
      }
    }
  `]
})
export class HistoryTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private toastController = inject(ToastController);

  loading = false;
  events: ClinicalHistoryEvent[] = [];
  filteredEvents: ClinicalHistoryEvent[] = [];
  groupedEvents: { date: string; events: ClinicalHistoryEvent[] }[] = [];

  selectedMonth = 'all';
  selectedType = 'all';
  showAnnulled = false;

  months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  eventTypes = [
    { value: 'budget_created', label: 'Presupuesto Creado' },
    { value: 'appointment_scheduled', label: 'Cita Agendada' },
    { value: 'appointment_confirmed', label: 'Cita Confirmada' },
    { value: 'treatment_completed', label: 'Tratamiento Completado' },
    { value: 'evolution_added', label: 'Evolución Agregada' },
    { value: 'document_uploaded', label: 'Documento Subido' },
    { value: 'prescription_created', label: 'Receta Creada' },
    { value: 'consent_signed', label: 'Consentimiento Firmado' },
    { value: 'email_sent', label: 'Email Enviado' }
  ];

  constructor() {
    addIcons({
      cashOutline,
      calendarOutline,
      timeOutline,
      checkmarkCircleOutline,
      mailOutline,
      documentOutline,
      printOutline,
      listOutline
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadEvents();
    }
  }

  loadEvents(): void {
    if (!this.patientId) return;

    this.loading = true;
    const eventType = this.selectedType !== 'all' ? this.selectedType : undefined;

    this.clinicalHistoryService.getTimeline(this.patientId, eventType).subscribe({
      next: (events) => {
        this.events = events;
        this.filterEvents();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading timeline:', error);
        this.loading = false;
        this.showToast('Error al cargar historial', 'danger');
      }
    });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  filterEvents(): void {
    let filtered = [...this.events];

    // Filter by month
    if (this.selectedMonth !== 'all') {
      filtered = filtered.filter(e => {
        const month = new Date(e.event_date).getMonth() + 1;
        return month.toString().padStart(2, '0') === this.selectedMonth;
      });
    }

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(e => e.event_type === this.selectedType);
    }

    this.filteredEvents = filtered;
    this.groupEvents();
  }

  groupEvents(): void {
    const groups = new Map<string, ClinicalHistoryEvent[]>();

    this.filteredEvents.forEach(event => {
      const date = new Date(event.event_date);
      const dateKey = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    this.groupedEvents = Array.from(groups.entries())
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => new Date(b.events[0].event_date).getTime() - new Date(a.events[0].event_date).getTime());
  }

  getEventColor(type: HistoryEventType): string {
    switch (type) {
      case 'budget_created': return 'primary';
      case 'appointment_scheduled':
      case 'appointment_confirmed': return 'danger';
      case 'treatment_started':
      case 'treatment_completed': return 'success';
      case 'evolution_added': return 'tertiary';
      case 'document_uploaded': return 'warning';
      case 'prescription_created': return 'secondary';
      case 'consent_signed': return 'success';
      case 'email_sent': return 'medium';
      default: return 'medium';
    }
  }

  getEventLabel(type: HistoryEventType): string {
    const found = this.eventTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getEventClass(type: HistoryEventType): string {
    if (type.includes('budget')) return 'budget';
    if (type.includes('appointment')) return 'appointment';
    if (type.includes('treatment') || type.includes('evolution')) return 'treatment';
    return 'document';
  }

  print(): void {
    window.print();
  }
}
