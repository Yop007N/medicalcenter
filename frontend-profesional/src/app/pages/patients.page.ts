import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Pacientes</h1>
      <p>Gestion de perfiles, contacto y seguimiento clinico.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Registro</h2>
          <p class="card-text">Alta y edicion de datos.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Historial</h2>
          <p class="card-text">Acceso rapido a registros y citas.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class PatientsPage {}
