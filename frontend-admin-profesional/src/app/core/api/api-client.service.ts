import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type ApiClientOptions = {
  headers?: Record<string, string>;
};

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, unknown>, options?: ApiClientOptions): Observable<T> {
    return this.http.get<T>(this.url(path), {
      params: this.buildHttpParams(params),
      headers: options?.headers
    });
  }

  getBlob(path: string, params?: Record<string, unknown>, options?: ApiClientOptions): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: this.buildHttpParams(params),
      headers: options?.headers,
      responseType: 'blob'
    });
  }

  post<T>(path: string, body: unknown, options?: ApiClientOptions): Observable<T> {
    return this.http.post<T>(this.url(path), body, {
      headers: options?.headers
    });
  }

  put<T>(path: string, body: unknown, options?: ApiClientOptions): Observable<T> {
    return this.http.put<T>(this.url(path), body, {
      headers: options?.headers
    });
  }

  patch<T>(path: string, body: unknown, options?: ApiClientOptions): Observable<T> {
    return this.http.patch<T>(this.url(path), body, {
      headers: options?.headers
    });
  }

  delete<T>(path: string, options?: ApiClientOptions): Observable<T> {
    return this.http.delete<T>(this.url(path), {
      headers: options?.headers
    });
  }

  request<T>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: ApiClientOptions
  ): Observable<T> {
    switch (method) {
      case 'POST':
        return this.post<T>(path, body ?? {}, options);
      case 'PUT':
        return this.put<T>(path, body ?? {}, options);
      case 'PATCH':
        return this.patch<T>(path, body ?? {}, options);
      case 'DELETE':
        return this.delete<T>(path, options);
    }
  }

  private url(path: string): string {
    const normalizedPath = path.replace(/^\/+/, '');
    return `${this.baseUrl}/${normalizedPath}`;
  }

  private buildHttpParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
