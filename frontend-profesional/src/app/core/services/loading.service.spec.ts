import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';
import { take } from 'rxjs/operators';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with loading false', (done) => {
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });

  it('should show loading', (done) => {
    service.show();
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeTrue();
      done();
    });
  });

  it('should hide loading', (done) => {
    service.show();
    service.hide();
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });

  it('should handle multiple show/hide calls', (done) => {
    service.show();
    service.show();
    service.hide();

    // Still one pending
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeTrue();

      service.hide();
      service.loading$.pipe(take(1)).subscribe(loading2 => {
        expect(loading2).toBeFalse();
        done();
      });
    });
  });
});
