import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline,
  personOutline,
  timeOutline,
  searchOutline,
  filterOutline,
  documentTextOutline
} from 'ionicons/icons';
import * as AuditActions from '../../../store/audit/audit.actions';
import {
  selectAuditLogs,
  selectTotalLogs,
  selectAuditLoading,
  selectComplianceReport
} from '../../../store/audit/audit.selectors';
import { AuditFilter } from '../../../models/report.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonChip
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <ion-icon name="shield-checkmark-outline"></ion-icon>
          Auditoría
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filtros -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="filter-outline"></ion-icon>
            Filtros
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Fecha Inicio</ion-label>
                  <ion-input type="date" [(ngModel)]="filter.start_date"></ion-input>
                </ion-item>
              </ion-col>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Fecha Fin</ion-label>
                  <ion-input type="date" [(ngModel)]="filter.end_date"></ion-input>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Tipo de Entidad</ion-label>
                  <ion-select [(ngModel)]="filter.entity_type" placeholder="Todos">
                    <ion-select-option value="">Todos</ion-select-option>
                    <ion-select-option value="patient">Paciente</ion-select-option>
                    <ion-select-option value="professional">Profesional</ion-select-option>
                    <ion-select-option value="appointment">Cita</ion-select-option>
                    <ion-select-option value="medical_record">Historial</ion-select-option>
                    <ion-select-option value="budget">Presupuesto</ion-select-option>
                    <ion-select-option value="payment">Pago</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Acción</ion-label>
                  <ion-select [(ngModel)]="filter.action" placeholder="Todas">
                    <ion-select-option value="">Todas</ion-select-option>
                    <ion-select-option value="create">Crear</ion-select-option>
                    <ion-select-option value="update">Actualizar</ion-select-option>
                    <ion-select-option value="delete">Eliminar</ion-select-option>
                    <ion-select-option value="login">Login</ion-select-option>
                    <ion-select-option value="logout">Logout</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <ion-button expand="block" (click)="loadLogs()">
                  <ion-icon slot="start" name="search-outline"></ion-icon>
                  Buscar
                </ion-button>
              </ion-col>
              <ion-col>
                <ion-button expand="block" color="secondary" (click)="loadComplianceReport()">
                  <ion-icon slot="start" name="document-text-outline"></ion-icon>
                  Reporte Cumplimiento
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Compliance Report Summary -->
      <ion-card *ngIf="complianceReport$ | async as report">
        <ion-card-header>
          <ion-card-title>Resumen de Cumplimiento</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col>
                <div class="stat-box">
                  <h3>{{ report.total_logins }}</h3>
                  <p>Total Logins</p>
                </div>
              </ion-col>
              <ion-col>
                <div class="stat-box">
                  <h3>{{ report.total_data_modifications }}</h3>
                  <p>Modificaciones</p>
                </div>
              </ion-col>
              <ion-col>
                <div class="stat-box">
                  <h3>{{ report.sensitive_data_access }}</h3>
                  <p>Accesos Sensibles</p>
                </div>
              </ion-col>
              <ion-col>
                <div class="stat-box warning">
                  <h3>{{ report.failed_login_attempts }}</h3>
                  <p>Logins Fallidos</p>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Loading -->
      <div *ngIf="loading$ | async" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando logs...</p>
      </div>

      <!-- Logs List -->
      <ion-card *ngIf="(loading$ | async) === false">
        <ion-card-header>
          <ion-card-title>
            Logs de Auditoría
            <ion-badge color="primary" *ngIf="totalLogs$ | async as total">{{ total }}</ion-badge>
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let log of logs$ | async; trackBy: trackById">
              <ion-icon slot="start" [name]="getActionIcon(log.action)" [color]="getActionColor(log.action)"></ion-icon>
              <ion-label>
                <h2>
                  <ion-chip [color]="getActionColor(log.action)" size="small">
                    {{ log.action | uppercase }}
                  </ion-chip>
                  {{ log.entity_type | titlecase }}
                  <span *ngIf="log.entity_id">#{{ log.entity_id }}</span>
                </h2>
                <p *ngIf="log.user">
                  <ion-icon name="person-outline"></ion-icon>
                  {{ log.user.first_name }} {{ log.user.last_name }} ({{ log.user.email }})
                </p>
                <p>
                  <ion-icon name="time-outline"></ion-icon>
                  {{ log.created_at | date:'medium' }}
                </p>
                <p *ngIf="log.ip_address">
                  IP: {{ log.ip_address }}
                </p>
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-infinite-scroll (ionInfinite)="loadMore($event)">
            <ion-infinite-scroll-content></ion-infinite-scroll-content>
          </ion-infinite-scroll>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .stat-box {
      text-align: center;
      padding: 1rem;
      background: var(--ion-color-light);
      border-radius: 8px;
    }
    .stat-box h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0;
      color: var(--ion-color-primary);
    }
    .stat-box p {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }
    .stat-box.warning h3 {
      color: var(--ion-color-danger);
    }
  `]
})
export class AuditLogsPage implements OnInit {
  private store = inject(Store);

  logs$ = this.store.select(selectAuditLogs);
  totalLogs$ = this.store.select(selectTotalLogs);
  loading$ = this.store.select(selectAuditLoading);
  complianceReport$ = this.store.select(selectComplianceReport);

  filter: AuditFilter = {
    page: 1,
    per_page: 20
  };

  constructor() {
    addIcons({
      shieldCheckmarkOutline,
      personOutline,
      timeOutline,
      searchOutline,
      filterOutline,
      documentTextOutline
    });

    // Default dates: last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    this.filter.end_date = today.toISOString().split('T')[0];
    this.filter.start_date = sevenDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.filter.page = 1;
    this.store.dispatch(AuditActions.loadAuditLogs({ filter: this.filter }));
  }

  loadComplianceReport() {
    if (this.filter.start_date && this.filter.end_date) {
      this.store.dispatch(AuditActions.loadComplianceReport({
        startDate: this.filter.start_date,
        endDate: this.filter.end_date
      }));
    }
  }

  loadMore(event: any) {
    this.filter.page = (this.filter.page || 1) + 1;
    this.store.dispatch(AuditActions.loadAuditLogs({ filter: this.filter }));
    setTimeout(() => event.target.complete(), 500);
  }

  onRefresh(event: any) {
    this.loadLogs();
    setTimeout(() => event.target.complete(), 1000);
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      create: 'add-circle-outline',
      update: 'create-outline',
      delete: 'trash-outline',
      login: 'log-in-outline',
      logout: 'log-out-outline'
    };
    return icons[action] || 'document-text-outline';
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      create: 'success',
      update: 'warning',
      delete: 'danger',
      login: 'primary',
      logout: 'medium'
    };
    return colors[action] || 'medium';
  }

  trackById(index: number, log: any): number {
    return log.id || index;
  }
}
