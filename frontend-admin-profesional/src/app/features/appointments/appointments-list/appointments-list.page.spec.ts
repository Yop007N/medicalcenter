import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentsListPage } from './appointments-list.page';
import { AppointmentsApiService } from '../../../core/services';
import { of } from 'rxjs';
import { Appointment } from '../../../models';
import { ActivatedRoute } from '@angular/router';

describe('AppointmentsListPage', () => {
  let component: AppointmentsListPage;
  let fixture: ComponentFixture<AppointmentsListPage>;
  let apiServiceSpy: jasmine.SpyObj<AppointmentsApiService>;

  const mockAppointments: Appointment[] = [
    {
      id: 1,
      patient_id: 1,
      professional_id: 1,
      appointment_date: new Date().toISOString(), // Today
      duration_minutes: 30,
      appointment_type: 'Consultation',
      status: 'confirmed',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      patient_id: 2,
      professional_id: 1,
      appointment_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration_minutes: 30,
      appointment_type: 'Follow-up',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AppointmentsApiService', ['list']);
    spy.list.and.returnValue(of(mockAppointments));

    await TestBed.configureTestingModule({
      imports: [AppointmentsListPage],
      providers: [
        { provide: AppointmentsApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(AppointmentsApiService) as jasmine.SpyObj<AppointmentsApiService>;
    fixture = TestBed.createComponent(AppointmentsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', () => {
    expect(apiServiceSpy.list).toHaveBeenCalled();
    expect(component.appointments.length).toBe(2);
    expect(component.filteredAppointments.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should filter appointments', () => {
    component.selectedFilter = 'pending';
    component.filterAppointments();
    expect(component.filteredAppointments.length).toBe(1);
    expect(component.filteredAppointments[0].status).toBe('pending');
  });

  it('should update filter to confirmed', () => {
    component.selectedFilter = 'confirmed';
    component.filterAppointments();
    expect(component.filteredAppointments.length).toBe(1);
    expect(component.filteredAppointments[0].status).toBe('confirmed');
  });

  it('should show all appointments when filter is all', () => {
      component.selectedFilter = 'all';
      component.filterAppointments();
      expect(component.filteredAppointments.length).toBe(2);
  });
});
