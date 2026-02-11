import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingBarComponent } from './loading-bar.component';
import { LoadingService } from '../../../core/services/loading.service';
import { BehaviorSubject } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';

describe('LoadingBarComponent', () => {
  let component: LoadingBarComponent;
  let fixture: ComponentFixture<LoadingBarComponent>;
  let loadingServiceMock: any;
  let loadingSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    loadingSubject = new BehaviorSubject<boolean>(false);
    loadingServiceMock = {
      loading$: loadingSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [LoadingBarComponent, MatProgressBarModule],
      providers: [
        { provide: LoadingService, useValue: loadingServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show progress bar initially', () => {
    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeNull();
  });

  it('should show progress bar when loading is true', () => {
    loadingSubject.next(true);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
  });
});
