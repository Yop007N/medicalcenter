# E2E Tests - Medical Services

Tests End-to-End con **Playwright** para la aplicación Medical Services.

## Estructura

```
e2e/
├── pages/                    # Page Object Models
│   ├── base.page.ts         # Clase base con métodos comunes
│   ├── login.page.ts        # POM para login
│   ├── register.page.ts     # POM para registro
│   ├── dashboard.page.ts    # POM para dashboard
│   ├── patients.page.ts     # POM para pacientes
│   ├── appointments.page.ts # POM para citas
│   └── index.ts             # Exports
├── tests/
│   ├── fixtures/
│   │   └── test-data.ts     # Datos de prueba
│   ├── auth.setup.ts        # Setup de autenticación
│   ├── auth.spec.ts         # Tests de autenticación
│   ├── patients.spec.ts     # Tests de pacientes
│   ├── appointments.spec.ts # Tests de citas
│   ├── dashboard.spec.ts    # Tests de dashboard
│   └── visual-regression.spec.ts # Tests visuales
├── playwright.config.ts     # Configuración de Playwright
├── tsconfig.json           # Configuración de TypeScript
└── README.md               # Esta documentación
```

## Instalación

```bash
# Instalar dependencias del proyecto
cd frontend-admin-profesional
npm install

# Instalar navegadores de Playwright
npm run e2e:install
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run e2e` | Ejecuta todos los tests |
| `npm run e2e:ui` | Abre UI interactiva de Playwright |
| `npm run e2e:headed` | Ejecuta tests con navegador visible |
| `npm run e2e:debug` | Ejecuta tests en modo debug |
| `npm run e2e:chromium` | Solo tests en Chrome |
| `npm run e2e:firefox` | Solo tests en Firefox |
| `npm run e2e:webkit` | Solo tests en Safari |
| `npm run e2e:mobile` | Tests en viewport móvil |
| `npm run e2e:report` | Ver reporte HTML |
| `npm run e2e:codegen` | Generador de código |

## Ejecutar Tests Específicos

```bash
# Ejecutar un archivo específico
npx playwright test auth.spec.ts

# Ejecutar un test específico
npx playwright test -g "should display login page"

# Ejecutar tests con tag
npx playwright test --grep @smoke
```

## Page Object Model (POM)

Cada página tiene su clase POM correspondiente:

```typescript
import { LoginPage } from '../pages';

test('ejemplo', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@test.com', 'password');
  await loginPage.expectLoginSuccess();
});
```

## Test Data

Los datos de prueba están centralizados en `tests/fixtures/test-data.ts`:

```typescript
import { TestUsers, TestPatients, generateUniqueEmail } from './fixtures/test-data';

// Usar usuario predefinido
await loginPage.login(TestUsers.admin.email, TestUsers.admin.password);

// Generar email único para cada test
const email = generateUniqueEmail('patient');
```

## Visual Regression Testing

Los tests de regresión visual generan screenshots automáticamente:

```bash
# Primera ejecución: genera baseline
npm run e2e -- --update-snapshots

# Ejecuciones posteriores: compara con baseline
npm run e2e
```

## Configuración de Entorno

Variables de entorno disponibles:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `BASE_URL` | URL base de la aplicación | `http://localhost:4200` |
| `CI` | Modo CI (más retries, menos paralelo) | `false` |

```bash
# Ejemplo con URL diferente
BASE_URL=https://staging.example.com npm run e2e
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run e2e
  env:
    CI: true

- name: Upload Report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: e2e/playwright-report/
```

## Mejores Prácticas

1. **Usar Page Objects**: Encapsular selectores y acciones
2. **Datos únicos**: Usar `generateUniqueEmail()` para evitar conflictos
3. **Esperas explícitas**: Usar `waitForLoadingComplete()` en lugar de `waitForTimeout`
4. **Tests independientes**: Cada test debe poder ejecutarse solo
5. **Limpiar datos**: Considerar cleanup después de tests de creación

## Troubleshooting

### Tests fallan intermitentemente

```bash
# Aumentar timeout
npx playwright test --timeout=60000

# Ejecutar con más retries
npx playwright test --retries=3
```

### Problemas de autenticación

```bash
# Regenerar auth state
rm -rf playwright/.auth
npm run e2e
```

### Ver qué está pasando

```bash
# Modo debug con pausa
npx playwright test --debug

# Con navegador visible
npm run e2e:headed
```
