@echo off
echo ================================================
echo   Medical Services - Backend Setup
echo ================================================
echo.

cd backend

echo [1/5] Creando entorno virtual...
if not exist "venv" (
    python -m venv venv
    echo     Entorno virtual creado.
) else (
    echo     Entorno virtual ya existe.
)

echo.
echo [2/5] Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo [3/5] Instalando dependencias...
pip install -r requirements\dev.txt

echo.
echo [4/5] Copiando archivo .env...
if not exist ".env" (
    copy .env.example .env
    echo     Archivo .env creado.
    echo     IMPORTANTE: Edita .env si es necesario.
) else (
    echo     Archivo .env ya existe.
)

echo.
echo [5/5] Inicializando base de datos...
python init_db.py

echo.
echo ================================================
echo   Backend configurado correctamente!
echo ================================================
echo.
echo   Para ejecutar el servidor:
echo   1. cd backend
echo   2. venv\Scripts\activate
echo   3. python run.py
echo.
echo   O simplemente ejecuta: run-backend.bat
echo ================================================
echo.
pause
