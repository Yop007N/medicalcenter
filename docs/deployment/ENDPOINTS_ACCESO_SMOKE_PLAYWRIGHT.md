# Endpoints, Acceso y Smoke Playwright

Actualizado: 2026-02-25

## Objetivo
Consolidar en un solo documento:
- endpoints por actor (frontend + login API),
- credenciales demo operativas,
- validacion rapida con `curl`,
- smoke UI real con Playwright,
- recuperacion basica cuando hay timeout o cambio de IP.

## IP activa del servidor
Antes de probar desde clientes externos, validar IP activa en el host:

```bash
hostname -I
```

No fijar una IP hardcodeada en este documento: puede cambiar por DHCP/VPN.
Usar siempre la IP real obtenida en el momento de la prueba.

## Matriz por actor

### Administrador/Profesional (app principal)
- Frontend: `http://<IP_SERVIDOR>:4200`
- Login API via frontend: `http://<IP_SERVIDOR>:4200/api/auth/login`

### Profesional (web)
- Frontend: `http://<IP_SERVIDOR>`
- Login API via frontend: `http://<IP_SERVIDOR>/api/auth/login`

### Paciente (PWA)
- Frontend: `http://<IP_SERVIDOR>:8100`
- Login API via frontend: `http://<IP_SERVIDOR>:8100/api/auth/login`

### Backend (health directo)
- Health: `http://<IP_SERVIDOR>:5000/health`

## Credenciales demo
- Administrador: `admin@medical.com` / `admin123`
- Profesional: `doctor@medical.com` / `doctor123`
- Paciente: `patient@medical.com` / `patient123`

## Validacion tecnica rapida

### 1) Estado de contenedores
```bash
docker compose ps
```

### 2) Health backend
```bash
curl -i http://localhost:5000/health
```

### 3) Frontends por actor
```bash
curl -i http://localhost/auth/login
curl -i http://localhost:4200/auth/login
curl -i http://localhost:8100/auth/login
```

### 4) Login API por actor
```bash
curl -sS -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doctor@medical.com","password":"doctor123"}'

curl -sS -X POST http://localhost:4200/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@medical.com","password":"admin123"}'

curl -sS -X POST http://localhost:8100/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@medical.com","password":"patient123"}'
```

## Smoke UI real con skill Playwright
Skill: `medical-services-playwright-agent`

### Profesional (host local o remoto)
```bash
BASE_URL=http://<IP_SERVIDOR> \
PRO_EMAIL=doctor@medical.com \
PRO_PASSWORD=doctor123 \
/home/devops/.codex/skills/medical-services-playwright-agent/scripts/run_professional_ui_smoke.sh
```

Si faltan dependencias de navegador en host, ejecutar con contenedor Playwright:

```bash
docker run --rm --network host \
  -e BASE_URL=http://<IP_SERVIDOR> \
  -e PRO_EMAIL=doctor@medical.com \
  -e PRO_PASSWORD=doctor123 \
  -v /tmp/ms-playwright:/work \
  -v /home/devops/.codex/skills/medical-services-playwright-agent/scripts:/work/scripts \
  -w /work \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  node /work/scripts/professional_ui_smoke.mjs
```

### Profesional (suite E2E propia del frontend profesional)
```bash
cd frontend-profesional
BASE_URL=http://<IP_SERVIDOR> \
E2E_PROFESSIONAL_EMAIL=doctor@medical.com \
E2E_PROFESSIONAL_PASSWORD=doctor123 \
npm run e2e:chromium
```

### Admin/Profesional (suite critica frontend principal)
Desde el repo:

```bash
cd frontend-admin-profesional
BASE_URL=http://localhost:4200 \
LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH \
npx playwright test --config=e2e/playwright.config.ts --project=chromium --no-deps e2e/tests/critical-smoke.spec.ts
```

### Paciente (suite E2E propia del PWA)
```bash
cd frontend-paciente
BASE_URL=http://<IP_SERVIDOR>:8100 \
E2E_PATIENT_EMAIL=patient@medical.com \
E2E_PATIENT_PASSWORD=patient123 \
npm run e2e:chromium
```

Si el host no tiene `libasound.so.2` y no hay sudo disponible:

```bash
cd /tmp
apt-get download libasound2
mkdir -p $HOME/.local/playwright-deps
dpkg-deb -x /tmp/libasound2_*.deb $HOME/.local/playwright-deps
```

## Recuperacion rapida ante timeout
Ejecutar en el servidor:

```bash
docker compose down --remove-orphans
docker compose up -d --build
docker compose ps
docker compose logs --tail 120 backend frontend-web frontend-admin frontend-pwa
```

Validar puertos publicados:

```bash
ss -tulpn | grep -E ':80|:4200|:5000|:8100'
```

Si local responde pero externamente falla, validar firewall/routing/VPN:
- regla de acceso a `80`, `4200`, `5000`, `8100`,
- ruta efectiva hacia la IP activa del servidor,
- posible cambio de IP por DHCP.

## Criterio de cierre
- `/health` en `200`.
- frontends responden `200` en login page.
- login API responde token para los 3 actores.
- smoke Playwright profesional en `PASS`.
- smoke Playwright critico admin/profesional (`critical-smoke.spec.ts`) en `PASS`.
