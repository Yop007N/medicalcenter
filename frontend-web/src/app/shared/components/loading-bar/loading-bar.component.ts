import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="loader-container" *ngIf="loadingService.loading$ | async">
      <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
    </div>
  `,
  styles: [`
    .loader-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 9999;
    }
  `]
})
export class LoadingBarComponent {
  public loadingService = inject(LoadingService);
}
