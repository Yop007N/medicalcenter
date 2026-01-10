# Script para unir todos los GIFs en uno solo con secuencia correcta
$gifDir = 'C:\pgxDev\medical-services\frontend\demo-gifs'
$outputFile = Join-Path $gifDir 'DEMO-COMPLETO-MEDICAL-SERVICES.gif'
$tempDir = Join-Path $env:TEMP "gif_merge_$([guid]::NewGuid().ToString('N'))"

# Ruta de ffmpeg
$ffmpegPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
if (-not (Test-Path $ffmpegPath)) {
    $ffmpegPath = "ffmpeg"
}

Write-Host "=== UNIENDO TODOS LOS GIFs EN SECUENCIA ===" -ForegroundColor Cyan
Write-Host ""

# Crear directorio temporal
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Lista ordenada de GIFs (excluyendo el demo completo individual)
$gifs = Get-ChildItem -Path $gifDir -Filter '*.gif' |
    Where-Object { $_.Name -ne '16-Demo-Completo-CRUD.gif' -and $_.Name -ne 'DEMO-COMPLETO-MEDICAL-SERVICES.gif' } |
    Sort-Object Name

Write-Host "GIFs a unir (en orden):" -ForegroundColor Yellow
$gifs | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
Write-Host ""

# Crear archivo de lista para ffmpeg
$listFile = Join-Path $tempDir "input_list.txt"
$gifIndex = 0

foreach ($gif in $gifs) {
    # Convertir GIF a video temporal para concatenar
    $tempVideo = Join-Path $tempDir "temp_$($gifIndex.ToString('D3')).mp4"

    Write-Host "Procesando: $($gif.Name)..." -ForegroundColor Gray

    # Convertir GIF a MP4 (mejor para concatenar)
    $args = @(
        "-y"
        "-i", "`"$($gif.FullName)`""
        "-movflags", "faststart"
        "-pix_fmt", "yuv420p"
        "-vf", "scale=1280:-2:flags=lanczos,pad=1280:ceil(ih/2)*2:0:0"
        "`"$tempVideo`""
    )

    $process = Start-Process -FilePath $ffmpegPath -ArgumentList $args -Wait -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\ffmpeg_merge_err.log"

    if (Test-Path $tempVideo) {
        Add-Content -Path $listFile -Value "file '$tempVideo'"
        $gifIndex++
    }
}

Write-Host ""
Write-Host "Concatenando $gifIndex videos..." -ForegroundColor Yellow

# Concatenar todos los videos
$concatVideo = Join-Path $tempDir "concat_output.mp4"
$concatArgs = @(
    "-y"
    "-f", "concat"
    "-safe", "0"
    "-i", "`"$listFile`""
    "-c", "copy"
    "`"$concatVideo`""
)

$process = Start-Process -FilePath $ffmpegPath -ArgumentList $concatArgs -Wait -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\ffmpeg_concat_err.log"

if (-not (Test-Path $concatVideo)) {
    Write-Host "Error al concatenar videos" -ForegroundColor Red
    exit 1
}

Write-Host "Generando GIF final de alta calidad..." -ForegroundColor Yellow

# Generar paleta optimizada
$paletteFile = Join-Path $tempDir "palette.png"
$paletteArgs = @(
    "-y"
    "-i", "`"$concatVideo`""
    "-vf", "fps=10,scale=1280:-1:flags=lanczos,palettegen=max_colors=256:stats_mode=diff"
    "`"$paletteFile`""
)

Start-Process -FilePath $ffmpegPath -ArgumentList $paletteArgs -Wait -NoNewWindow -PassThru | Out-Null

# Crear GIF final
$gifArgs = @(
    "-y"
    "-i", "`"$concatVideo`""
    "-i", "`"$paletteFile`""
    "-lavfi", "fps=10,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=floyd_steinberg:diff_mode=rectangle"
    "`"$outputFile`""
)

$process = Start-Process -FilePath $ffmpegPath -ArgumentList $gifArgs -Wait -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\ffmpeg_gif_err.log"

# Limpiar temporales
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $outputFile) {
    $sizeMB = [math]::Round((Get-Item $outputFile).Length / 1MB, 2)
    Write-Host ""
    Write-Host "=== GIF COMPLETO CREADO ===" -ForegroundColor Green
    Write-Host "Archivo: $outputFile" -ForegroundColor White
    Write-Host "Tamanio: $sizeMB MB" -ForegroundColor White
} else {
    Write-Host "Error al crear GIF final" -ForegroundColor Red
}
