import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
  };
};

@Component({
  selector: 'app-auth-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page login-page">
      <h1>Login</h1>
      <p>Acceso para profesionales con autenticacion real contra backend.</p>

      <article class="card login-card">
        <h2 class="card-title">Iniciar sesion</h2>
        <p class="card-text">Ingresa correo y password para continuar.</p>

        @if (errorMessage) {
          <div class="error-box" role="alert" aria-live="assertive">
            {{ errorMessage }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <label class="field-label" for="email">Correo</label>
          <input
            id="email"
            class="field-input"
            type="email"
            autocomplete="username"
            formControlName="email"
            placeholder="profesional@medical.com"
          />
          @if (emailControl.touched && emailControl.hasError('required')) {
            <small class="field-error">El correo es obligatorio.</small>
          }
          @if (emailControl.touched && emailControl.hasError('email')) {
            <small class="field-error">Ingresa un correo valido.</small>
          }

          <label class="field-label" for="password">Password</label>
          <input
            id="password"
            class="field-input"
            type="password"
            autocomplete="current-password"
            formControlName="password"
            placeholder="Tu password"
          />
          @if (passwordControl.touched && passwordControl.hasError('required')) {
            <small class="field-error">La password es obligatoria.</small>
          }

          <button class="submit-button" type="submit" [disabled]="loginForm.invalid || isSubmitting">
            @if (isSubmitting) {
              Iniciando sesion...
            } @else {
              Iniciar sesion
            }
          </button>
        </form>
      </article>
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .login-page {
        margin: 0 auto;
        max-width: 520px;
      }

      .login-card {
        margin: 0 auto;
        max-width: 420px;
      }

      form {
        display: grid;
        gap: 0.6rem;
        margin-top: 1rem;
      }

      .field-label {
        color: #344054;
        font-size: 0.82rem;
        font-weight: 600;
      }

      .field-input {
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        font-size: 0.9rem;
        padding: 0.65rem 0.75rem;
      }

      .field-input:focus {
        border-color: #1d4ed8;
        box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
        outline: none;
      }

      .field-error {
        color: #b42318;
        font-size: 0.76rem;
      }

      .error-box {
        background: #fef3f2;
        border: 1px solid #fecdca;
        border-radius: 8px;
        color: #b42318;
        font-size: 0.82rem;
        margin-top: 1rem;
        padding: 0.6rem 0.7rem;
      }

      .submit-button {
        background: #1d4ed8;
        border: 0;
        border-radius: 8px;
        color: #ffffff;
        cursor: pointer;
        font-size: 0.86rem;
        font-weight: 600;
        margin-top: 0.4rem;
        padding: 0.7rem 0.8rem;
      }

      .submit-button:disabled {
        background: #93c5fd;
        cursor: not-allowed;
      }
    `
  ]
})
export class AuthLoginPage implements OnInit {
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
    const candidateReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (candidateReturnUrl && candidateReturnUrl.startsWith('/')) {
      this.returnUrl = candidateReturnUrl;
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
          if (response.user.role !== 'professional') {
            this.authService.logout();
            this.errorMessage = 'Este acceso es solo para profesionales de salud.';
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
      const message = error.error?.message ?? error.error?.msg;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return 'No se pudo iniciar sesion. Verifica tus credenciales.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
