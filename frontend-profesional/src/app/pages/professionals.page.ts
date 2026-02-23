import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-professionals-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Profesionales</h1>
      <p>Gestion de plantilla clinica, especialidades y estado operativo.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Listado</h2>
          <p class="card-text">Busqueda y filtros de profesionales.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Disponibilidad</h2>
          <p class="card-text">Control de franjas y ocupacion.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class ProfessionalsPage {}
