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

  it('should initially not be loading', (done) => {
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });

  it('should be loading after show() is called', (done) => {
    service.show();
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeTrue();
      done();
    });
  });

  it('should not be loading after show() then hide() is called', (done) => {
    service.show();
    service.hide();
    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });
  });

  it('should handle nested loading correctly', (done) => {
    service.show(); // count 1
    service.show(); // count 2
    service.hide(); // count 1

    service.loading$.pipe(take(1)).subscribe(loading => {
      expect(loading).toBeTrue();

      service.hide(); // count 0
      service.loading$.pipe(take(1)).subscribe(finalLoading => {
        expect(finalLoading).toBeFalse();
        done();
      });
    });
  });
});
