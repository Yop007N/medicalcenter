import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    @if (loadingService.loading$ | async) {
      <mat-progress-bar
        mode="indeterminate"
        class="global-loader">
      </mat-progress-bar>
    }
  `,
  styles: [`
    .global-loader {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
    }
  `]
})
export class LoadingBarComponent {
  loadingService = inject(LoadingService);
}
