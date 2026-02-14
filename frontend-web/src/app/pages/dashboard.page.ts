import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Dashboard</h1>
      <p>Resumen operativo para gestionar actividad clinica y financiera.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Actividad reciente</h2>
          <p class="card-text">Citas, pagos y archivos.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Indicadores</h2>
          <p class="card-text">Pacientes activos y productividad.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Alertas</h2>
          <p class="card-text">Eventos pendientes de atencion.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class DashboardPage {}
