-- Medical Services Database Initialization Script
-- Este script se ejecuta automáticamente cuando se crea el contenedor

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas de texto

-- Crear esquemas adicionales si es necesario
-- CREATE SCHEMA IF NOT EXISTS medical;

-- Configurar timezone
SET timezone = 'America/Argentina/Buenos_Aires';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos Medical Services inicializada correctamente';
    RAISE NOTICE 'Usuario: medical_user';
    RAISE NOTICE 'Base de datos: medical_services_dev';
END $$;
