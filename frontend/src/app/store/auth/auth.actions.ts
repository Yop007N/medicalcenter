import { createAction, props } from '@ngrx/store';
import { User, LoginRequest, RegisterRequest } from '../../models';

// Login
export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginRequest }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; accessToken: string; refreshToken: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register
export const register = createAction(
  '[Auth] Register',
  props<{ data: RegisterRequest }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

// Load stored auth
export const loadStoredAuth = createAction('[Auth] Load Stored Auth');
export const loadStoredAuthSuccess = createAction(
  '[Auth] Load Stored Auth Success',
  props<{ user: User; accessToken: string }>()
);
export const loadStoredAuthFailure = createAction('[Auth] Load Stored Auth Failure');

// Refresh token
export const refreshToken = createAction('[Auth] Refresh Token');
export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ accessToken: string }>()
);
export const refreshTokenFailure = createAction('[Auth] Refresh Token Failure');

// Clear error
export const clearError = createAction('[Auth] Clear Error');
