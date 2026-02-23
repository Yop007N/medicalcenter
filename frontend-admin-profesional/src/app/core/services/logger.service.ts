import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: unknown;
}

/**
 * LoggerService - Servicio de logging centralizado
 *
 * Los logs se envían al backend y se guardan en backend/doc.log
 * También se muestran en la consola del navegador para debugging
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private injector = inject(Injector);
  private http: HttpClient | null = null;
  private logBuffer: LogEntry[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 segundos
  private isEnabled = true; // Toggle para habilitar/deshabilitar logs
  private isFlushing = false; // Evitar múltiples flush simultáneos
  private lastFlushTime = 0;
  private readonly MIN_FLUSH_INTERVAL = 10000; // Mínimo 10 segundos entre flush

  constructor() {
    // Iniciar el flush periódico
    this.startPeriodicFlush();

    // Flush al cerrar la ventana
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private getHttp(): HttpClient | null {
    // Lazy load HttpClient para evitar dependencia circular
    if (!this.http) {
      try {
        this.http = this.injector.get(HttpClient);
      } catch {
        // HttpClient no disponible aún
      }
    }
    return this.http;
  }

  private startPeriodicFlush(): void {
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, this.FLUSH_INTERVAL_MS);
    }
  }

  private createEntry(level: LogLevel, source: string, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data
    };
  }

  private addToBuffer(entry: LogEntry): void {
    if (!this.isEnabled) return;

    this.logBuffer.push(entry);

    // Mostrar en consola para desarrollo
    const consoleMsg = `[${entry.level}] [${entry.source}] ${entry.message}`;
    switch (entry.level) {
      case 'ERROR':
        console.error(consoleMsg, entry.data !== undefined ? entry.data : '');
        break;
      case 'WARN':
        console.warn(consoleMsg, entry.data !== undefined ? entry.data : '');
        break;
      case 'INFO':
        console.info(consoleMsg, entry.data !== undefined ? entry.data : '');
        break;
      default:
        console.log(consoleMsg, entry.data !== undefined ? entry.data : '');
    }

    // Flush si el buffer está lleno
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  debug(source: string, message: string, data?: unknown): void {
    this.addToBuffer(this.createEntry('DEBUG', source, message, data));
  }

  info(source: string, message: string, data?: unknown): void {
    this.addToBuffer(this.createEntry('INFO', source, message, data));
  }

  warn(source: string, message: string, data?: unknown): void {
    this.addToBuffer(this.createEntry('WARN', source, message, data));
  }

  error(source: string, message: string, data?: unknown): void {
    this.addToBuffer(this.createEntry('ERROR', source, message, data));
  }

  async flush(): Promise<void> {
    // Verificar si hay logs y si podemos hacer flush
    if (this.logBuffer.length === 0) return;
    if (this.isFlushing) return;

    const now = Date.now();
    if (now - this.lastFlushTime < this.MIN_FLUSH_INTERVAL) {
      // Demasiado pronto, esperar
      return;
    }

    this.isFlushing = true;
    this.lastFlushTime = now;

    // Solo enviar logs importantes (WARN y ERROR) al backend
    const importantLogs = this.logBuffer.filter(log =>
      log.level === 'WARN' || log.level === 'ERROR' || log.level === 'INFO'
    );
    this.logBuffer = [];

    if (importantLogs.length === 0) {
      this.isFlushing = false;
      return;
    }

    const http = this.getHttp();
    if (!http) {
      // Si no hay HttpClient, guardar en localStorage
      this.saveToLocalStorage(importantLogs);
      this.isFlushing = false;
      return;
    }

    try {
      // Enviar logs al backend (no espera respuesta para no bloquear)
      http.post(`${environment.apiUrl}/logs/frontend`, {
        logs: importantLogs
      }).subscribe({
        next: () => {
          this.isFlushing = false;
        },
        error: () => {
          // Si falla, guardar en localStorage como respaldo
          this.saveToLocalStorage(importantLogs);
          this.isFlushing = false;
        }
      });
    } catch {
      this.saveToLocalStorage(importantLogs);
      this.isFlushing = false;
    }
  }

  private saveToLocalStorage(logs: LogEntry[]): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('pendingLogs') || '[]');
      const allLogs = [...existingLogs, ...logs].slice(-500); // Mantener últimos 500
      localStorage.setItem('pendingLogs', JSON.stringify(allLogs));
    } catch {
      // localStorage lleno o no disponible
    }
  }

  // Método para obtener logs del localStorage
  getLocalLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('pendingLogs') || '[]');
    } catch {
      return [];
    }
  }

  // Exportar logs como texto
  exportLogsAsText(): string {
    const logs = this.getLocalLogs();
    return logs.map(log =>
      `[${log.timestamp}] [${log.level}] [${log.source}] ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`
    ).join('\n');
  }

  // Habilitar/deshabilitar logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Limpiar logs locales
  clearLocalLogs(): void {
    localStorage.removeItem('pendingLogs');
  }
}

// Singleton para uso fuera de Angular DI (como en interceptores funcionales)
let loggerInstance: LoggerService | null = null;

export function getLogger(): LoggerService {
  if (!loggerInstance) {
    // Crear una instancia básica para uso temprano
    loggerInstance = new LoggerService();
  }
  return loggerInstance;
}

export function setLoggerInstance(instance: LoggerService): void {
  loggerInstance = instance;
}
