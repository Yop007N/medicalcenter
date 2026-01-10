@echo off
echo ================================================
echo   Deteniendo PostgreSQL y pgAdmin...
echo ================================================
echo.

docker-compose -f docker-compose.db.yml stop

echo.
echo ================================================
echo   Servicios detenidos correctamente!
echo ================================================
echo.
pause
