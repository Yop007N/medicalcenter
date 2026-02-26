import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { ResponsiveSelectService } from './core/services/responsive-select.service';
import * as AuthActions from './store/auth/auth.actions';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly responsiveSelectService = inject(ResponsiveSelectService);
  private readonly store = inject(Store);

  constructor() {
    this.responsiveSelectService.start();
    // Ensure NgRx auth state is rehydrated after reload/update.
    this.store.dispatch(AuthActions.loadStoredAuth());
  }
}
