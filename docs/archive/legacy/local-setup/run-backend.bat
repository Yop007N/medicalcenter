@echo off
echo ================================================
echo   Medical Services - Backend Server
echo ================================================
echo.
echo   Iniciando servidor en http://localhost:5000
echo   Presiona CTRL+C para detener
echo.
echo ================================================
echo.

cd backend
call venv\Scripts\activate.bat
python run.py

pause
