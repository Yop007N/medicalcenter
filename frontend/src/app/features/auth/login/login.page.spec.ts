import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideMockStore({
          initialState: {
            auth: {
              loading: false,
              error: null
            }
          }
        }),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a button for password toggle with accessible label', () => {
    // We search for the element that toggles password
    // We look for .toggle-password class which is currently on the icon
    // But we expect it to be on a button after fix, or we search for the button wrapping it.
    // In my plan, I said I would replace the icon with a button having that class.

    const toggleBtn = fixture.debugElement.query(By.css('.toggle-password'));

    // It should exist
    expect(toggleBtn).withContext('Toggle password element should exist').toBeTruthy();

    if (toggleBtn) {
        // It should be a button element
        const tagName = toggleBtn.nativeElement.tagName.toLowerCase();
        expect(tagName).withContext('Toggle password element should be a <button>').toBe('button');

        // It should have an aria-label
        const ariaLabel = toggleBtn.nativeElement.getAttribute('aria-label');
        expect(ariaLabel).withContext('Button should have aria-label').toBeTruthy();
        // Initial state: showPassword = false, so we want to "Show password" -> "Mostrar contraseña"
        expect(ariaLabel).withContext('aria-label should be "Mostrar contraseña" initially').toBe('Mostrar contraseña');
    }
  });
});
