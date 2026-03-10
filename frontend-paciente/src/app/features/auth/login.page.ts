import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Portal Paciente</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="login-content">
      <section class="login-shell">
        <div class="brand-panel">
          <span class="brand-kicker">Medical Services</span>
          <h1>Tu salud, en un solo lugar</h1>
          <p>Consulta turnos, indicaciones clínicas, documentos y consentimiento informado.</p>
          <ul>
            <li>Agenda y seguimiento de tratamientos</li>
            <li>Historial clínico siempre disponible</li>
            <li>Presupuestos y estado administrativo</li>
          </ul>
        </div>

        <ion-card class="login-card">
          <ion-card-header>
            <ion-card-title>Iniciar sesión</ion-card-title>
            <ion-card-subtitle>Acceso al canal de autogestión del paciente</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            @if (errorMessage) {
              <div class="error-box" role="alert">{{ errorMessage }}</div>
            }

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
              <ion-item lines="full">
                <ion-label position="stacked">Correo</ion-label>
                <ion-input
                  type="email"
                  formControlName="email"
                  autocomplete="username"
                  placeholder="patient@medical.com"
                ></ion-input>
              </ion-item>
              @if (emailControl.touched && emailControl.invalid) {
                <small class="field-error">Ingresa un correo válido.</small>
              }

              <ion-item lines="full" class="ion-margin-top">
                <ion-label position="stacked">Password</ion-label>
                <ion-input
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="Tu password"
                ></ion-input>
              </ion-item>
              @if (passwordControl.touched && passwordControl.invalid) {
                <small class="field-error">La password es obligatoria.</small>
              }

              <ion-button
                type="submit"
                expand="block"
                class="ion-margin-top"
                [disabled]="loginForm.invalid || isSubmitting"
              >
                @if (isSubmitting) {
                  Iniciando...
                } @else {
                  Iniciar sesión
                }
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>
      </section>
    </ion-content>
  `,
  styles: [
    `
      .login-content {
        --background: var(--patient-bg);
      }

      .login-shell {
        display: grid;
        gap: 14px;
        margin: 0 auto;
        max-width: 980px;
        padding: 20px 14px 28px;
      }

      .brand-panel {
        background: linear-gradient(
          145deg,
          rgba(var(--ion-color-primary-rgb), 0.14) 0%,
          rgba(var(--ion-color-secondary-rgb), 0.08) 100%
        );
        border: 1px solid rgba(var(--ion-color-primary-rgb), 0.22);
        border-radius: var(--patient-radius);
        color: var(--ion-color-dark);
        padding: 18px 16px;
      }

      .brand-kicker {
        color: var(--ion-color-primary);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .brand-panel h1 {
        font-size: 1.34rem;
        line-height: 1.2;
        margin: 8px 0 8px;
      }

      .brand-panel p {
        color: var(--ion-color-medium);
        font-size: 0.84rem;
        margin: 0 0 10px;
      }

      .brand-panel ul {
        color: var(--ion-color-dark);
        display: grid;
        font-size: 0.78rem;
        gap: 6px;
        margin: 0;
        padding-left: 18px;
      }

      .login-card {
        margin: 0;
      }

      .error-box {
        background: rgba(var(--ion-color-danger-rgb), 0.12);
        border: 1px solid rgba(var(--ion-color-danger-rgb), 0.3);
        border-radius: 10px;
        color: var(--ion-color-danger);
        font-size: 0.82rem;
        margin-bottom: 0.7rem;
        padding: 0.65rem 0.75rem;
      }

      .field-error {
        color: var(--ion-color-danger);
        display: block;
        font-size: 0.75rem;
        margin-left: 16px;
        margin-top: 4px;
      }

      @media (min-width: 900px) {
        .login-shell {
          align-items: stretch;
          gap: 18px;
          grid-template-columns: 1.1fr 1fr;
          min-height: calc(100vh - 100px);
          padding-top: 34px;
        }

        .brand-panel,
        .login-card {
          align-self: center;
        }
      }
    `
  ]
})
export class LoginPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isSubmitting = false;
  errorMessage: string | null = null;
  private returnUrl = '/dashboard';

  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  ngOnInit(): void {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    if (candidate && candidate.startsWith('/')) {
      this.returnUrl = candidate;
    }

    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'role') {
      this.errorMessage = 'Esta sesion pertenece a otro canal. Inicia sesion como paciente.';
    }

    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUserValue;
      if (!this.isPatientRole(user?.role)) {
        this.authService.logout();
        return;
      }
      void this.router.navigateByUrl(this.returnUrl);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.errorMessage = null;
    this.isSubmitting = true;

    this.authService
      .login(email, password)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          if (!this.isPatientRole(response.user.role)) {
            this.authService.logout();
            this.errorMessage = 'Este acceso es solo para pacientes.';
            return;
          }
          void this.router.navigateByUrl(this.returnUrl);
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
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

    return 'No se pudo iniciar sesion. Verifica tus credenciales.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }

  private isPatientRole(role: string | undefined): boolean {
    return typeof role === 'string' && role.trim().toLowerCase() === 'patient';
  }
}
