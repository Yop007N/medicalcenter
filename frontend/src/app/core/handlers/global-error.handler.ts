import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { LoggerService } from '../services/logger.service';

const LOG_SOURCE = 'GlobalErrorHandler';

/**
 * Global error handler that catches all unhandled errors in Angular
 * and logs them to the LoggerService (which sends to backend/doc.log)
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger: LoggerService | null = null;

  constructor(
    private injector: Injector,
    private zone: NgZone
  ) {}

  private getLogger(): LoggerService | null {
    if (!this.logger) {
      try {
        this.logger = this.injector.get(LoggerService);
      } catch {
        // LoggerService not available yet
      }
    }
    return this.logger;
  }

  handleError(error: unknown): void {
    // Run outside Angular zone to avoid triggering change detection
    this.zone.runOutsideAngular(() => {
      const logger = this.getLogger();

      // Extract error details
      let errorMessage = 'Unknown error';
      let errorStack = '';
      let errorName = 'Error';

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack || '';
        errorName = error.name;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      // Log to LoggerService (sends to backend/doc.log)
      if (logger) {
        logger.error(LOG_SOURCE, `${errorName}: ${errorMessage}`, {
          stack: errorStack,
          timestamp: new Date().toISOString()
        });

        // Force flush to ensure error is sent immediately
        logger.flush();
      }

      // Also log to console for development
      console.error('=== GLOBAL ERROR CAUGHT ===');
      console.error('Error:', errorMessage);
      if (errorStack) {
        console.error('Stack:', errorStack);
      }
      console.error('===========================');
    });
  }
}
