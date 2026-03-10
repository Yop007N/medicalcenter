@echo off
echo ================================================
echo   Medical Services - Database Setup
echo ================================================
echo.

echo [1/3] Levantando PostgreSQL y pgAdmin con Docker...
docker-compose -f docker-compose.db.yml up -d

echo.
echo [2/3] Esperando a que PostgreSQL este listo...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Verificando servicios...
docker-compose -f docker-compose.db.yml ps

echo.
echo ================================================
echo   Servicios levantados correctamente!
echo ================================================
echo.
echo   PostgreSQL:  localhost:5432
echo     - Database: medical_services_dev
echo     - User:     medical_user
echo     - Password: medical_pass_2024
echo.
echo   pgAdmin:     http://localhost:5050
echo     - Email:    admin@medical.com
echo     - Password: admin123
echo.
echo ================================================
echo   Proximos pasos:
echo ================================================
echo   1. Abrir pgAdmin en: http://localhost:5050
echo   2. cd backend
echo   3. python init_db.py
echo   4. python run.py
echo ================================================
echo.
pause
