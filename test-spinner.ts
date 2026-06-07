import { Component } from '@angular/core';

@Component({
  selector: 'test-spinner',
  template: `
    <ion-button>
      <ion-spinner slot="start"></ion-spinner>
      Iniciando...
    </ion-button>
  `
})
export class TestSpinner {}
