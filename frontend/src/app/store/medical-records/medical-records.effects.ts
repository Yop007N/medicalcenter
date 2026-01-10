import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MedicalRecord, MedicalFile } from '../../models/medical-record.model';
import { NotificationService } from '../../core/services';
import * as MedicalRecordsActions from './medical-records.actions';

@Injectable()
export class MedicalRecordsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadMedicalRecords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.loadMedicalRecords),
      switchMap(({ patientId, professionalId }) => {
        let params = new HttpParams();
        if (patientId) params = params.set('patient_id', patientId.toString());
        if (professionalId) params = params.set('professional_id', professionalId.toString());

        return this.http.get<MedicalRecord[]>(`${environment.apiUrl}/medical-records`, { params }).pipe(
          map(medicalRecords => MedicalRecordsActions.loadMedicalRecordsSuccess({ medicalRecords })),
          catchError(error => of(MedicalRecordsActions.loadMedicalRecordsFailure({
            error: error.error?.msg || 'Error al cargar historiales médicos'
          })))
        );
      })
    )
  );

  loadMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.loadMedicalRecord),
      switchMap(({ id }) =>
        this.http.get<MedicalRecord>(`${environment.apiUrl}/medical-records/${id}`).pipe(
          map(medicalRecord => MedicalRecordsActions.loadMedicalRecordSuccess({ medicalRecord })),
          catchError(error => of(MedicalRecordsActions.loadMedicalRecordFailure({
            error: error.error?.msg || 'Error al cargar historial médico'
          })))
        )
      )
    )
  );

  createMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.createMedicalRecord),
      switchMap(({ medicalRecord }) =>
        this.http.post<MedicalRecord>(`${environment.apiUrl}/medical-records`, medicalRecord).pipe(
          map(newRecord => MedicalRecordsActions.createMedicalRecordSuccess({ medicalRecord: newRecord })),
          catchError(error => of(MedicalRecordsActions.createMedicalRecordFailure({
            error: error.error?.msg || 'Error al crear historial médico'
          })))
        )
      )
    )
  );

  createMedicalRecordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.createMedicalRecordSuccess),
      tap(({ medicalRecord }) => {
        this.notification.showSuccess('Historial médico creado correctamente');
        this.router.navigate(['/medical-records', medicalRecord.id]);
      })
    ),
    { dispatch: false }
  );

  updateMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.updateMedicalRecord),
      switchMap(({ id, medicalRecord }) =>
        this.http.put<MedicalRecord>(`${environment.apiUrl}/medical-records/${id}`, medicalRecord).pipe(
          map(updatedRecord => MedicalRecordsActions.updateMedicalRecordSuccess({ medicalRecord: updatedRecord })),
          catchError(error => of(MedicalRecordsActions.updateMedicalRecordFailure({
            error: error.error?.msg || 'Error al actualizar historial médico'
          })))
        )
      )
    )
  );

  updateMedicalRecordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.updateMedicalRecordSuccess),
      tap(() => {
        this.notification.showSuccess('Historial médico actualizado correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteMedicalRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.deleteMedicalRecord),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/medical-records/${id}`).pipe(
          map(() => MedicalRecordsActions.deleteMedicalRecordSuccess({ id })),
          catchError(error => of(MedicalRecordsActions.deleteMedicalRecordFailure({
            error: error.error?.msg || 'Error al eliminar historial médico'
          })))
        )
      )
    )
  );

  deleteMedicalRecordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.deleteMedicalRecordSuccess),
      tap(() => {
        this.notification.showSuccess('Historial médico eliminado correctamente');
        this.router.navigate(['/medical-records']);
      })
    ),
    { dispatch: false }
  );

  // File Upload
  uploadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MedicalRecordsActions.uploadFile),
      switchMap(({ medicalRecordId, file, fileType, description }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('medical_record_id', medicalRecordId.toString());
        if (fileType) formData.append('file_type', fileType);
        if (description) formData.append('description', description);

        return this.http.post<MedicalFile>(`${environment.apiUrl}/files/upload`, formData).pipe(
          map(uploadedFile => MedicalRecordsActions.uploadFileSuccess({ file: uploadedFile })),
          catchError(error => of(MedicalRecordsActions.uploadFileFailure({
            error: error.error?.msg || 'Error al subir archivo'
          })))
        );
      })
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
        this.http.delete(`${environment.apiUrl}/files/${fileId}`).pipe(
          map(() => MedicalRecordsActions.deleteFileSuccess({ fileId })),
          catchError(error => of(MedicalRecordsActions.deleteFileFailure({
            error: error.error?.msg || 'Error al eliminar archivo'
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
