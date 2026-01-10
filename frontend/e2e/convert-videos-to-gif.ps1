# Script para convertir videos WebM de Playwright a GIFs de ALTA CALIDAD
# Organiza los GIFs por orden numerico segun el flujo de la aplicacion

param(
    [string]$InputDir = "..\test-results",
    [string]$OutputDir = "..\demo-gifs",
    [int]$Fps = 12,
    [int]$Width = 1280
)

# Ruta completa de ffmpeg
$ffmpegPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
if (-not (Test-Path $ffmpegPath)) {
    $ffmpegPath = "ffmpeg"
}

Write-Host "=== CONVERTIDOR DE VIDEOS A GIF DE ALTA CALIDAD ===" -ForegroundColor Cyan
Write-Host ""

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Mapeo de nombres de test a orden y nombre legible
$testOrder = @{
    "crud-operations-CRUD-Patients-Create-new-patient-with-full-data-chromium" = @{ Order = 1; Name = "01-Pacientes-Crear" }
    "crud-operations-CRUD-Patients-Search-and-view-patient-details-chromium" = @{ Order = 2; Name = "02-Pacientes-Buscar-Ver" }
    "crud-operations-CRUD-Professionals-Create-new-professional-chromium" = @{ Order = 3; Name = "03-Profesionales-Crear" }
    "crud-operations-CRUD-Professionals-View-professionals-list-chromium" = @{ Order = 4; Name = "04-Profesionales-Lista" }
    "crud-operations-CRUD-Appointments-Create-new-appointment-chromium" = @{ Order = 5; Name = "05-Citas-Crear" }
    "crud-operations-CRUD-Appointments-View-appointments-calendar-chromium" = @{ Order = 6; Name = "06-Citas-Calendario" }
    "crud-operations-CRUD-Budgets-Create-new-budget-with-items-chromium" = @{ Order = 7; Name = "07-Presupuestos-Crear" }
    "crud-operations-CRUD-Budgets-View-budget-details-chromium" = @{ Order = 8; Name = "08-Presupuestos-Ver" }
    "crud-operations-CRUD-Payments-Create-new-payment-chromium" = @{ Order = 9; Name = "09-Pagos-Crear" }
    "crud-operations-CRUD-Payments-View-payments-list-chromium" = @{ Order = 10; Name = "10-Pagos-Lista" }
    "crud-operations-CRUD-Medical-Records-Create-medical-record-for-patient-chromium" = @{ Order = 11; Name = "11-Historia-Clinica-Crear" }
    "crud-operations-CRUD-Odontology-Create-odontology-treatment-chromium" = @{ Order = 12; Name = "12-Odontologia-Tratamiento-Crear" }
    "crud-operations-CRUD-Odontology-View-odontology-treatment-details-chromium" = @{ Order = 13; Name = "13-Odontologia-Tratamiento-Ver" }
    "crud-operations-CRUD-Odontology-Navigate-and-interact-with-odontogram-chromium" = @{ Order = 14; Name = "14-Odontologia-Odontograma" }
    "crud-operations-CRUD-Odontology-Direct-navigation-to-treatment-detail-page-chromium" = @{ Order = 15; Name = "15-Odontologia-Navegacion-Directa" }
    "crud-operations-Complete-Demo-Workflow-Full-application-CRUD-demo---All-entities-chromium" = @{ Order = 16; Name = "16-Demo-Completo-CRUD" }
}

# Buscar videos
$videos = Get-ChildItem -Path $InputDir -Recurse -Filter "video.webm" -ErrorAction SilentlyContinue

if ($videos.Count -eq 0) {
    Write-Host "No se encontraron videos en $InputDir" -ForegroundColor Yellow
    Write-Host "Ejecuta primero los tests con: npx playwright test --config=e2e/playwright.config.ts --project=chromium e2e/tests/crud-operations.spec.ts --workers=1"
    exit 0
}

Write-Host "Encontrados $($videos.Count) videos para convertir" -ForegroundColor Green
Write-Host "Directorio de salida: $OutputDir" -ForegroundColor Yellow
Write-Host ""

$converted = 0
$results = @()

foreach ($video in $videos) {
    $testDir = $video.Directory.Name

    # Buscar el nombre amigable
    $friendlyName = $null
    foreach ($key in $testOrder.Keys) {
        if ($testDir -like "*$key*" -or $testDir -match [regex]::Escape($key.Substring(0, [Math]::Min(50, $key.Length)))) {
            $friendlyName = $testOrder[$key].Name
            $order = $testOrder[$key].Order
            break
        }
    }

    # Si no encontramos el mapeo, usar nombre generico con orden alto
    if (-not $friendlyName) {
        # Intentar extraer nombre del directorio
        $cleanName = $testDir -replace "crud-operations-", "" -replace "-chromium", "" -replace "-", " "
        $friendlyName = "99-$cleanName"
        $order = 99
    }

    $outputFile = Join-Path $OutputDir "$friendlyName.gif"

    Write-Host "[$order] Convirtiendo: $friendlyName" -ForegroundColor Yellow
    Write-Host "    Origen: $($video.FullName)"

    # Archivo temporal para paleta
    $paletteFile = Join-Path $env:TEMP "palette_$([guid]::NewGuid().ToString('N')).png"

    try {
        # Paso 1: Generar paleta optimizada de alta calidad (256 colores)
        $paletteArgs = @(
            "-y"
            "-i", "`"$($video.FullName)`""
            "-vf", "fps=$Fps,scale=$Width`:-1:flags=lanczos,palettegen=max_colors=256:stats_mode=diff"
            "`"$paletteFile`""
        )

        $process = Start-Process -FilePath $ffmpegPath -ArgumentList $paletteArgs -Wait -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\ffmpeg_err.log"

        if ($process.ExitCode -ne 0 -and -not (Test-Path $paletteFile)) {
            Write-Host "    ! Error generando paleta" -ForegroundColor Red
            continue
        }

        # Paso 2: Crear GIF de alta calidad con dithering avanzado
        $gifArgs = @(
            "-y"
            "-i", "`"$($video.FullName)`""
            "-i", "`"$paletteFile`""
            "-lavfi", "fps=$Fps,scale=$Width`:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=floyd_steinberg:diff_mode=rectangle"
            "`"$outputFile`""
        )

        $process = Start-Process -FilePath $ffmpegPath -ArgumentList $gifArgs -Wait -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\ffmpeg_err2.log"

        if (Test-Path $outputFile) {
            $gifSize = [math]::Round((Get-Item $outputFile).Length / 1MB, 2)
            Write-Host "    OK Creado: $gifSize MB" -ForegroundColor Green
            $converted++
            $results += [PSCustomObject]@{
                Order = $order
                Name = $friendlyName
                Size = "$gifSize MB"
                Path = $outputFile
            }
        } else {
            Write-Host "    ! Error creando GIF" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "    ! Error: $_" -ForegroundColor Red
    }
    finally {
        # Limpiar paleta temporal
        if (Test-Path $paletteFile) {
            Remove-Item $paletteFile -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host ""
Write-Host "=== CONVERSION COMPLETADA ===" -ForegroundColor Cyan
Write-Host "Videos convertidos: $converted de $($videos.Count)"
Write-Host ""

# Mostrar lista ordenada
if ($results.Count -gt 0) {
    Write-Host "=== GIFs GENERADOS (ordenados) ===" -ForegroundColor Green
    $results | Sort-Object Order | ForEach-Object {
        Write-Host "  $($_.Name) - $($_.Size)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Ubicacion: $((Resolve-Path $OutputDir).Path)" -ForegroundColor Yellow
}
