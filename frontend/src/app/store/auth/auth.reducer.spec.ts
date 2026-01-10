import { authReducer, initialState, AuthState } from './auth.reducer';
import * as AuthActions from './auth.actions';

describe('Auth Reducer', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'admin' as const,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' };
      const state = authReducer(undefined, action);
      expect(state).toBe(initialState);
    });
  });

  describe('login action', () => {
    it('should set loading to true on login', () => {
      const action = AuthActions.login({ email: 'test@example.com', password: 'password' });
      const state = authReducer(initialState, action);

      expect(state.loading).toBeTrue();
      expect(state.error).toBeNull();
    });
  });

  describe('loginSuccess action', () => {
    it('should set user and tokens on login success', () => {
      const action = AuthActions.loginSuccess({
        user: mockUser,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      });

      const state = authReducer(initialState, action);

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBeTrue();
      expect(state.loading).toBeFalse();
      expect(state.error).toBeNull();
    });
  });

  describe('loginFailure action', () => {
    it('should set error on login failure', () => {
      const action = AuthActions.loginFailure({ error: 'Invalid credentials' });
      const state = authReducer(initialState, action);

      expect(state.error).toBe('Invalid credentials');
      expect(state.loading).toBeFalse();
      expect(state.isAuthenticated).toBeFalse();
    });
  });

  describe('logout action', () => {
    it('should reset state on logout', () => {
      const loggedInState: AuthState = {
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null
      };

      const action = AuthActions.logout();
      const state = authReducer(loggedInState, action);

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBeFalse();
    });
  });

  describe('loadUserFromStorage action', () => {
    it('should set loading to true when loading from storage', () => {
      const action = AuthActions.loadUserFromStorage();
      const state = authReducer(initialState, action);

      expect(state.loading).toBeTrue();
    });
  });

  describe('loadUserFromStorageSuccess action', () => {
    it('should set user from storage', () => {
      const action = AuthActions.loadUserFromStorageSuccess({ user: mockUser });
      const state = authReducer(initialState, action);

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBeTrue();
      expect(state.loading).toBeFalse();
    });
  });

  describe('loadUserFromStorageFailure action', () => {
    it('should set error when storage load fails', () => {
      const action = AuthActions.loadUserFromStorageFailure({ error: 'No token found' });
      const state = authReducer(initialState, action);

      expect(state.loading).toBeFalse();
      expect(state.isAuthenticated).toBeFalse();
    });
  });
});
