import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectAccessToken = createSelector(
  selectAuthState,
  (state) => state.accessToken
);

export const selectUserRole = createSelector(
  selectUser,
  (user) => user?.role
);

export const selectIsAdmin = createSelector(
  selectUserRole,
  (role) => role === 'admin'
);

export const selectIsProfessional = createSelector(
  selectUserRole,
  (role) => role === 'professional'
);

export const selectIsPatient = createSelector(
  selectUserRole,
  (role) => role === 'patient'
);
