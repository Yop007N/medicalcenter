import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Professional } from '../../models';
import { NotificationService, ProfessionalsApiService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as ProfessionalsActions from './professionals.actions';

const normalizeProfessional = (professional: Partial<Professional> & { address?: string }): Professional => {
  const officeAddress = professional.office_address ?? professional.address;

  return {
    id: professional.id ?? 0,
    first_name: professional.first_name ?? '',
    last_name: professional.last_name ?? '',
    email: professional.email ?? '',
    specialty: professional.specialty ?? 'General',
    is_active: professional.is_active ?? true,
    created_at: professional.created_at ?? new Date().toISOString(),
    ...professional,
    office_address: officeAddress
  };
};

@Injectable()
export class ProfessionalsEffects {
  private actions$ = inject(Actions);
  private professionalsApi = inject(ProfessionalsApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadProfessionals$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.loadProfessionals),
      switchMap(() =>
        this.professionalsApi.list().pipe(
          map((professionals) => ProfessionalsActions.loadProfessionalsSuccess({
            professionals: professionals.map((professional) => normalizeProfessional(professional))
          })),
          catchError(error => of(ProfessionalsActions.loadProfessionalsFailure({
            error: getApiErrorMessage(error, 'Error al cargar profesionales')
          })))
        )
      )
    )
  );

  loadProfessional$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.loadProfessional),
      switchMap(({ id }) =>
        this.professionalsApi.getById(id).pipe(
          map(professional => ProfessionalsActions.loadProfessionalSuccess({
            professional: normalizeProfessional(professional)
          })),
          catchError(error => of(ProfessionalsActions.loadProfessionalFailure({
            error: getApiErrorMessage(error, 'Error al cargar profesional')
          })))
        )
      )
    )
  );

  createProfessional$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.createProfessional),
      switchMap(({ professional }) =>
        this.professionalsApi.create(professional).pipe(
          map(newProfessional => ProfessionalsActions.createProfessionalSuccess({
            professional: normalizeProfessional(newProfessional)
          })),
          catchError(error => of(ProfessionalsActions.createProfessionalFailure({
            error: getApiErrorMessage(error, 'Error al crear profesional')
          })))
        )
      )
    )
  );

  createProfessionalSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.createProfessionalSuccess),
      tap(() => {
        this.notification.showSuccess('Profesional creado correctamente');
        this.router.navigate(['/professionals']);
      })
    ),
    { dispatch: false }
  );

  updateProfessional$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.updateProfessional),
      switchMap(({ id, professional }) =>
        this.professionalsApi.update(id, professional).pipe(
          map(updatedProfessional => ProfessionalsActions.updateProfessionalSuccess({
            professional: normalizeProfessional(updatedProfessional)
          })),
          catchError(error => of(ProfessionalsActions.updateProfessionalFailure({
            error: getApiErrorMessage(error, 'Error al actualizar profesional')
          })))
        )
      )
    )
  );

  updateProfessionalSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.updateProfessionalSuccess),
      tap(() => {
        this.notification.showSuccess('Profesional actualizado correctamente');
        this.router.navigate(['/professionals']);
      })
    ),
    { dispatch: false }
  );

  deleteProfessional$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.deleteProfessional),
      switchMap(({ id }) =>
        this.professionalsApi.delete(id).pipe(
          map(() => ProfessionalsActions.deleteProfessionalSuccess({ id })),
          catchError(error => of(ProfessionalsActions.deleteProfessionalFailure({
            error: getApiErrorMessage(error, 'Error al eliminar profesional')
          })))
        )
      )
    )
  );

  deleteProfessionalSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfessionalsActions.deleteProfessionalSuccess),
      tap(() => {
        this.notification.showSuccess('Profesional eliminado correctamente');
        this.router.navigate(['/professionals']);
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ProfessionalsActions.loadProfessionalsFailure,
        ProfessionalsActions.loadProfessionalFailure,
        ProfessionalsActions.createProfessionalFailure,
        ProfessionalsActions.updateProfessionalFailure,
        ProfessionalsActions.deleteProfessionalFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
