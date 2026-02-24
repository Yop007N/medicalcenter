import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStoreService } from './session-store.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStoreService);
  const token = sessionStore.getAccessToken();
  const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  if (token && !isAuthRequest) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
