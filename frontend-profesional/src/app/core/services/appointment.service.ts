import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Appointment } from '../../shared/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private api: ApiService) {}

  getAppointments(filters?: any): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('appointments', filters);
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.api.get<Appointment>(`appointments/${id}`);
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.api.post<Appointment>('appointments', appointment);
  }

  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.api.put<Appointment>(`appointments/${id}`, appointment);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.api.delete<void>(`appointments/${id}`);
  }

  confirmAppointment(id: number): Observable<Appointment> {
    return this.api.post<Appointment>(`appointments/${id}/confirm`, {});
  }
}
