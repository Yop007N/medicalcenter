import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { authGuard } from './auth.guard';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

describe('AuthGuard', () => {
  let store: MockStore;
  let router: jasmine.SpyObj<Router>;

  const initialState = {
    auth: {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    }
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        provideMockStore({ initialState }),
        { provide: Router, useValue: routerSpy }
      ]
    });

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('should allow access when user is authenticated', (done) => {
    store.overrideSelector(selectIsAuthenticated, true);

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);

      if (result instanceof Promise) {
        result.then(value => {
          expect(value).toBeTrue();
          done();
        });
      } else if ('subscribe' in result) {
        result.subscribe(value => {
          expect(value).toBeTrue();
          done();
        });
      } else {
        expect(result).toBeTrue();
        done();
      }
    });
  });

  it('should redirect to login when user is not authenticated', (done) => {
    store.overrideSelector(selectIsAuthenticated, false);
    router.createUrlTree.and.returnValue({} as any);

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);

      if (result instanceof Promise) {
        result.then(() => {
          expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
          done();
        });
      } else if ('subscribe' in result) {
        result.subscribe(() => {
          expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
          done();
        });
      } else {
        expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
        done();
      }
    });
  });
});
