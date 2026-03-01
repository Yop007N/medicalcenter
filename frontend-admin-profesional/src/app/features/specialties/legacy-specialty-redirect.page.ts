import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { resolveSpecialtyFrontendRoute } from '../../core/constants/specialty-navigation';

@Component({
  selector: 'app-legacy-specialty-redirect-page',
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner],
  template: `
    <ion-content class="redirect-page ion-padding">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Redirigiendo módulo de especialidad...</p>
    </ion-content>
  `,
  styles: [
    `
      .redirect-page {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
        min-height: 40vh;
      }
    `,
  ],
})
export class LegacySpecialtyRedirectPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const specialtyKey = this.route.snapshot.paramMap.get('specialtyKey');
    const targetRoute = resolveSpecialtyFrontendRoute(specialtyKey);
    void this.router.navigateByUrl(targetRoute, { replaceUrl: true });
  }
}

