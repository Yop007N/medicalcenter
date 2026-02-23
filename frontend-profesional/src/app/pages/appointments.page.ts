import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Citas</h1>
      <p>Programacion, confirmacion y control de estados de agenda.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Calendario</h2>
          <p class="card-text">Vista de ocupacion diaria y semanal.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Flujo de estado</h2>
          <p class="card-text">Scheduled, confirmed, completed, no_show.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class AppointmentsPage {}
