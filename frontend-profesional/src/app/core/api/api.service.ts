import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== null && item !== undefined) {
            httpParams = httpParams.append(key, String(item));
          }
        });
        return;
      }

      httpParams = httpParams.append(key, String(value));
    });

    return httpParams;
  }

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<T>(`${this.API_URL}/${path}`, { params: httpParams });
  }

  getBlob(path: string, params?: Record<string, unknown>): Observable<Blob> {
    const httpParams = this.buildParams(params);
    return this.http.get(`${this.API_URL}/${path}`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  post<T>(path: string, body: any, params?: Record<string, unknown>): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.post<T>(`${this.API_URL}/${path}`, body, { params: httpParams });
  }

  put<T>(path: string, body: any, params?: Record<string, unknown>): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.put<T>(`${this.API_URL}/${path}`, body, { params: httpParams });
  }

  delete<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.delete<T>(`${this.API_URL}/${path}`, { params: httpParams });
  }
}
