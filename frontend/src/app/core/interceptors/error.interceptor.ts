import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { LoggerService } from '../services/logger.service';

const LOG_SOURCE = 'ErrorInterceptor';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
        logger.error(LOG_SOURCE, 'Client-side error', {
          url: req.url,
          method: req.method,
          message: error.error.message
        });
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'No se puede conectar al servidor. Verifique su conexión.';
            logger.error(LOG_SOURCE, 'Connection error - Server unreachable', {
              url: req.url,
              method: req.method
            });
            break;
          case 400:
            errorMessage = error.error?.msg || error.error?.message || 'Solicitud inválida';
            logger.warn(LOG_SOURCE, `Bad Request (400): ${errorMessage}`, {
              url: req.url,
              method: req.method,
              body: req.body
            });
            break;
          case 401:
            // Handled by auth interceptor
            errorMessage = 'Sesión expirada';
            logger.info(LOG_SOURCE, 'Unauthorized (401) - Session expired', {
              url: req.url
            });
            break;
          case 403:
            errorMessage = 'No tiene permisos para esta acción';
            logger.warn(LOG_SOURCE, 'Forbidden (403) - Access denied', {
              url: req.url,
              method: req.method
            });
            break;
          case 404:
            errorMessage = error.error?.msg || 'Recurso no encontrado';
            logger.warn(LOG_SOURCE, `Not Found (404): ${req.url}`, {
              method: req.method
            });
            break;
          case 409:
            errorMessage = error.error?.msg || 'Conflicto con datos existentes';
            logger.warn(LOG_SOURCE, `Conflict (409): ${errorMessage}`, {
              url: req.url,
              method: req.method
            });
            break;
          case 422:
            errorMessage = error.error?.msg || 'Datos de entrada inválidos';
            logger.warn(LOG_SOURCE, `Validation Error (422): ${errorMessage}`, {
              url: req.url,
              method: req.method,
              errors: error.error?.errors
            });
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            logger.error(LOG_SOURCE, 'Internal Server Error (500)', {
              url: req.url,
              method: req.method,
              error: error.error
            });
            break;
          default:
            errorMessage = error.error?.msg || `Error: ${error.status}`;
            logger.error(LOG_SOURCE, `HTTP Error (${error.status}): ${errorMessage}`, {
              url: req.url,
              method: req.method,
              error: error.error
            });
        }
      }

      // Don't show notification for 401 (handled by auth flow)
      if (error.status !== 401) {
        notification.showError(errorMessage);
      }

      return throwError(() => error);
    })
  );
};
