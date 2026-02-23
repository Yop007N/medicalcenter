import { Injectable, inject } from '@angular/core';
import { ToastController, AlertController, LoadingController, ModalController } from '@ionic/angular/standalone';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { ErrorModalComponent } from '../../shared/components/error-modal/error-modal.component';
import { WarningModalComponent } from '../../shared/components/warning-modal/warning-modal.component';
import { InfoModalComponent } from '../../shared/components/info-modal/info-modal.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private modalController = inject(ModalController);

  private currentLoading: HTMLIonLoadingElement | null = null;

  async showSuccess(message: string, duration = 3000): Promise<void> {
    const modal = await this.modalController.create({
      component: SuccessModalComponent,
      componentProps: { message },
      cssClass: 'notification-modal-wrapper',
      backdropDismiss: true
    });

    await modal.present();

    setTimeout(() => {
      modal.dismiss();
    }, 2500);
  }

  async showError(message: string, duration = 4000): Promise<void> {
    const modal = await this.modalController.create({
      component: ErrorModalComponent,
      componentProps: { message },
      cssClass: 'notification-modal-wrapper',
      backdropDismiss: true
    });

    await modal.present();

    setTimeout(() => {
      modal.dismiss();
    }, duration);
  }

  async showWarning(message: string, duration = 3500): Promise<void> {
    const modal = await this.modalController.create({
      component: WarningModalComponent,
      componentProps: { message },
      cssClass: 'notification-modal-wrapper',
      backdropDismiss: true
    });

    await modal.present();

    setTimeout(() => {
      modal.dismiss();
    }, duration);
  }

  async showInfo(message: string, duration = 3000): Promise<void> {
    const modal = await this.modalController.create({
      component: InfoModalComponent,
      componentProps: { message },
      cssClass: 'notification-modal-wrapper',
      backdropDismiss: true
    });

    await modal.present();

    setTimeout(() => {
      modal.dismiss();
    }, duration);
  }

  async confirm(header: string, message: string, confirmText = 'Confirmar'): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  async showLoading(message = 'Cargando...'): Promise<void> {
    if (this.currentLoading) {
      await this.currentLoading.dismiss();
    }
    this.currentLoading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await this.currentLoading.present();
  }

  async hideLoading(): Promise<void> {
    if (this.currentLoading) {
      await this.currentLoading.dismiss();
      this.currentLoading = null;
    }
  }
}
