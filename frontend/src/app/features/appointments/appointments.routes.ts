import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { AppointmentsEffects } from '../../store/appointments/appointments.effects';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(AppointmentsEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./appointments-list/appointments-list.page').then(m => m.AppointmentsListPage)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./appointments-calendar/appointments-calendar.page').then(m => m.AppointmentsCalendarPage)
      },
      {
        path: 'new',
        loadComponent: () => import('./appointment-form/appointment-form.page').then(m => m.AppointmentFormPage)
      },
      {
        path: ':id',
        loadComponent: () => import('./appointment-detail/appointment-detail.page').then(m => m.AppointmentDetailPage)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./appointment-form/appointment-form.page').then(m => m.AppointmentFormPage)
      }
    ]
  }
];
