# Ejecucion Autonoma por Olas

Este flujo ejecuta trabajo continuo por resultados medibles (`PASS/FAIL`) sin aprobaciones manuales intermedias.

## Olas disponibles

- `ola 1`:
  - base tecnica (tracks `D1/D2`) + build de los 3 frontends.
- `ola 2`:
  - scope por especialidad + smoke E2E por actor.
- `ola N`:
  - matriz E2E consolidada + healthchecks de backend/frontends.

## Script orquestador

Archivo: `scripts/orchestration/wave_orchestrator.py`

Salida de evidencia:
- reportes markdown/json: `docs/development/wave_reports/`
- logs por tarea: `docs/development/wave_reports/logs/`

## Comandos rapidos

```bash
npm run waves:1
```

```bash
npm run waves:2
```

```bash
npm run waves:n
```

```bash
npm run waves:all
```

## Modo continuo (sin fin)

```bash
npm run waves:autonomous
```

`waves:autonomous` ejecuta ciclos infinitos (`--loop --cycles 0`) y corta solo si el proceso se detiene manualmente.

## Variables utiles

- `BASE_URL_BACKEND` (default: `http://127.0.0.1:5000`)
- `BASE_URL_ADMIN` (default: `http://127.0.0.1:4200`)
- `BASE_URL_PROF` (default: `http://127.0.0.1`)
- `BASE_URL_PWA` (default: `http://127.0.0.1:8100`)

Ejemplo contra IP remota:

```bash
BASE_URL_BACKEND=http://10.4.33.184:5000 \
BASE_URL_ADMIN=http://10.4.33.184:4200 \
BASE_URL_PROF=http://10.4.33.184 \
BASE_URL_PWA=http://10.4.33.184:8100 \
npm run waves:2
```

## Criterio operativo

- cada tarea se marca `PASS` o `FAIL`;
- si una tarea falla y no se usa `--continue-on-error`, se frena la ola;
- siempre se genera reporte final con evidencia y ruta de logs.
