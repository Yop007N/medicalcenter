import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {
  PatientApiService,
  PatientBudget
} from '../core/services/patient-api.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-my-budgets-page',
  standalone: true,
  imports: [CommonModule, IonicModule, CurrencyPipe],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mis presupuestos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel">
        <h2 class="panel-title">Estado de presupuestos</h2>
        <p class="panel-text">Revisa y acepta presupuestos pendientes.</p>
      </section>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (!loading && budgets.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin presupuestos</h3>
          <p class="panel-text">Todavia no hay presupuestos asociados a tu perfil.</p>
        </section>
      }

      @for (budget of budgets; track budget.id) {
        <section class="panel">
          <h3 class="panel-title">{{ budget.title }}</h3>
          <p class="panel-text">Estado: <span class="status-chip" [class]="'status-' + budget.status">{{ budget.status }}</span></p>
          <p class="panel-text">Monto total: {{ budget.total_amount | currency:'ARS':'symbol':'1.2-2' }}</p>
          <p class="panel-text">Fecha: {{ budget.created_at | date:'mediumDate' }}</p>
          @if (budget.description) {
            <p class="panel-text">{{ budget.description }}</p>
          }

          @if (canAccept(budget)) {
            <ion-button
              size="small"
              class="ion-margin-top"
              (click)="acceptBudget(budget.id)"
              [disabled]="acceptingIds.has(budget.id)"
            >
              @if (acceptingIds.has(budget.id)) {
                Aceptando...
              } @else {
                Aceptar presupuesto
              }
            </ion-button>
          }
        </section>
      }
    </ion-content>
  `,
  styles: [pageShellStyles]
})
export class MyBudgetsPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);

  budgets: PatientBudget[] = [];
  loading = false;
  errorMessage: string | null = null;
  acceptingIds = new Set<number>();

  ngOnInit(): void {
    this.loadBudgets();
  }

  canAccept(budget: PatientBudget): boolean {
    return budget.status === 'sent';
  }

  acceptBudget(budgetId: number): void {
    this.acceptingIds.add(budgetId);
    this.errorMessage = null;

    this.patientApi.acceptBudget(budgetId).subscribe({
      next: (updatedBudget) => {
        this.budgets = this.budgets.map((budget) =>
          budget.id === budgetId ? { ...budget, ...updatedBudget } : budget
        );
        this.acceptingIds.delete(budgetId);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.acceptingIds.delete(budgetId);
      }
    });
  }

  private loadBudgets(): void {
    this.loading = true;
    this.errorMessage = null;

    this.patientApi.getMyBudgets().subscribe({
      next: (budgets) => {
        this.budgets = budgets;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'No se pudieron cargar o actualizar los presupuestos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
