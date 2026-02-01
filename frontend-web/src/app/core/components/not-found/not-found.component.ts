import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
      <a routerLink="/dashboard" class="home-button">Return to Dashboard</a>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 20px;
      color: #333;
    }
    h1 {
      font-size: 6rem;
      margin: 0;
      color: #3f51b5;
    }
    h2 {
      font-size: 2rem;
      margin: 10px 0;
    }
    p {
      font-size: 1.2rem;
      margin-bottom: 30px;
      color: #666;
    }
    .home-button {
      background-color: #3f51b5;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.3s;
    }
    .home-button:hover {
      background-color: #303f9f;
    }
    .home-button:focus-visible {
      outline: 2px solid #ff4081;
      outline-offset: 2px;
    }
  `]
})
export class NotFoundComponent {}
