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
  IonButton,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonNote,
  IonBadge,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  cashOutline,
  calendarOutline,
  downloadOutline,
  refreshOutline,
  statsChartOutline
} from 'ionicons/icons';
import * as ReportsActions from '../../../store/reports/reports.actions';
import {
  selectMedicalReport,
  selectFinancialReport,
  selectAppointmentsReport,
  selectQuickStats,
  selectReportsLoading,
  selectReportsExporting
} from '../../../store/reports/reports.selectors';

@Component({
  selector: 'app-reports-home',
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
    IonButton,
    IonIcon,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonList,
    IonNote,
    IonBadge,
    IonRefresher,
    IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Reportes</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedReport" (ionChange)="onReportTypeChange()">
          <ion-segment-button value="medical">
            <ion-icon name="document-text-outline"></ion-icon>
            Médico
          </ion-segment-button>
          <ion-segment-button value="financial">
            <ion-icon name="cash-outline"></ion-icon>
            Financiero
          </ion-segment-button>
          <ion-segment-button value="appointments">
            <ion-icon name="calendar-outline"></ion-icon>
            Citas
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filtros de Fecha -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Filtros</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Fecha Inicio</ion-label>
                  <ion-input type="date" [(ngModel)]="startDate"></ion-input>
                </ion-item>
              </ion-col>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Fecha Fin</ion-label>
                  <ion-input type="date" [(ngModel)]="endDate"></ion-input>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <ion-button expand="block" (click)="loadReport()">
                  <ion-icon slot="start" name="refresh-outline"></ion-icon>
                  Generar Reporte
                </ion-button>
              </ion-col>
              <ion-col>
                <ion-button expand="block" color="secondary" (click)="exportReport()" [disabled]="exporting$ | async">
                  <ion-spinner *ngIf="exporting$ | async" name="crescent"></ion-spinner>
                  <ion-icon *ngIf="(exporting$ | async) === false" slot="start" name="download-outline"></ion-icon>
                  Exportar
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Loading -->
      <div *ngIf="loading$ | async" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando reporte...</p>
      </div>

      <!-- Medical Report -->
      <ng-container *ngIf="selectedReport === 'medical' && (medicalReport$ | async) as report">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="stats-chart-outline"></ion-icon>
              Reporte Médico
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>Total de Registros</ion-label>
              <ion-badge slot="end" color="primary">{{ report.total_records }}</ion-badge>
            </ion-item>

            <h3>Por Profesional</h3>
            <ion-list>
              <ion-item *ngFor="let prof of report.by_professional; trackBy: trackByProf">
                <ion-label>{{ prof.name }}</ion-label>
                <ion-note slot="end">{{ prof.records_count }} registros</ion-note>
              </ion-item>
            </ion-list>

            <h3>Por Especialidad</h3>
            <ion-list>
              <ion-item *ngFor="let spec of report.by_specialty; trackBy: trackBySpec">
                <ion-label>{{ spec.specialty }}</ion-label>
                <ion-note slot="end">{{ spec.count }}</ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </ng-container>

      <!-- Financial Report -->
      <ng-container *ngIf="selectedReport === 'financial' && (financialReport$ | async) as report">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="cash-outline"></ion-icon>
              Reporte Financiero
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col>
                  <ion-card color="success">
                    <ion-card-content>
                      <h2>{{ report.total_revenue | currency:report.currency }}</h2>
                      <p>Total Ingresos</p>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
                <ion-col>
                  <ion-card color="warning">
                    <ion-card-content>
                      <h2>{{ report.total_pending | currency:report.currency }}</h2>
                      <p>Pendiente</p>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
              </ion-row>
            </ion-grid>

            <h3>Por Método de Pago</h3>
            <ion-list>
              <ion-item *ngFor="let method of report.by_payment_method; trackBy: trackByMethod">
                <ion-label>
                  <h2>{{ method.method | titlecase }}</h2>
                  <p>{{ method.count }} transacciones</p>
                </ion-label>
                <ion-note slot="end">{{ method.amount | currency:report.currency }}</ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </ng-container>

      <!-- Appointments Report -->
      <ng-container *ngIf="selectedReport === 'appointments' && (appointmentsReport$ | async) as report">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="calendar-outline"></ion-icon>
              Reporte de Citas
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>Total de Citas</ion-label>
              <ion-badge slot="end" color="primary">{{ report.total_appointments }}</ion-badge>
            </ion-item>
            <ion-item>
              <ion-label>Tasa de Cancelación</ion-label>
              <ion-badge slot="end" color="warning">{{ report.cancellation_rate | percent }}</ion-badge>
            </ion-item>
            <ion-item>
              <ion-label>Tasa de No-Show</ion-label>
              <ion-badge slot="end" color="danger">{{ report.no_show_rate | percent }}</ion-badge>
            </ion-item>

            <h3>Por Estado</h3>
            <ion-list>
              <ion-item *ngFor="let status of report.by_status; trackBy: trackByStatus">
                <ion-label>{{ status.status | titlecase }}</ion-label>
                <ion-note slot="end">{{ status.count }}</ion-note>
              </ion-item>
            </ion-list>

            <h3>Por Profesional</h3>
            <ion-list>
              <ion-item *ngFor="let prof of report.by_professional; trackBy: trackByProf">
                <ion-label>{{ prof.name }}</ion-label>
                <ion-note slot="end">{{ prof.appointments_count }} citas</ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </ng-container>
    </ion-content>
  `
})
export class ReportsHomePage implements OnInit {
  private store = inject(Store);

  medicalReport$ = this.store.select(selectMedicalReport);
  financialReport$ = this.store.select(selectFinancialReport);
  appointmentsReport$ = this.store.select(selectAppointmentsReport);
  quickStats$ = this.store.select(selectQuickStats);
  loading$ = this.store.select(selectReportsLoading);
  exporting$ = this.store.select(selectReportsExporting);

  selectedReport = 'medical';
  startDate = '';
  endDate = '';

  constructor() {
    addIcons({
      documentTextOutline,
      cashOutline,
      calendarOutline,
      downloadOutline,
      refreshOutline,
      statsChartOutline
    });

    // Default dates: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadReport();
    this.store.dispatch(ReportsActions.loadQuickStats());
  }

  onReportTypeChange() {
    this.loadReport();
  }

  loadReport() {
    const filter = {
      start_date: this.startDate,
      end_date: this.endDate
    };

    switch (this.selectedReport) {
      case 'medical':
        this.store.dispatch(ReportsActions.loadMedicalReport({ filter }));
        break;
      case 'financial':
        this.store.dispatch(ReportsActions.loadFinancialReport({ filter }));
        break;
      case 'appointments':
        this.store.dispatch(ReportsActions.loadAppointmentsReport({ filter }));
        break;
    }
  }

  exportReport() {
    const filter = {
      start_date: this.startDate,
      end_date: this.endDate
    };

    this.store.dispatch(ReportsActions.exportReport({
      reportType: this.selectedReport,
      format: 'pdf',
      filter
    }));
  }

  onRefresh(event: any) {
    this.loadReport();
    setTimeout(() => event.target.complete(), 1000);
  }

  trackByProf(index: number, prof: any): number {
    return prof.professional_id || index;
  }

  trackBySpec(index: number, spec: any): string {
    return spec.specialty || index.toString();
  }

  trackByMethod(index: number, method: any): string {
    return method.method || index.toString();
  }

  trackByStatus(index: number, status: any): string {
    return status.status || index.toString();
  }
}
