import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MedicalFile } from '../../models/file.model';
import { NotificationService } from '../../core/services';
import * as FilesActions from './files.actions';

@Injectable()
export class FilesEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  loadFiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.loadFiles),
      switchMap(({ patientId }) => {
        let params = new HttpParams();
        if (patientId) params = params.set('patient_id', patientId.toString());

        return this.http.get<MedicalFile[]>(`${environment.apiUrl}/files`, { params }).pipe(
          map(files => FilesActions.loadFilesSuccess({ files })),
          catchError(error => of(FilesActions.loadFilesFailure({
            error: error.error?.msg || 'Error al cargar archivos'
          })))
        );
      })
    )
  );

  loadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.loadFile),
      switchMap(({ id }) =>
        this.http.get<MedicalFile>(`${environment.apiUrl}/files/${id}`).pipe(
          map(file => FilesActions.loadFileSuccess({ file })),
          catchError(error => of(FilesActions.loadFileFailure({
            error: error.error?.msg || 'Error al cargar archivo'
          })))
        )
      )
    )
  );

  uploadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.uploadFile),
      switchMap(({ file, metadata }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', metadata.patient_id.toString());
        formData.append('category', metadata.category);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.is_private !== undefined) formData.append('is_private', metadata.is_private.toString());
        if (metadata.medical_record_id) formData.append('medical_record_id', metadata.medical_record_id.toString());
        if (metadata.appointment_id) formData.append('appointment_id', metadata.appointment_id.toString());

        return this.http.post<MedicalFile>(`${environment.apiUrl}/files/upload`, formData).pipe(
          map(uploadedFile => FilesActions.uploadFileSuccess({ file: uploadedFile })),
          catchError(error => of(FilesActions.uploadFileFailure({
            error: error.error?.msg || 'Error al subir archivo'
          })))
        );
      })
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
        this.http.delete(`${environment.apiUrl}/files/${id}`).pipe(
          map(() => FilesActions.deleteFileSuccess({ id })),
          catchError(error => of(FilesActions.deleteFileFailure({
            error: error.error?.msg || 'Error al eliminar archivo'
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
        this.http.get(`${environment.apiUrl}/files/${id}/download`, { responseType: 'blob' }).pipe(
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
            error: error.error?.msg || 'Error al descargar archivo'
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
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
