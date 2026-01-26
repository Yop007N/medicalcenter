import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let store: MockStore;
  const initialState = {
    auth: {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage, BrowserAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState,
          selectors: [
            { selector: selectAuthLoading, value: false },
            { selector: selectAuthError, value: null }
          ]
        })
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a form with email and password fields', () => {
    const emailInput = fixture.nativeElement.querySelector('ion-input[formControlName="email"]');
    const passwordInput = fixture.nativeElement.querySelector('ion-input[formControlName="password"]');
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    component.showPassword = false;
    fixture.detectChanges();

    // Initial state: password hidden
    let passwordInput = fixture.nativeElement.querySelector('ion-input[formControlName="password"]');
    expect(passwordInput.getAttribute('type')).toBe('password'); // Note: ion-input might wrap the native input, checking component property might be safer but attribute check is okay for now if it reflects on the host or checking the binding.
    // Actually, [type] binding on ion-input updates the property.

    component.showPassword = true;
    fixture.detectChanges();
    expect(passwordInput.getAttribute('type')).toBe('text'); // Or check component instance property if accessible
  });
});
