import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { FilesApiService, NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as FilesActions from './files.actions';

@Injectable()
export class FilesEffects {
  private actions$ = inject(Actions);
  private filesApi = inject(FilesApiService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  loadFiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.loadFiles),
      switchMap(({ patientId }) =>
        this.filesApi.list(patientId).pipe(
          map(files => FilesActions.loadFilesSuccess({ files })),
          catchError(error => of(FilesActions.loadFilesFailure({
            error: getApiErrorMessage(error, 'Error al cargar archivos')
          })))
        )
      )
    )
  );

  loadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.loadFile),
      switchMap(({ id }) =>
        this.filesApi.getById(id).pipe(
          map(file => FilesActions.loadFileSuccess({ file })),
          catchError(error => of(FilesActions.loadFileFailure({
            error: getApiErrorMessage(error, 'Error al cargar archivo')
          })))
        )
      )
    )
  );

  uploadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.uploadFile),
      switchMap(({ file, metadata }) =>
        this.filesApi.upload(file, metadata).pipe(
          map(uploadedFile => FilesActions.uploadFileSuccess({ file: uploadedFile })),
          catchError(error => of(FilesActions.uploadFileFailure({
            error: getApiErrorMessage(error, 'Error al subir archivo'),
            patientId: metadata.patient_id
          })))
        )
      )
    )
  );

  uploadFileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.uploadFileSuccess),
      tap(() => {
        this.notification.showSuccess('Archivo subido correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.deleteFile),
      switchMap(({ id }) =>
        this.filesApi.delete(id).pipe(
          map(() => FilesActions.deleteFileSuccess({ id })),
          catchError(error => of(FilesActions.deleteFileFailure({
            error: getApiErrorMessage(error, 'Error al eliminar archivo')
          })))
        )
      )
    )
  );

  deleteFileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.deleteFileSuccess),
      tap(() => {
        this.notification.showSuccess('Archivo eliminado correctamente');
      })
    ),
    { dispatch: false }
  );

  downloadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.downloadFile),
      switchMap(({ id, filename }) =>
        this.filesApi.download(id).pipe(
          tap(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(url);
          }),
          map(() => FilesActions.downloadFileSuccess()),
          catchError(error => of(FilesActions.downloadFileFailure({
            error: getApiErrorMessage(error, 'Error al descargar archivo')
          })))
        )
      )
    )
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        FilesActions.loadFilesFailure,
        FilesActions.loadFileFailure,
        FilesActions.uploadFileFailure,
        FilesActions.deleteFileFailure,
        FilesActions.downloadFileFailure
      ),
      tap((action) => {
        if (
          action.type === FilesActions.uploadFileFailure.type &&
          action.patientId &&
          this.shouldRedirectToMedicalRecord(action.error)
        ) {
          this.notification.showWarning('El paciente no tiene historial medico. Te redirigimos para crearlo.');
          this.router.navigate(['/medical-records/new'], {
            queryParams: { patient_id: action.patientId }
          });
          return;
        }

        this.notification.showError(action.error);
      })
    ),
    { dispatch: false }
  );

  private shouldRedirectToMedicalRecord(errorMessage: string): boolean {
    const normalized = errorMessage
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return (
      normalized.includes('no tiene historial medico') ||
      normalized.includes('medical_record_id')
    );
  }
}
