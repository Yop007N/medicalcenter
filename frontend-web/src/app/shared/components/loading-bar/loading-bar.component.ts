import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <mat-progress-bar *ngIf="loadingService.loading$ | async"
                      mode="indeterminate"
                      color="accent"
                      class="loading-bar">
    </mat-progress-bar>
  `,
  styles: [`
    .loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
    }
  `]
})
export class LoadingBarComponent {
  constructor(public loadingService: LoadingService) {}
}
