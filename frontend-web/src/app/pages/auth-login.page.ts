import { Component } from '@angular/core';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-auth-login-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Login</h1>
      <p>Punto de entrada para autenticacion de profesionales.</p>
      <div class="grid">
        <article class="card">
          <h2 class="card-title">Estado actual</h2>
          <p class="card-text">Vista base creada para integrar formulario real.</p>
        </article>
      </div>
    </section>
  `,
  styles: [pageShellStyles]
})
export class AuthLoginPage {}
