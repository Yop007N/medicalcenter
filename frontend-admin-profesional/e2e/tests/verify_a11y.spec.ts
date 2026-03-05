import { test, expect } from '@playwright/test';

test('verify aria-labels on menu and back buttons', async ({ page }) => {
  // Let's just bypass auth with localStorage for the test if it's too slow, or just go directly
  await page.goto('http://localhost:4200/dashboard');

  // Just wait for the components to mount, the menu button is in the layout
  const dashboardMenuBtn = page.locator('ion-menu-button').first();
  await dashboardMenuBtn.waitFor({ state: 'attached' });
  await expect(dashboardMenuBtn).toHaveAttribute('aria-label', 'Abrir menú principal');

  await page.goto('http://localhost:4200/professionals');
  const menuBtn = page.locator('ion-menu-button').first();
  await expect(menuBtn).toHaveAttribute('aria-label', 'Abrir menú principal');

  await page.goto('http://localhost:4200/professionals/new');
  const profBackBtn = page.locator('ion-back-button').first();
  await profBackBtn.waitFor({ state: 'attached' });
  await expect(profBackBtn).toHaveAttribute('aria-label', 'Volver a la lista');

  await page.goto('http://localhost:4200/patients/new');
  const patBackBtn = page.locator('ion-back-button').first();
  await expect(patBackBtn).toHaveAttribute('aria-label', 'Volver a la lista');

  await page.screenshot({ path: '/tmp/verification.png' });
});
