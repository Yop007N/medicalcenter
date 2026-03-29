import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnamnesisTabComponent } from './anamnesis-tab.component';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';
import { of } from 'rxjs';

describe('AnamnesisTabComponent', () => {
  let component: AnamnesisTabComponent;
  let fixture: ComponentFixture<AnamnesisTabComponent>;

  beforeEach(async () => {
    const mockClinicalHistoryService = {
      getAnamnesis: jasmine.createSpy('getAnamnesis').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [AnamnesisTabComponent],
      providers: [
        { provide: ClinicalHistoryService, useValue: mockClinicalHistoryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnamnesisTabComponent);
    component = fixture.componentInstance;
    component.patientId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have aria-label on ellipsis buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('ion-button[fill="clear"][size="small"]');

    // There are 5 ellipsis buttons in the template
    expect(buttons.length).toBe(5);

    buttons.forEach(button => {
      expect(button.getAttribute('aria-label')).toBeTruthy();
      expect(button.getAttribute('aria-label')).toMatch(/Más opciones/);
    });
  });
});
