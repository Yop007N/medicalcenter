import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentsListPage } from './appointments-list.page';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('AppointmentsListPage', () => {
  let component: AppointmentsListPage;
  let fixture: ComponentFixture<AppointmentsListPage>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    // Mock response
    httpClientSpy.get.and.returnValue(of({
      items: [
        {
          id: 1,
          status: 'pending',
          appointment_date: new Date().toISOString(), // Today
          patient: { first_name: 'John', last_name: 'Doe' }
        },
        {
          id: 2,
          status: 'confirmed',
          appointment_date: '2020-01-01T10:00:00Z', // Not today
          patient: { first_name: 'Jane', last_name: 'Doe' }
        },
         {
          id: 3,
          status: 'confirmed',
          appointment_date: '2020-01-01T10:00:00Z', // Not today
          patient: { first_name: 'Bob', last_name: 'Smith' }
        }
      ],
      total: 3,
      page: 1,
      pages: 1
    }));

    await TestBed.configureTestingModule({
      imports: [AppointmentsListPage],
      providers: [
        provideRouter([]),
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This triggers ngOnInit -> loadAppointments
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate stats correctly', () => {
    // New implementation uses properties
    expect(component.todayCount).toBe(1);
    expect(component.pendingCount).toBe(1);
    expect(component.confirmedCount).toBe(2);
  });
});
