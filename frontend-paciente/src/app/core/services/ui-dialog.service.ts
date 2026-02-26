import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

export type PromptTextOptions = {
  header: string;
  message?: string;
  placeholder?: string;
  value?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
};

@Injectable({
  providedIn: 'root'
})
export class UiDialogService {
  constructor(private alertController: AlertController) {}

  async promptText(options: PromptTextOptions): Promise<string | null> {
    const alert = await this.alertController.create({
      cssClass: 'patient-alert',
      header: options.header,
      message: options.message,
      backdropDismiss: false,
      inputs: [
        {
          name: 'text',
          type: options.multiline ? 'textarea' : 'text',
          value: options.value ?? '',
          placeholder: options.placeholder ?? '',
          attributes: {
            maxlength: String(options.maxLength ?? 250)
          }
        }
      ],
      buttons: [
        {
          text: options.cancelText ?? 'Cancelar',
          role: 'cancel',
          cssClass: 'patient-alert__cancel'
        },
        {
          text: options.confirmText ?? 'Aceptar',
          role: 'confirm',
          cssClass: 'patient-alert__confirm',
          handler: (payload: { text?: string }) => {
            const value = (payload?.text ?? '').trim();
            if (options.required && !value) {
              return false;
            }
            return true;
          }
        }
      ]
    });

    await alert.present();
    const result = await alert.onDidDismiss<unknown>();
    if (result.role !== 'confirm') {
      return null;
    }

    const payload = result.data;
    if (typeof payload === 'string') {
      return payload.trim();
    }

    if (payload && typeof payload === 'object' && 'values' in payload) {
      const values = (payload as { values?: { text?: unknown } }).values;
      if (values && typeof values.text === 'string') {
        return values.text.trim();
      }
    }

    return '';
  }
}
