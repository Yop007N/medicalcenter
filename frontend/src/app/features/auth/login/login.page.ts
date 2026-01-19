import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  medkitOutline,
  heartOutline,
  pulseOutline
} from 'ionicons/icons';
import * as AuthActions from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
    IonText
  ],
  template: `
    <ion-content [fullscreen]="true" class="login-content">
      <div class="login-wrapper">
        <!-- Left Side - Branding -->
        <div class="login-branding">
          <div class="brand-content">
            <div class="brand-logo">
              <div class="logo-icon">
                <ion-icon name="medkit-outline"></ion-icon>
              </div>
            </div>
            <h1>Medical Services</h1>
            <p class="brand-tagline">Sistema integral de gestión clínica</p>

            <div class="brand-features">
              <div class="feature">
                <ion-icon name="pulse-outline"></ion-icon>
                <span>Gestión de pacientes</span>
              </div>
              <div class="feature">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Agenda de citas</span>
              </div>
              <div class="feature">
                <ion-icon name="document-text-outline"></ion-icon>
                <span>Historiales médicos</span>
              </div>
            </div>
          </div>

          <div class="brand-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
            <div class="decoration-circle circle-3"></div>
          </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="login-form-wrapper">
          <ion-card class="login-card">
            <ion-card-content>
              <div class="form-header">
                <div class="mobile-logo">
                  <ion-icon name="medkit-outline"></ion-icon>
                </div>
                <h2>Bienvenido</h2>
                <p>Ingresa tus credenciales para continuar</p>
              </div>

              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="form-group">
                  <label>Correo electrónico</label>
                  <div class="input-wrapper" [class.input-error]="loginForm.get('email')?.touched && loginForm.get('email')?.invalid">
                    <ion-icon name="mail-outline" class="input-icon"></ion-icon>
                    <ion-input
                      type="email"
                      formControlName="email"
                      placeholder="tu@email.com"
                      [clearInput]="true"
                    ></ion-input>
                  </div>
                  @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['required']) {
                    <span class="error-message">El correo es requerido</span>
                  }
                  @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['email']) {
                    <span class="error-message">Ingresa un correo válido</span>
                  }
                </div>

                <div class="form-group">
                  <label>Contraseña</label>
                  <div class="input-wrapper" [class.input-error]="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
                    <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
                    <ion-input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="password"
                      placeholder="••••••••"
                    ></ion-input>
                  <button
                    type="button"
                    class="toggle-password-btn"
                    (click)="togglePassword()"
                    [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    [attr.aria-pressed]="showPassword"
                  >
                    <ion-icon
                      [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"
                      aria-hidden="true"
                    ></ion-icon>
                  </button>
                  </div>
                  @if (loginForm.get('password')?.touched && loginForm.get('password')?.errors?.['required']) {
                    <span class="error-message">La contraseña es requerida</span>
                  }
                </div>

                <div class="form-options">
                  <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
                </div>

                @if (error$ | async; as error) {
                  <div class="alert-error">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>{{ error }}</span>
                  </div>
                }

                <ion-button
                  expand="block"
                  type="submit"
                  [disabled]="loginForm.invalid || (loading$ | async)"
                  class="submit-button"
                >
                  @if (loading$ | async) {
                    <ion-spinner name="crescent"></ion-spinner>
                    <span>Iniciando sesión...</span>
                  } @else {
                    <span>Iniciar sesión</span>
                  }
                </ion-button>
              </form>

              <div class="divider-text">
                <span>¿Eres nuevo?</span>
              </div>

              <ion-button
                expand="block"
                fill="outline"
                routerLink="/auth/register"
                class="register-button"
              >
                Crear una cuenta
              </ion-button>
            </ion-card-content>
          </ion-card>

          <p class="copyright">© 2024 Medical Services. Todos los derechos reservados.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: var(--medical-bg-light);
    }

    .login-wrapper {
      display: flex;
      min-height: 100%;
    }

    /* Branding Section */
    .login-branding {
      display: none;
      flex: 1;
      background: var(--medical-gradient-primary);
      position: relative;
      overflow: hidden;
      padding: 48px;

      @media (min-width: 992px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .brand-content {
      position: relative;
      z-index: 2;
      color: white;
      text-align: center;
      max-width: 400px;
    }

    .brand-logo {
      margin-bottom: 24px;
    }

    .logo-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      backdrop-filter: blur(10px);

      ion-icon {
        font-size: 40px;
        color: white;
      }
    }

    .brand-content h1 {
      font-size: 32px;
      font-weight: 700;
      color: white;
      margin-bottom: 8px;
    }

    .brand-tagline {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 48px;
    }

    .brand-features {
      text-align: left;

      .feature {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: var(--medical-radius);
        margin-bottom: 12px;
        backdrop-filter: blur(5px);

        ion-icon {
          font-size: 22px;
        }

        span {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }

    .brand-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;

      .decoration-circle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.05);
      }

      .circle-1 {
        width: 400px;
        height: 400px;
        top: -150px;
        right: -100px;
      }

      .circle-2 {
        width: 300px;
        height: 300px;
        bottom: -100px;
        left: -50px;
      }

      .circle-3 {
        width: 200px;
        height: 200px;
        bottom: 100px;
        right: 50px;
      }
    }

    /* Form Section */
    .login-form-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      min-height: 100vh;

      @media (min-width: 992px) {
        max-width: 500px;
      }
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      margin: 0;
      border-radius: var(--medical-radius-lg);
      box-shadow: var(--medical-shadow-xl);
      border: none;

      ion-card-content {
        padding: 32px;

        @media (min-width: 768px) {
          padding: 40px;
        }
      }
    }

    .mobile-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: var(--medical-gradient-primary);
      border-radius: var(--medical-radius-md);
      margin: 0 auto 20px;

      ion-icon {
        font-size: 28px;
        color: white;
      }

      @media (min-width: 992px) {
        display: none;
      }
    }

    .form-header {
      text-align: center;
      margin-bottom: 32px;

      h2 {
        font-size: 24px;
        font-weight: 700;
        color: var(--ion-color-dark);
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: var(--ion-color-medium);
      }
    }

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin-bottom: 8px;
      }
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      background: var(--medical-bg-light);
      border: 2px solid var(--medical-border-light);
      border-radius: var(--medical-radius);
      padding: 0 16px;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: var(--ion-color-primary);
        background: white;
      }

      &.input-error {
        border-color: var(--ion-color-danger);
      }

      .input-icon {
        font-size: 20px;
        color: var(--ion-color-medium);
        margin-right: 12px;
      }

      ion-input {
        --background: transparent;
        --padding-start: 0;
        --padding-end: 0;
        --placeholder-color: var(--ion-color-medium);
        flex: 1;
      }

      .toggle-password-btn {
        background: none;
        border: none;
        padding: 8px;
        margin: -8px -8px -8px 8px;
        cursor: pointer;
        border-radius: 50%;
        color: var(--ion-color-medium);
        display: flex;
        align-items: center;
        justify-content: center;

        ion-icon {
          font-size: 20px;
          pointer-events: none;
        }

        &:hover {
          color: var(--ion-color-primary);
          background: rgba(var(--ion-color-primary-rgb), 0.1);
        }

        &:focus-visible {
          outline: 2px solid var(--ion-color-primary);
          outline-offset: -2px;
          color: var(--ion-color-primary);
        }
      }
    }

    .error-message {
      display: block;
      font-size: 12px;
      color: var(--ion-color-danger);
      margin-top: 6px;
      padding-left: 4px;
    }

    .form-options {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }

    .forgot-link {
      font-size: 13px;
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .alert-error {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(var(--ion-color-danger-rgb), 0.1);
      border-radius: var(--medical-radius);
      margin-bottom: 20px;

      ion-icon {
        font-size: 20px;
        color: var(--ion-color-danger);
      }

      span {
        font-size: 13px;
        color: var(--ion-color-danger);
        font-weight: 500;
      }
    }

    .submit-button {
      --background: var(--medical-gradient-primary);
      --border-radius: var(--medical-radius);
      height: 48px;
      font-weight: 600;
      margin: 0;

      ion-spinner {
        margin-right: 8px;
      }
    }

    .divider-text {
      display: flex;
      align-items: center;
      margin: 24px 0;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--medical-border-light);
      }

      span {
        padding: 0 16px;
        font-size: 13px;
        color: var(--ion-color-medium);
      }
    }

    .register-button {
      --border-color: var(--ion-color-primary);
      --color: var(--ion-color-primary);
      --border-radius: var(--medical-radius);
      height: 48px;
      font-weight: 600;
      margin: 0;
    }

    .copyright {
      margin-top: 24px;
      font-size: 12px;
      color: var(--ion-color-medium);
      text-align: center;
    }
  `]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  showPassword = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      medkitOutline,
      heartOutline,
      pulseOutline
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.store.dispatch(AuthActions.login({
        credentials: this.loginForm.value
      }));
    }
  }
}
