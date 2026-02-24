import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

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
        <ion-title>Paciente - Iniciar sesion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Bienvenido</ion-card-title>
          <ion-card-subtitle>Acceso al canal de autogestion del paciente</ion-card-subtitle>
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
              <small class="field-error">Ingresa un correo valido.</small>
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
                Iniciar sesion
              }
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      .error-box {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 10px;
        color: #b91c1c;
        font-size: 0.82rem;
        margin-bottom: 0.7rem;
        padding: 0.65rem 0.75rem;
      }

      .field-error {
        color: #b42318;
        display: block;
        font-size: 0.75rem;
        margin-left: 16px;
        margin-top: 4px;
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

    if (this.authService.isAuthenticated()) {
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
          if (response.user.role !== 'patient') {
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
}
