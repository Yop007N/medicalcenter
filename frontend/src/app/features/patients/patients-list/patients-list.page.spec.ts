import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientsListPage } from './patients-list.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NotificationService } from '../../../core/services';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';

describe('PatientsListPage', () => {
  let component: PatientsListPage;
  let fixture: ComponentFixture<PatientsListPage>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  const mockPatients = [
    { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', is_active: true, created_at: '2023-01-01' },
    { id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', is_active: false, created_at: '2023-01-01' },
    { id: 3, first_name: 'Bob', last_name: 'Smith', email: 'bob@example.com', is_active: true, created_at: '2023-01-01' }
  ];

  beforeEach(async () => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['confirm', 'showSuccess']);

    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'delete']);
    httpClientSpy.get.and.returnValue(of(mockPatients));

    await TestBed.configureTestingModule({
      imports: [PatientsListPage, HttpClientTestingModule],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct active and inactive counts', () => {
    const debugElement = fixture.debugElement;
    const activeChip = debugElement.query(By.css('.stat-chip.active'));
    const inactiveChip = debugElement.query(By.css('.stat-chip.inactive'));

    expect(activeChip).toBeTruthy();
    expect(inactiveChip).toBeTruthy();

    expect(activeChip.nativeElement.textContent).toContain('2 activos');
    expect(inactiveChip.nativeElement.textContent).toContain('1 inactivos');
  });
});
