import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '../../../models';

@Pipe({
  name: 'appointmentDate',
  standalone: true
})
export class AppointmentDatePipe implements PipeTransform {
  transform(value: string | Date, type: 'day' | 'month' | 'time' | 'full' = 'full'): string {
    if (!value) return '';
    const date = new Date(value);

    switch (type) {
      case 'day':
        return format(date, 'd');
      case 'month':
        return format(date, 'MMM', { locale: es });
      case 'time':
        return format(date, 'HH:mm');
      case 'full':
      default:
        return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    }
  }
}

@Pipe({
  name: 'appointmentStatusLabel',
  standalone: true
})
export class AppointmentStatusLabelPipe implements PipeTransform {
  transform(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  }
}

@Pipe({
  name: 'patientInitials',
  standalone: true
})
export class PatientInitialsPipe implements PipeTransform {
  transform(appointment: Appointment): string {
    if (!appointment?.patient) return '';
    const first = appointment.patient.first_name?.charAt(0) || '';
    const last = appointment.patient.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
