import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode, APP_INITIALIZER, inject, ErrorHandler } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { GlobalErrorHandler } from './app/core/handlers/global-error.handler';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { reducers } from './app/store';
import { AuthEffects } from './app/store/auth/auth.effects';
import { PatientsEffects } from './app/store/patients/patients.effects';
import { ProfessionalsEffects } from './app/store/professionals/professionals.effects';
import { AppointmentsEffects } from './app/store/appointments/appointments.effects';
import { MedicalRecordsEffects } from './app/store/medical-records/medical-records.effects';
import { BudgetsEffects } from './app/store/budgets/budgets.effects';
import { PaymentsEffects } from './app/store/payments/payments.effects';
import { OdontologyEffects } from './app/store/odontology/odontology.effects';
import { PsychologyEffects } from './app/store/psychology/psychology.effects';
import { PsychopedagogyEffects } from './app/store/psychopedagogy/psychopedagogy.effects';
import { FilesEffects } from './app/store/files/files.effects';
import { ReportsEffects } from './app/store/reports/reports.effects';
import { AuditEffects } from './app/store/audit/audit.effects';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { PwaUpdateService } from './app/core/services/pwa-update.service';
import { ConnectivityService } from './app/core/services/connectivity.service';
import { PushNotificationsService } from './app/core/services/push-notifications.service';

// Initialize app services on app start
function initializeAppServices() {
  return async () => {
    const pwaUpdate = inject(PwaUpdateService);
    const connectivity = inject(ConnectivityService);
    const pushNotifications = inject(PushNotificationsService);

    // Initialize push notifications
    try {
      await pushNotifications.initialize();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }

    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideStore(reducers),
    provideEffects([AuthEffects, PatientsEffects, ProfessionalsEffects, AppointmentsEffects, MedicalRecordsEffects, BudgetsEffects, PaymentsEffects, OdontologyEffects, PsychologyEffects, PsychopedagogyEffects, FilesEffects, ReportsEffects, AuditEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppServices,
      multi: true
    }
  ],
});
