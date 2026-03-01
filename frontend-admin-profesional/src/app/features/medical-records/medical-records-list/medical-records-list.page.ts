import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonChip,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, documentTextOutline, personOutline, calendarOutline } from 'ionicons/icons';
import * as MedicalRecordsActions from '../../../store/medical-records/medical-records.actions';
import {
  selectAllMedicalRecords,
  selectMedicalRecordsLoading,
  selectMedicalRecordsError
} from '../../../store/medical-records/medical-records.selectors';
import { MedicalRecord } from '../../../models/medical-record.model';

@Component({
  selector: 'app-medical-records-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonChip,
    IonFab,
    IonFabButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Historiales Médicos</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/medical-records/new" [queryParams]="scopeQueryParams">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar por paciente o diagnóstico..."
          [debounce]="300"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading$ | async) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando historiales...</p>
        </div>
      } @else if (error$ | async; as error) {
        <div class="ion-text-center ion-padding">
          <ion-text color="danger">
            <p>{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" (click)="loadRecords()">Reintentar</ion-button>
        </div>
      } @else {
        @if (filteredRecords.length === 0) {
          <div class="ion-text-center ion-padding">
            <ion-icon name="document-text-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
            <p>No hay historiales médicos</p>
            <ion-button routerLink="/medical-records/new" [queryParams]="scopeQueryParams">
              <ion-icon slot="start" name="add-outline"></ion-icon>
              Crear Historial
            </ion-button>
          </div>
        } @else {
          <ion-list>
            @for (record of filteredRecords; track record.id) {
              <ion-item [routerLink]="['/medical-records', record.id]" [queryParams]="scopeQueryParams" detail>
                <ion-icon name="document-text-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h2>
                    @if (record.patient) {
                      {{ record.patient.first_name }} {{ record.patient.last_name }}
                    } @else {
                      Paciente #{{ record.patient_id }}
                    }
                  </h2>
                  <p>
                    <ion-icon name="calendar-outline" style="font-size: 12px;"></ion-icon>
                    {{ record.record_date | date:'dd/MM/yyyy HH:mm' }}
                  </p>
                  @if (record.chief_complaint) {
                    <p><strong>Motivo:</strong> {{ record.chief_complaint }}</p>
                  }
                  @if (record.diagnosis) {
                    <ion-chip color="tertiary" style="height: 24px; font-size: 11px;">
                      {{ record.diagnosis | slice:0:30 }}{{ record.diagnosis.length > 30 ? '...' : '' }}
                    </ion-chip>
                  }
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }
      }

      <!-- FAB para crear (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button routerLink="/medical-records/new" [queryParams]="scopeQueryParams">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/medical-records/new" [queryParams]="scopeQueryParams" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Crear Historial
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-chip {
      margin-top: 4px;
    }

    /* FAB */
    ion-fab-button {
      --background: var(--medical-gradient-primary);
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
export class MedicalRecordsListPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  records$ = this.store.select(selectAllMedicalRecords);
  loading$ = this.store.select(selectMedicalRecordsLoading);
  error$ = this.store.select(selectMedicalRecordsError);

  allRecords: MedicalRecord[] = [];
  filteredRecords: MedicalRecord[] = [];
  searchTerm = '';
  currentPatientId?: number;
  currentSpecialtyKey?: string;

  constructor() {
    addIcons({ addOutline, documentTextOutline, personOutline, calendarOutline });
  }

  ngOnInit(): void {
    this.records$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(records => {
        this.allRecords = records;
        this.applyFilter();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const patientIdRaw = params.get('patient_id') ?? params.get('patientId');
        const patientId = patientIdRaw ? Number(patientIdRaw) : NaN;
        this.currentPatientId = Number.isFinite(patientId) && patientId > 0 ? patientId : undefined;
        this.currentSpecialtyKey = params.get('specialty_key') || undefined;
        this.loadRecords();
      });
  }

  loadRecords(): void {
    this.store.dispatch(MedicalRecordsActions.loadMedicalRecords({
      patientId: this.currentPatientId,
      specialtyKey: this.currentSpecialtyKey
    }));
  }

  doRefresh(event: any): void {
    this.loadRecords();
    setTimeout(() => event.target.complete(), 1000);
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredRecords = this.allRecords;
    } else {
      this.filteredRecords = this.allRecords.filter(record => {
        const patientName = record.patient
          ? `${record.patient.first_name} ${record.patient.last_name}`.toLowerCase()
          : '';
        const diagnosis = record.diagnosis?.toLowerCase() || '';
        const complaint = record.chief_complaint?.toLowerCase() || '';
        return patientName.includes(this.searchTerm) ||
               diagnosis.includes(this.searchTerm) ||
               complaint.includes(this.searchTerm);
      });
    }
  }

  get scopeQueryParams(): { patient_id?: number; specialty_key?: string } {
    return {
      patient_id: this.currentPatientId,
      specialty_key: this.currentSpecialtyKey
    };
  }
}
