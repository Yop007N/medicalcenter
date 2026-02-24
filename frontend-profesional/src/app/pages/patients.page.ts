import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PatientService } from '../core/services/patient.service';
import { Patient } from '../shared/models/user.model';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <h1>Pacientes</h1>
      <p>Gestion de perfiles, contacto y seguimiento clinico.</p>

      <div class="toolbar">
        <input
          #searchInput
          type="search"
          class="search-input"
          placeholder="Buscar por nombre, apellido o email"
          (keyup.enter)="applySearch(searchInput.value)"
        />
        <button type="button" class="refresh-button" (click)="applySearch(searchInput.value)" [disabled]="loading">
          Buscar
        </button>
        <button type="button" class="refresh-button" (click)="loadPatients()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (!loading && patients.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin pacientes</h2>
          <p class="card-text">No se encontraron pacientes para el filtro aplicado.</p>
        </article>
      }

      @if (patients.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Sangre</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              @for (patient of patients; track patient.id) {
                <tr>
                  <td>#{{ patient.id }}</td>
                  <td>{{ patient.first_name }} {{ patient.last_name }}</td>
                  <td>{{ patient.email }}</td>
                  <td>{{ patient.phone || '-' }}</td>
                  <td>{{ patient.blood_type || '-' }}</td>
                  <td>
                    <span class="badge" [class]="patient.is_active ? 'status-active' : 'status-inactive'">
                      {{ patient.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
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
        flex: 1 1 300px;
        font-size: 0.82rem;
        min-width: 220px;
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
        min-width: 760px;
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

      .badge {
        border-radius: 999px;
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
      }

      .status-active {
        background: #ecfdf3;
        color: #067647;
      }

      .status-inactive {
        background: #fef3f2;
        color: #b42318;
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
export class PatientsPage implements OnInit {
  private readonly patientService = inject(PatientService);

  patients: Patient[] = [];
  loading = false;
  errorMessage: string | null = null;
  activeSearch = '';

  ngOnInit(): void {
    this.loadPatients();
  }

  applySearch(searchValue: string): void {
    this.activeSearch = searchValue.trim();
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activeSearch ? { search: this.activeSearch } : undefined;
    this.patientService
      .getPatients(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (patients) => {
          this.patients = patients;
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
    return 'No se pudieron cargar los pacientes.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
