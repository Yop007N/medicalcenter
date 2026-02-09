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

  it('should show loading initially as false', (done) => {
    service.loading$.subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });

  it('should show loading as true when show() is called', (done) => {
    service.show();
    service.loading$.subscribe(loading => {
      expect(loading).toBeTrue();
      done();
    });
  });

  it('should show loading as false when hide() is called after show()', (done) => {
    service.show();
    service.hide();
    service.loading$.subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });

  it('should handle multiple requests correctly', (done) => {
    service.show();
    service.show();
    service.hide();

    // Should still be true
    const sub1 = service.loading$.subscribe(loading => {
      expect(loading).toBeTrue();
    });
    sub1.unsubscribe();

    service.hide();
    service.loading$.subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });
});
