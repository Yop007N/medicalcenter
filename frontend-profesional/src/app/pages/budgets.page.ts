import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Presupuestos</h1>
      <p>Creacion, seguimiento y estados de presupuestos clinicos.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Items y costos</h2>
          <p class="card-text">Detalle por tratamiento y total.</p>
        </article>
        <article class="card">
          <h2 class="card-title">Ciclo comercial</h2>
          <p class="card-text">Draft, sent, accepted, rejected.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class BudgetsPage {}
