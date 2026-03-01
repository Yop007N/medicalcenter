import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export type UiDialogMode = 'confirm' | 'prompt';

export interface UiDialogData {
  mode: UiDialogMode;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  placeholder?: string;
  inputLabel?: string;
  initialValue?: string;
  required?: boolean;
}

@Component({
  selector: 'app-ui-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  template: `
    <section class="dialog">
      <h2 class="dialog__title">{{ data.title }}</h2>
      <p class="dialog__message">{{ data.message }}</p>

      @if (isPromptMode) {
        <label class="dialog__label">
          {{ data.inputLabel || 'Valor' }}
          <input
            type="text"
            class="dialog__input"
            [attr.placeholder]="data.placeholder || ''"
            [formControl]="promptControl"
          />
        </label>
        @if (promptControl.touched && promptControl.invalid) {
          <p class="dialog__error">Este campo es obligatorio.</p>
        }
      }

      <div class="dialog__actions">
        <button type="button" class="dialog__button dialog__button--ghost" (click)="cancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          type="button"
          class="dialog__button"
          [class.dialog__button--danger]="data.destructive"
          [disabled]="isPromptMode && promptControl.invalid"
          (click)="confirm()"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dialog {
        background: #ffffff;
        border-radius: 12px;
        max-width: 440px;
        min-width: min(420px, calc(100vw - 2rem));
        padding: 1rem;
      }

      .dialog__title {
        color: #12263a;
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0 0 0.4rem;
      }

      .dialog__message {
        color: #4a5d70;
        font-size: 0.9rem;
        margin: 0 0 0.85rem;
      }

      .dialog__label {
        color: #223a4f;
        display: flex;
        flex-direction: column;
        font-size: 0.82rem;
        font-weight: 600;
        gap: 0.35rem;
      }

      .dialog__input {
        border: 1px solid #c7d2de;
        border-radius: 10px;
        font-size: 0.92rem;
        outline: none;
        padding: 0.5rem 0.65rem;
      }

      .dialog__input:focus {
        border-color: #3e6e8f;
        box-shadow: 0 0 0 2px rgba(62, 110, 143, 0.14);
      }

      .dialog__error {
        color: #b64545;
        font-size: 0.78rem;
        margin: 0.45rem 0 0;
      }

      .dialog__actions {
        display: flex;
        gap: 0.6rem;
        justify-content: flex-end;
        margin-top: 1rem;
      }

      .dialog__button {
        background: #3e6e8f;
        border: 1px solid #3e6e8f;
        border-radius: 9px;
        color: #ffffff;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.9rem;
      }

      .dialog__button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .dialog__button--ghost {
        background: transparent;
        color: #3e6e8f;
      }

      .dialog__button--danger {
        background: #be4a4a;
        border-color: #be4a4a;
      }
    `
  ]
})
export class UiDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UiDialogComponent, boolean | string | null>);
  readonly data = inject<UiDialogData>(MAT_DIALOG_DATA);

  readonly promptControl = new FormControl<string>(
    this.data.initialValue ?? '',
    this.data.required ? [Validators.required] : []
  );

  get isPromptMode(): boolean {
    return this.data.mode === 'prompt';
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    if (this.isPromptMode) {
      this.promptControl.markAsTouched();
      if (this.promptControl.invalid) {
        return;
      }
      this.dialogRef.close(this.promptControl.value ?? '');
      return;
    }
    this.dialogRef.close(true);
  }
}
