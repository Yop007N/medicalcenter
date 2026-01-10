import { Injectable, inject, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { filter, first, interval, concat } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private appRef = inject(ApplicationRef);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.initUpdateChecks();
      this.listenForUpdates();
    }
  }

  private initUpdateChecks(): void {
    // Check for updates when app becomes stable, then every 6 hours
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(async () => {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        if (updateFound) {
          console.log('Update available');
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });
  }

  private listenForUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(async (evt) => {
        console.log('Current version:', evt.currentVersion);
        console.log('Available version:', evt.latestVersion);
        await this.promptUpdate();
      });

    // Handle unrecoverable state
    this.swUpdate.unrecoverable.subscribe(async (event) => {
      console.error('SW unrecoverable state:', event.reason);
      await this.showUnrecoverableAlert();
    });
  }

  private async promptUpdate(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Actualización disponible',
      message: 'Hay una nueva versión de la aplicación disponible. ¿Desea actualizar ahora?',
      buttons: [
        {
          text: 'Más tarde',
          role: 'cancel'
        },
        {
          text: 'Actualizar',
          handler: () => {
            this.applyUpdate();
          }
        }
      ]
    });

    await alert.present();
  }

  private async applyUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();

      const toast = await this.toastController.create({
        message: 'Actualización instalada. Recargando...',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      // Reload after toast
      setTimeout(() => {
        document.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Failed to apply update:', err);

      const toast = await this.toastController.create({
        message: 'Error al actualizar. Por favor, recargue manualmente.',
        duration: 4000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  private async showUnrecoverableAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Error de aplicación',
      message: 'Ha ocurrido un error. La aplicación necesita recargarse.',
      buttons: [
        {
          text: 'Recargar',
          handler: () => {
            document.location.reload();
          }
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (err) {
      console.error('Error checking for update:', err);
      return false;
    }
  }
}
