import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProfessionalService } from '../core/services/professional.service';
import { Professional } from '../shared/models/user.model';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-professionals-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <h1>Profesionales</h1>
      <p>Gestion de plantilla clinica, especialidades y estado operativo.</p>

      <div class="toolbar">
        <input
          #specialtyInput
          type="search"
          class="search-input"
          placeholder="Filtrar por especialidad"
          (keyup.enter)="applySpecialty(specialtyInput.value)"
        />
        <button type="button" class="refresh-button" (click)="applySpecialty(specialtyInput.value)" [disabled]="loading">
          Filtrar
        </button>
        <button type="button" class="refresh-button" (click)="loadProfessionals()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (!loading && professionals.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin profesionales</h2>
          <p class="card-text">No se encontraron profesionales para el filtro aplicado.</p>
        </article>
      }

      @if (professionals.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Especialidad</th>
                <th>Matricula</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              @for (professional of professionals; track professional.id) {
                <tr>
                  <td>#{{ professional.id }}</td>
                  <td>{{ professional.first_name }} {{ professional.last_name }}</td>
                  <td>{{ professional.email }}</td>
                  <td>{{ professional.specialty || '-' }}</td>
                  <td>{{ professional.license_number || '-' }}</td>
                  <td>
                    <span class="badge" [class]="professional.is_active ? 'status-active' : 'status-inactive'">
                      {{ professional.is_active ? 'Activo' : 'Inactivo' }}
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
        flex: 1 1 260px;
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
export class ProfessionalsPage implements OnInit {
  private readonly professionalService = inject(ProfessionalService);

  professionals: Professional[] = [];
  loading = false;
  errorMessage: string | null = null;
  activeSpecialty = '';

  ngOnInit(): void {
    this.loadProfessionals();
  }

  applySpecialty(specialty: string): void {
    this.activeSpecialty = specialty.trim();
    this.loadProfessionals();
  }

  loadProfessionals(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activeSpecialty ? { specialty: this.activeSpecialty } : undefined;
    this.professionalService
      .getProfessionals(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (professionals) => {
          this.professionals = professionals;
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
    return 'No se pudieron cargar los profesionales.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
