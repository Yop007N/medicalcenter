import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonTextarea,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, ellipsisVerticalOutline } from 'ionicons/icons';
import {
  Anamnesis,
  CONSULTATION_REASONS,
  CURRENT_ILLNESSES,
  MEDICAL_ALERTS,
  MEDICATIONS_LIST,
  HABITS_LIST
} from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';

@Component({
  selector: 'app-anamnesis-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonTextarea,
    IonSpinner
  ],
  template: `
    <div class="anamnesis-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Ficha Anamnesis</h2>
        <ion-button color="success" (click)="save()">
          <ion-icon slot="start" name="save-outline"></ion-icon>
          Guardar
        </ion-button>
      </div>

      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando ficha...</p>
        </div>
      } @else {
        <div class="anamnesis-grid">
          <!-- Left Column -->
          <div class="column">
            <!-- Motivo de consulta -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  Motivo de consulta
                  <ion-button aria-label="Más opciones" fill="clear" size="small">
                    <ion-icon slot="icon-only" name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @for (reason of consultationReasons; track reason.value) {
                  <ion-item lines="none">
                    <ion-checkbox
                      [checked]="isSelected('consultation_reason', reason.value)"
                      (ionChange)="toggleSelection('consultation_reason', reason.value)">
                    </ion-checkbox>
                    <ion-label>{{ reason.label }}</ion-label>
                  </ion-item>
                }
                <ion-textarea
                  [(ngModel)]="anamnesis.consultation_reason_other"
                  placeholder="Otros motivos..."
                  rows="2">
                </ion-textarea>
              </ion-card-content>
            </ion-card>

            <!-- Enfermedad actual -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  Enfermedad actual
                  <ion-button aria-label="Más opciones" fill="clear" size="small">
                    <ion-icon slot="icon-only" name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @for (illness of currentIllnesses; track illness.value) {
                  <ion-item lines="none">
                    <ion-checkbox
                      [checked]="isSelected('current_illness', illness.value)"
                      (ionChange)="toggleSelection('current_illness', illness.value)">
                    </ion-checkbox>
                    <ion-label>{{ illness.label }}</ion-label>
                  </ion-item>
                }
                <ion-textarea
                  [(ngModel)]="anamnesis.current_illness_other"
                  placeholder="Otras enfermedades..."
                  rows="2">
                </ion-textarea>
              </ion-card-content>
            </ion-card>

            <!-- Alertas médicas -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  Alertas médicas
                  <ion-button aria-label="Más opciones" fill="clear" size="small">
                    <ion-icon slot="icon-only" name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @for (alert of medicalAlerts; track alert.value) {
                  <ion-item lines="none">
                    <ion-checkbox
                      [checked]="isSelected('medical_alerts', alert.value)"
                      (ionChange)="toggleSelection('medical_alerts', alert.value)">
                    </ion-checkbox>
                    <ion-label>{{ alert.label }}</ion-label>
                  </ion-item>
                }
                <ion-textarea
                  [(ngModel)]="anamnesis.medical_alerts_other"
                  placeholder="Otras alertas..."
                  rows="2">
                </ion-textarea>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Right Column -->
          <div class="column">
            <!-- Medicamentos -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  Medicamentos
                  <ion-button aria-label="Más opciones" fill="clear" size="small">
                    <ion-icon slot="icon-only" name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @for (med of medicationsList; track med.value) {
                  <ion-item lines="none">
                    <ion-checkbox
                      [checked]="isSelected('medications', med.value)"
                      (ionChange)="toggleSelection('medications', med.value)">
                    </ion-checkbox>
                    <ion-label>{{ med.label }}</ion-label>
                  </ion-item>
                }
                <h4>Otros medicamentos</h4>
                <ion-textarea
                  [(ngModel)]="anamnesis.medications_other"
                  placeholder="Especificar otros medicamentos..."
                  rows="3">
                </ion-textarea>
              </ion-card-content>
            </ion-card>

            <!-- Hábitos -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  Hábitos
                  <ion-button aria-label="Más opciones" fill="clear" size="small">
                    <ion-icon slot="icon-only" name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @for (habit of habitsList; track habit.value) {
                  <ion-item lines="none">
                    <ion-checkbox
                      [checked]="isSelected('habits', habit.value)"
                      (ionChange)="toggleSelection('habits', habit.value)">
                    </ion-checkbox>
                    <ion-label>{{ habit.label }}</ion-label>
                  </ion-item>
                }
                <ion-textarea
                  [(ngModel)]="anamnesis.habits_other"
                  placeholder="Otros hábitos..."
                  rows="2">
                </ion-textarea>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .anamnesis-container {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 300;
      margin: 0;
    }

    .anamnesis-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    ion-card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    ion-checkbox {
      margin-right: 12px;
    }

    ion-textarea {
      --background: var(--ion-color-light);
      --padding-start: 12px;
      --padding-end: 12px;
      --border-radius: 8px;
      margin-top: 12px;
    }

    h4 {
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-color-medium);
      margin: 16px 0 8px 0;
    }

    @media (min-width: 768px) {
      .anamnesis-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AnamnesisTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private toastController = inject(ToastController);

  loading = false;
  saving = false;
  anamnesis: Partial<Anamnesis> = this.createEmptyAnamnesis();

  consultationReasons = CONSULTATION_REASONS;
  currentIllnesses = CURRENT_ILLNESSES;
  medicalAlerts = MEDICAL_ALERTS;
  medicationsList = MEDICATIONS_LIST;
  habitsList = HABITS_LIST;

  constructor() {
    addIcons({ saveOutline, ellipsisVerticalOutline });
  }

  ngOnInit(): void {
    this.loadAnamnesis();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadAnamnesis();
    }
  }

  loadAnamnesis(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.clinicalHistoryService.getAnamnesis(this.patientId).subscribe({
      next: (anamnesis) => {
        if (anamnesis) {
          this.anamnesis = this.toUiAnamnesis(anamnesis as unknown as Record<string, unknown>);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading anamnesis:', error);
        this.loading = false;
        this.anamnesis = this.createEmptyAnamnesis();
      }
    });
  }

  isSelected(field: string, value: string): boolean {
    const arr = this.normalizeStringList((this.anamnesis as any)[field]);
    return arr.includes(value);
  }

  toggleSelection(field: string, value: string): void {
    const arr = this.normalizeStringList((this.anamnesis as any)[field]);
    const index = arr.indexOf(value);
    if (index === -1) {
      arr.push(value);
    } else {
      arr.splice(index, 1);
    }
    (this.anamnesis as any)[field] = arr;
  }

  save(): void {
    if (!this.patientId) {
      return;
    }

    this.saving = true;
    const payload = this.toApiPayload();

    this.clinicalHistoryService.saveAnamnesis(payload).subscribe({
      next: (saved) => {
        this.anamnesis = this.toUiAnamnesis(saved as unknown as Record<string, unknown>);
        this.saving = false;
        this.showToast('Anamnesis guardada exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error saving anamnesis:', error);
        this.saving = false;
        this.showToast('Error al guardar anamnesis', 'danger');
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

  private createEmptyAnamnesis(): Partial<Anamnesis> {
    return {
      patient_id: this.patientId,
      consultation_reason: [],
      consultation_reason_other: '',
      current_illness: [],
      current_illness_other: '',
      medical_alerts: [],
      medical_alerts_other: '',
      medications: [],
      medications_other: '',
      habits: [],
      habits_other: '',
      notes: ''
    };
  }

  private normalizeStringList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter((item) => !!item);
    }

    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw) {
        return [];
      }

      if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) {
        try {
          const parsed = JSON.parse(raw.replace(/'/g, '"'));
          if (Array.isArray(parsed)) {
            return this.normalizeStringList(parsed);
          }
        } catch {
          // Fallback to CSV parsing below
        }
      }

      return raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => !!item);
    }

    return [];
  }

  private parseOtherTag(list: string[]): { values: string[]; other: string } {
    let other = '';
    const values: string[] = [];

    list.forEach((item) => {
      const lower = item.toLowerCase();
      if (lower.startsWith('other:')) {
        other = item.slice(6).trim();
        return;
      }

      // Backward compatibility with legacy values like "bruxism. Otros: ATM"
      const legacyMatch = item.match(/^(.*?)(?:\.?\s*(?:otros|other)\s*:\s*)(.+)$/i);
      if (legacyMatch) {
        const mainValue = legacyMatch[1].replace(/[.,;:]$/, '').trim();
        if (mainValue) {
          values.push(mainValue);
        }
        other = legacyMatch[2].trim();
        return;
      }
      values.push(item);
    });

    return { values, other };
  }

  private toUiAnamnesis(source: Record<string, unknown>): Partial<Anamnesis> {
    const consultation = this.parseOtherTag(this.normalizeStringList(source['consultation_reason']));
    const currentIllness = this.parseOtherTag(
      this.normalizeStringList(source['current_illness'] ?? source['other_conditions'])
    );
    const alerts = this.parseOtherTag(this.normalizeStringList(source['medical_alerts']));
    const meds = this.parseOtherTag(
      this.normalizeStringList(source['medications'] ?? source['current_medications'])
    );

    const habits = this.parseOtherTag(this.normalizeStringList(source['habits']));

    const consultationOther = typeof source['consultation_reason_other'] === 'string'
      ? source['consultation_reason_other'].trim()
      : consultation.other;
    const currentIllnessOther = typeof source['current_illness_other'] === 'string'
      ? source['current_illness_other'].trim()
      : currentIllness.other;
    const alertsOther = typeof source['medical_alerts_other'] === 'string'
      ? source['medical_alerts_other'].trim()
      : (typeof source['allergies'] === 'string' ? source['allergies'].trim() : alerts.other);
    const medicationsOther = typeof source['medications_other'] === 'string'
      ? source['medications_other'].trim()
      : meds.other;
    const habitsOther = typeof source['habits_other'] === 'string'
      ? source['habits_other'].trim()
      : habits.other;

    return {
      patient_id: this.patientId,
      consultation_reason: consultation.values,
      consultation_reason_other: consultationOther,
      current_illness: currentIllness.values,
      current_illness_other: currentIllnessOther,
      medical_alerts: alerts.values,
      medical_alerts_other: alertsOther,
      medications: meds.values,
      medications_other: medicationsOther,
      habits: habits.values,
      habits_other: habitsOther,
      notes: typeof source['notes'] === 'string' ? source['notes'] : undefined
    };
  }

  private toApiPayload(): Record<string, unknown> {
    const consultationReason = this.normalizeStringList(this.anamnesis.consultation_reason);
    const currentIllness = this.normalizeStringList(this.anamnesis.current_illness);
    const medicalAlerts = this.normalizeStringList(this.anamnesis.medical_alerts);
    const medications = this.normalizeStringList(this.anamnesis.medications);
    const habits = this.normalizeStringList(this.anamnesis.habits);

    return {
      patient_id: this.patientId,
      consultation_reason: consultationReason,
      consultation_reason_other: (this.anamnesis.consultation_reason_other ?? '').trim() || undefined,
      current_illness: currentIllness,
      current_illness_other: (this.anamnesis.current_illness_other ?? '').trim() || undefined,
      medical_alerts: medicalAlerts,
      medical_alerts_other: (this.anamnesis.medical_alerts_other ?? '').trim() || undefined,
      medications,
      medications_other: (this.anamnesis.medications_other ?? '').trim() || undefined,
      habits,
      habits_other: (this.anamnesis.habits_other ?? '').trim() || undefined,
      notes: (this.anamnesis.notes ?? '').trim() || undefined
    };
  }
}
