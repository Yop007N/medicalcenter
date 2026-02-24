import { Injectable } from '@angular/core';

export interface SessionUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionStoreService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly CURRENT_USER_KEY = 'currentUser';

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): SessionUser | null {
    const raw = localStorage.getItem(this.CURRENT_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      this.clear();
      return null;
    }
  }

  storeSession(payload: {
    accessToken: string;
    refreshToken: string;
    user: SessionUser;
  }): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, payload.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, payload.refreshToken);
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(payload.user));
  }

  clear(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }
}
