import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { MedicalRecord } from '../../models/medical-record.model';
import { MedicalRecordsApiService, NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as MedicalRecordsActions from './medical-records.actions';

const normalizeMedicalRecord = (record: Partial<MedicalRecord>): MedicalRecord => ({
  ...record,
  id: record.id ?? 0,
  patient_id: record.patient_id ?? 0,
  professional_id: record.professional_id ?? 0,
  record_date: record.record_date ?? record.created_at ?? new Date().toISOString(),
  files: record.files ?? [],
  created_at: record.created_at ?? record.record_date ?? new Date().toISOString()
});

@Injectable()
export class MedicalRecordsEffects {
  private actions$ = inject(Actions);
  private medicalRecordsApi = inject(MedicalRecordsApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadMedicalRecords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.loadMedicalRecords),
      switchMap(({ patientId, professionalId, specialtyKey }) =>
        this.medicalRecordsApi.list(patientId, professionalId, specialtyKey).pipe(
          map((medicalRecords) => MedicalRecordsActions.loadMedicalRecordsSuccess({
            medicalRecords: medicalRecords.map((record) => normalizeMedicalRecord(record))
          })),
          catchError(error => of(MedicalRecordsActions.loadMedicalRecordsFailure({
            error: getApiErrorMessage(error, 'Error al cargar historiales medicos')
          })))
        )
      )
    )
  );

  loadMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.loadMedicalRecord),
      switchMap(({ id }) =>
        this.medicalRecordsApi.getById(id).pipe(
          map(medicalRecord => MedicalRecordsActions.loadMedicalRecordSuccess({
            medicalRecord: normalizeMedicalRecord(medicalRecord)
          })),
          catchError(error => of(MedicalRecordsActions.loadMedicalRecordFailure({
            error: getApiErrorMessage(error, 'Error al cargar historial medico')
          })))
        )
      )
    )
  );

  createMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.createMedicalRecord),
      switchMap(({ medicalRecord }) =>
        this.medicalRecordsApi.create(medicalRecord).pipe(
          map(newRecord => MedicalRecordsActions.createMedicalRecordSuccess({
            medicalRecord: normalizeMedicalRecord(newRecord)
          })),
          catchError(error => of(MedicalRecordsActions.createMedicalRecordFailure({
            error: getApiErrorMessage(error, 'Error al crear historial medico')
          })))
        )
      )
    )
  );

  createMedicalRecordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.createMedicalRecordSuccess),
      tap(({ medicalRecord }) => {
        this.notification.showSuccess('Historial medico creado correctamente');
        this.router.navigate(['/medical-records', medicalRecord.id]);
      })
    ),
    { dispatch: false }
  );

  updateMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.updateMedicalRecord),
      switchMap(({ id, medicalRecord }) =>
        this.medicalRecordsApi.update(id, medicalRecord).pipe(
          map(updatedRecord => MedicalRecordsActions.updateMedicalRecordSuccess({
            medicalRecord: normalizeMedicalRecord(updatedRecord)
          })),
          catchError(error => of(MedicalRecordsActions.updateMedicalRecordFailure({
            error: getApiErrorMessage(error, 'Error al actualizar historial medico')
          })))
        )
      )
    )
  );

  updateMedicalRecordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.updateMedicalRecordSuccess),
      tap(() => {
        this.notification.showSuccess('Historial medico actualizado correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.deleteMedicalRecord),
      switchMap(({ id }) =>
        this.medicalRecordsApi.delete(id).pipe(
          map(() => MedicalRecordsActions.deleteMedicalRecordSuccess({ id })),
          catchError(error => of(MedicalRecordsActions.deleteMedicalRecordFailure({
            error: getApiErrorMessage(error, 'Error al eliminar historial medico')
          })))
        )
      )
    )
  );

  deleteMedicalRecordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.deleteMedicalRecordSuccess),
      tap(() => {
        this.notification.showSuccess('Historial medico eliminado correctamente');
        this.router.navigate(['/medical-records']);
      })
    ),
    { dispatch: false }
  );

  // File Upload
  uploadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.uploadFile),
      switchMap(({ medicalRecordId, file, fileType, description }) =>
        this.medicalRecordsApi.uploadFile(medicalRecordId, file, fileType, description).pipe(
          map(uploadedFile => MedicalRecordsActions.uploadFileSuccess({ file: uploadedFile })),
          catchError(error => of(MedicalRecordsActions.uploadFileFailure({
            error: getApiErrorMessage(error, 'Error al subir archivo')
          })))
        )
      )
    )
  );

  uploadFileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.uploadFileSuccess),
      tap(() => {
        this.notification.showSuccess('Archivo subido correctamente');
      })
    ),
    { dispatch: false }
  );

  // File Delete
  deleteFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.deleteFile),
      switchMap(({ fileId }) =>
        this.medicalRecordsApi.deleteFile(fileId).pipe(
          map(() => MedicalRecordsActions.deleteFileSuccess({ fileId })),
          catchError(error => of(MedicalRecordsActions.deleteFileFailure({
            error: getApiErrorMessage(error, 'Error al eliminar archivo')
          })))
        )
      )
    )
  );

  deleteFileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.deleteFileSuccess),
      tap(() => {
        this.notification.showSuccess('Archivo eliminado correctamente');
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        MedicalRecordsActions.loadMedicalRecordsFailure,
        MedicalRecordsActions.loadMedicalRecordFailure,
        MedicalRecordsActions.createMedicalRecordFailure,
        MedicalRecordsActions.updateMedicalRecordFailure,
        MedicalRecordsActions.deleteMedicalRecordFailure,
        MedicalRecordsActions.uploadFileFailure,
        MedicalRecordsActions.deleteFileFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
