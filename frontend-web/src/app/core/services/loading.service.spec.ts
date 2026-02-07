import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should manage loading state correctly', () => {
    let currentState: boolean | undefined;
    service.loading$.subscribe(loading => currentState = loading);

    expect(currentState).toBeFalse(); // Initial state

    service.show();
    expect(currentState).toBeTrue();

    service.hide();
    expect(currentState).toBeFalse();
  });

  it('should handle multiple requests', () => {
    let currentState: boolean | undefined;
    service.loading$.subscribe(loading => currentState = loading);

    service.show(); // activeRequests = 1
    expect(currentState).toBeTrue();

    service.show(); // activeRequests = 2
    expect(currentState).toBeTrue();

    service.hide(); // activeRequests = 1
    expect(currentState).toBeTrue();

    service.hide(); // activeRequests = 0
    expect(currentState).toBeFalse();
  });
});
