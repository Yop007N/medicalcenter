import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Appointment } from '../../shared/models/appointment.model';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private api: ApiService) {}

  getAppointments(filters?: {
    professional_id?: number;
    patient_id?: number;
    status?: Appointment['status'];
    date_from?: string;
    date_to?: string;
    specialty_key?: string;
  }): Observable<Appointment[]> {
    return this.api
      .get<CollectionResponse<Appointment>>(API_ENDPOINTS.appointments.base, filters)
      .pipe(mapCollectionItems<Appointment>());
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.api.get<Appointment>(API_ENDPOINTS.appointments.byId(id));
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.api.post<Appointment>(API_ENDPOINTS.appointments.base, appointment);
  }

  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.api.put<Appointment>(API_ENDPOINTS.appointments.byId(id), appointment);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.appointments.byId(id));
  }

  confirmAppointment(id: number): Observable<Appointment> {
    return this.api.post<Appointment>(API_ENDPOINTS.appointments.confirm(id), {});
  }
}
