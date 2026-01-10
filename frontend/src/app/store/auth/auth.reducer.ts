import { createReducer, on } from '@ngrx/store';
import { User } from '../../models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

export const authReducer = createReducer(
  initialState,

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user, accessToken, refreshToken }) => ({
    ...state,
    user,
    accessToken,
    refreshToken,
    loading: false,
    error: null,
    isAuthenticated: true
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),

  // Register
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.registerSuccess, (state) => ({
    ...state,
    loading: false,
    error: null
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true
  })),

  on(AuthActions.logoutSuccess, () => initialState),

  // Load stored auth
  on(AuthActions.loadStoredAuthSuccess, (state, { user, accessToken }) => ({
    ...state,
    user,
    accessToken,
    isAuthenticated: true
  })),

  on(AuthActions.loadStoredAuthFailure, () => initialState),

  // Refresh token
  on(AuthActions.refreshTokenSuccess, (state, { accessToken }) => ({
    ...state,
    accessToken
  })),

  on(AuthActions.refreshTokenFailure, () => initialState),

  // Clear error
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);
