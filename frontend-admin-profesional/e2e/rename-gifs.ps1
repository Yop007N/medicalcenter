$gifDir = 'C:\pgxDev\medical-services\frontend\demo-gifs'

# Renombrar los archivos con nombres truncados
$renames = @{
    '99-auth.setup.ts authenticate setup.gif' = '00-Setup-Autenticacion.gif'
    '99-CRUD Patie 22f67  new patient with full data.gif' = '01-Pacientes-Crear.gif'
    '99-CRUD Patie 8ce2b ch and view patient details.gif' = '02-Pacientes-Buscar-Ver.gif'
    '99-CRUD Medic bf2d0  medical record for patient.gif' = '11-Historia-Clinica-Crear.gif'
    '99-CRUD Odont 87738 dontology treatment details.gif' = '13-Odontologia-Ver-Tratamiento.gif'
    '99-CRUD Odont 62aaf nd interact with odontogram.gif' = '14-Odontologia-Odontograma.gif'
    '99-CRUD Odont 05144 on to treatment detail page.gif' = '15-Odontologia-Navegacion-Directa.gif'
    '99-Complete D aaf83 on CRUD demo   All entities.gif' = '16-Demo-Completo-CRUD.gif'
}

foreach ($old in $renames.Keys) {
    $oldPath = Join-Path $gifDir $old
    $newPath = Join-Path $gifDir $renames[$old]
    if (Test-Path $oldPath) {
        Move-Item -Path $oldPath -Destination $newPath -Force
        Write-Host "Renombrado: $old -> $($renames[$old])" -ForegroundColor Green
    }
}

# Listar todos los GIFs ordenados
Write-Host ''
Write-Host '=== GIFs FINALES ORDENADOS ===' -ForegroundColor Cyan
Get-ChildItem -Path $gifDir -Filter '*.gif' | Sort-Object Name | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  $($_.Name) - $sizeMB MB" -ForegroundColor White
}
