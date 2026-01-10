import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should store tokens on successful login', () => {
      const mockResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        user: { id: 1, email: 'test@example.com', role: 'admin' }
      };

      service.login('test@example.com', 'password123').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('access_token')).toBe('test-access-token');
        expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      service.login('test@example.com', 'wrongpassword').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return stored access token', () => {
      localStorage.setItem('access_token', 'stored-token');
      expect(service.getToken()).toBe('stored-token');
    });

    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('access_token', 'test-token');
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false when no access token', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', () => {
      localStorage.setItem('refresh_token', 'old-refresh-token');

      const mockResponse = {
        access_token: 'new-access-token'
      };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('access_token')).toBe('new-access-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
