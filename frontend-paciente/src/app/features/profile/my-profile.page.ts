import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PatientApiService } from '../../core/services/patient-api.service';
import { PatientProfile } from '../../core/models/patient.model';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-my-profile-page',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú"></ion-menu-button>
        </ion-buttons>
        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content ion-padding-bottom">
      <section class="panel">
        <h2 class="panel-title">Datos personales</h2>
        <p class="panel-text">Mantén actualizada tu información de contacto.</p>
      </section>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <ion-note color="success" class="ion-padding-horizontal">{{ successMessage }}</ion-note>
      }

      <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="ion-padding-horizontal">
        <ion-item>
          <ion-label position="stacked">Nombre</ion-label>
          <ion-input formControlName="first_name" placeholder="Nombre"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Apellido</ion-label>
          <ion-input formControlName="last_name" placeholder="Apellido"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Fecha de nacimiento</ion-label>
          <ion-input type="date" formControlName="date_of_birth"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Teléfono</ion-label>
          <ion-input formControlName="phone" placeholder="+54 ..."></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Dirección</ion-label>
          <ion-input formControlName="address" placeholder="Dirección"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Contacto de emergencia</ion-label>
          <ion-input formControlName="emergency_contact" placeholder="Nombre"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Teléfono de emergencia</ion-label>
          <ion-input formControlName="emergency_phone" placeholder="+54 ..."></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Grupo sanguíneo</ion-label>
          <ion-input formControlName="blood_type" placeholder="O+"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Alergias</ion-label>
          <ion-textarea formControlName="allergies" autoGrow="true"></ion-textarea>
        </ion-item>

        <ion-button
          type="submit"
          expand="block"
          class="ion-margin-top"
          [disabled]="profileForm.invalid || saving"
        >
          @if (saving) {
            Guardando...
          } @else {
            Guardar cambios
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  styleUrls: ['../../shared/styles/page-shell.styles.scss'],
})
export class MyProfilePage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly patientApi = inject(PatientApiService);

  readonly profileForm = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    date_of_birth: [''],
    phone: [''],
    address: [''],
    emergency_contact: [''],
    emergency_phone: [''],
    blood_type: [''],
    allergies: ['']
  });

  loading = false;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.loadProfile();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.profileForm.getRawValue();

    const payload: Partial<PatientProfile> = {
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      date_of_birth: formValue.date_of_birth || null,
      phone: formValue.phone || null,
      address: formValue.address || null,
      emergency_contact: formValue.emergency_contact || null,
      emergency_phone: formValue.emergency_phone || null,
      blood_type: formValue.blood_type || null,
      allergies: formValue.allergies || null
    };

    this.patientApi.updateMyProfile(payload).subscribe({
      next: (profile) => {
        this.patchForm(profile);
        this.saving = false;
        this.successMessage = 'Perfil actualizado correctamente.';
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.saving = false;
      }
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.errorMessage = null;

    this.patientApi.getMyProfile().subscribe({
      next: (profile) => {
        this.patchForm(profile);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private patchForm(profile: PatientProfile): void {
    this.profileForm.patchValue({
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      date_of_birth: profile.date_of_birth?.slice(0, 10) ?? '',
      phone: profile.phone ?? '',
      address: profile.address ?? '',
      emergency_contact: profile.emergency_contact ?? '',
      emergency_phone: profile.emergency_phone ?? '',
      blood_type: profile.blood_type ?? '',
      allergies: profile.allergies ?? ''
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'No se pudo actualizar el perfil.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
