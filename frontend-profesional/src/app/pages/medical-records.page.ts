import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-medical-records-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Registros Medicos</h1>
      <p>Consulta y gestion de historial clinico por paciente.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Episodios</h2>
          <p class="card-text">Diagnostico, notas y seguimiento.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Archivos asociados</h2>
          <p class="card-text">Documentos y estudios anexos.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class MedicalRecordsPage {}
