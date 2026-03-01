import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { UiDialogComponent } from '../components/ui-dialog/ui-dialog.component';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type PromptOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  inputLabel?: string;
  initialValue?: string;
  required?: boolean;
};

@Injectable({ providedIn: 'root' })
export class UiDialogService {
  private readonly dialog = inject(MatDialog);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const dialogRef = this.dialog.open(UiDialogComponent, {
      data: {
        mode: 'confirm',
        ...options
      },
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      maxWidth: 'calc(100vw - 1rem)'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }

  async prompt(options: PromptOptions): Promise<string | null> {
    const dialogRef = this.dialog.open(UiDialogComponent, {
      data: {
        mode: 'prompt',
        ...options
      },
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      maxWidth: 'calc(100vw - 1rem)'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (typeof result !== 'string') {
      return null;
    }
    return result;
  }
}
