import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, personOutline } from 'ionicons/icons';
import * as AuthActions from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
    IonText
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="register-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title class="ion-text-center">
              <h1>Medical Services</h1>
              <p>Crear Cuenta</p>
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <ion-item>
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <ion-input
                  type="email"
                  formControlName="email"
                  placeholder="Correo electrónico"
                  [clearInput]="true"
                ></ion-input>
              </ion-item>
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['required']) {
                <ion-text color="danger" class="error-text">
                  <small>El correo es requerido</small>
                </ion-text>
              }
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['email']) {
                <ion-text color="danger" class="error-text">
                  <small>Ingrese un correo válido</small>
                </ion-text>
              }

              <ion-item>
                <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
                <ion-input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Contraseña"
                ></ion-input>
                <ion-icon
                  [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"
                  slot="end"
                  (click)="showPassword = !showPassword"
                  class="password-toggle"
                ></ion-icon>
              </ion-item>
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['required']) {
                <ion-text color="danger" class="error-text">
                  <small>La contraseña es requerida</small>
                </ion-text>
              }
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['minlength']) {
                <ion-text color="danger" class="error-text">
                  <small>La contraseña debe tener al menos 6 caracteres</small>
                </ion-text>
              }

              <ion-item>
                <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
                <ion-input
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  placeholder="Confirmar contraseña"
                ></ion-input>
                <ion-icon
                  [name]="showConfirmPassword ? 'eye-off-outline' : 'eye-outline'"
                  slot="end"
                  (click)="showConfirmPassword = !showConfirmPassword"
                  class="password-toggle"
                ></ion-icon>
              </ion-item>
              @if (registerForm.get('confirmPassword')?.touched && registerForm.errors?.['passwordMismatch']) {
                <ion-text color="danger" class="error-text">
                  <small>Las contraseñas no coinciden</small>
                </ion-text>
              }

              @if (error$ | async; as error) {
                <ion-text color="danger" class="ion-text-center error-message">
                  <p>{{ error }}</p>
                </ion-text>
              }

              <ion-button
                expand="block"
                type="submit"
                [disabled]="registerForm.invalid || (loading$ | async)"
                class="ion-margin-top"
              >
                @if (loading$ | async) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  Crear Cuenta
                }
              </ion-button>
            </form>

            <div class="ion-text-center ion-margin-top">
              <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
    }

    ion-card {
      width: 100%;
      max-width: 400px;
      margin: 16px;
    }

    ion-card-title {
      h1 {
        font-size: 24px;
        margin-bottom: 8px;
        color: var(--ion-color-primary);
      }
      p {
        font-size: 16px;
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    ion-item {
      --padding-start: 0;
      margin-bottom: 8px;
    }

    .error-text {
      display: block;
      padding-left: 16px;
      margin-bottom: 8px;
    }

    .error-message {
      display: block;
      margin: 16px 0;
    }

    .password-toggle {
      cursor: pointer;
    }

    a {
      color: var(--ion-color-primary);
      text-decoration: none;
    }
  `]
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  showPassword = false;
  showConfirmPassword = false;

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, personOutline });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      this.store.dispatch(AuthActions.register({
        data: { email, password }
      }));
    }
  }
}
