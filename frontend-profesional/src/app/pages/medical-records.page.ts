import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { MedicalRecordService } from '../core/services/medical-record.service';
import { MedicalRecord } from '../shared/models/medical-record.model';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-medical-records-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <h1>Registros Medicos</h1>
      <p>Consulta y gestion de historial clinico por paciente.</p>

      <div class="toolbar">
        <input
          #patientInput
          type="number"
          min="1"
          class="search-input"
          placeholder="Filtrar por patient_id"
          (keyup.enter)="applyPatientFilter(patientInput.value)"
        />
        <button type="button" class="refresh-button" (click)="applyPatientFilter(patientInput.value)" [disabled]="loading">
          Filtrar
        </button>
        <button type="button" class="refresh-button" (click)="loadRecords()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (!loading && records.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin registros</h2>
          <p class="card-text">No se encontraron registros medicos para el filtro aplicado.</p>
        </article>
      }

      @if (records.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Diagnostico</th>
                <th>Files</th>
              </tr>
            </thead>
            <tbody>
              @for (record of records; track record.id) {
                <tr>
                  <td>#{{ record.id }}</td>
                  <td>{{ record.record_date || record.created_at | date:'short' }}</td>
                  <td>
                    {{
                      record.patient
                        ? (record.patient.first_name + ' ' + record.patient.last_name)
                        : ('ID ' + record.patient_id)
                    }}
                  </td>
                  <td>
                    {{
                      record.professional
                        ? (record.professional.first_name + ' ' + record.professional.last_name)
                        : ('ID ' + record.professional_id)
                    }}
                  </td>
                  <td>{{ record.diagnosis || '-' }}</td>
                  <td>{{ record.files?.length || 0 }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .search-input {
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        flex: 1 1 240px;
        font-size: 0.82rem;
        min-width: 200px;
        padding: 0.45rem 0.6rem;
      }

      .refresh-button {
        background: #ffffff;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        color: #344054;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .refresh-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .table-wrap {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 820px;
        width: 100%;
      }

      .table th,
      .table td {
        border-bottom: 1px solid #eaecf0;
        font-size: 0.82rem;
        padding: 0.55rem 0.5rem;
        text-align: left;
      }

      .table th {
        color: #475467;
        font-weight: 600;
      }

      .error-box {
        background: #fef3f2;
        border: 1px solid #fecdca;
        border-radius: 8px;
        color: #b42318;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class MedicalRecordsPage implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService);

  records: MedicalRecord[] = [];
  loading = false;
  errorMessage: string | null = null;
  activePatientId: number | null = null;

  ngOnInit(): void {
    this.loadRecords();
  }

  applyPatientFilter(rawValue: string): void {
    const parsedValue = Number(rawValue);
    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      this.activePatientId = parsedValue;
    } else {
      this.activePatientId = null;
    }
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activePatientId ? { patient_id: this.activePatientId } : undefined;
    this.medicalRecordService
      .getMedicalRecords(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (records) => {
          this.records = [...records].sort(
            (a, b) => new Date(b.record_date || b.created_at).getTime() - new Date(a.record_date || a.created_at).getTime()
          );
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron cargar los registros medicos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
