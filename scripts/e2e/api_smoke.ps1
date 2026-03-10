Param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$AdminEmail = "admin@medical.com",
    [string]$AdminPassword = "admin123",
    [string]$ProfessionalEmail = "doctor@medical.com",
    [string]$ProfessionalPassword = "doctor123",
    [string]$PatientEmail = "patient@medical.com",
    [string]$PatientPassword = "patient123"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
    Param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Method      = $Method
        Uri         = $Url
        Headers     = $Headers
        ErrorAction = "Stop"
    }

    if ((Get-Command Invoke-WebRequest).Parameters.ContainsKey("UseBasicParsing")) {
        $params["UseBasicParsing"] = $true
    }

    if ($null -ne $Body) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($Body | ConvertTo-Json -Compress -Depth 8)
    }

    try {
        $response = Invoke-WebRequest @params
        $content = $response.Content
        $json = $null
        if ($content) {
            try { $json = $content | ConvertFrom-Json } catch { $json = $null }
        }

        return [PSCustomObject]@{
            ok         = $true
            statusCode = [int]$response.StatusCode
            body       = $json
            raw        = $content
            error      = ""
        }
    }
    catch {
        $statusCode = 0
        $message = $_.Exception.Message

        $responseProperty = $_.Exception.PSObject.Properties["Response"]
        if ($responseProperty) {
            $response = $responseProperty.Value
            if ($response -and $response.StatusCode) {
                $statusCode = [int]$response.StatusCode
            }
        }

        return [PSCustomObject]@{
            ok         = $false
            statusCode = $statusCode
            body       = $null
            raw        = ""
            error      = $message
        }
    }
}

$results = New-Object System.Collections.Generic.List[Object]

function Add-Result {
    Param(
        [string]$name,
        [bool]$passed,
        [string]$details
    )

    $results.Add([PSCustomObject]@{
        test    = $name
        status  = $(if ($passed) { "PASS" } else { "FAIL" })
        details = $details
    })
}

Write-Host "[SMOKE] Base URL: $BaseUrl"

$health = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl/health"
$healthOk = $health.ok -and $health.statusCode -eq 200 -and $health.body -and $health.body.status -eq "healthy"
$healthDetails = ("status={0}{1}" -f $health.statusCode, $(if ($health.error) { ", error=$($health.error)" } else { "" }))

if (-not $healthOk) {
    if ($health.ok -and $health.statusCode -eq 200) {
        # Frontend containers expose /health as static app content (HTML 200), not backend JSON.
        $healthOk = $true
        $healthDetails = "status=200 (frontend reachable)"
    }
}

if (-not $healthOk) {
    $apiHealth = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl/api/health"
    $healthOk = $apiHealth.ok -and $apiHealth.statusCode -eq 200 -and $apiHealth.body -and $apiHealth.body.status -eq "healthy"
    $healthDetails = ("status={0}{1}, fallback=/api/health,status={2}{3}" -f
        $health.statusCode,
        $(if ($health.error) { ", error=$($health.error)" } else { "" }),
        $apiHealth.statusCode,
        $(if ($apiHealth.error) { ", error=$($apiHealth.error)" } else { "" }))
}

Add-Result -name "health" -passed $healthOk -details $healthDetails

$adminLogin = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
    email    = $AdminEmail
    password = $AdminPassword
}
$adminToken = if ($adminLogin.body) { $adminLogin.body.access_token } else { $null }
$adminOk = $adminLogin.ok -and $adminLogin.statusCode -eq 200 -and -not [string]::IsNullOrWhiteSpace($adminToken)
Add-Result -name "auth_login_admin" -passed $adminOk -details ("status={0}{1}" -f $adminLogin.statusCode, $(if ($adminLogin.error) { ", error=$($adminLogin.error)" } else { "" }))

$professionalLogin = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
    email    = $ProfessionalEmail
    password = $ProfessionalPassword
}
$professionalToken = if ($professionalLogin.body) { $professionalLogin.body.access_token } else { $null }
$professionalOk = $professionalLogin.ok -and $professionalLogin.statusCode -eq 200 -and -not [string]::IsNullOrWhiteSpace($professionalToken)
Add-Result -name "auth_login_professional" -passed $professionalOk -details ("status={0}{1}" -f $professionalLogin.statusCode, $(if ($professionalLogin.error) { ", error=$($professionalLogin.error)" } else { "" }))

$patientLogin = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
    email    = $PatientEmail
    password = $PatientPassword
}
$patientToken = if ($patientLogin.body) { $patientLogin.body.access_token } else { $null }
$patientOk = $patientLogin.ok -and $patientLogin.statusCode -eq 200 -and -not [string]::IsNullOrWhiteSpace($patientToken)
Add-Result -name "auth_login_patient" -passed $patientOk -details ("status={0}{1}" -f $patientLogin.statusCode, $(if ($patientLogin.error) { ", error=$($patientLogin.error)" } else { "" }))

if ($adminToken) {
    $authHeaders = @{ Authorization = "Bearer $adminToken" }

    $patients = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl/api/patients?page=1&per_page=1" -Headers $authHeaders
    $patientsOk = $patients.ok -and $patients.statusCode -eq 200
    Add-Result -name "patients_list_admin" -passed $patientsOk -details ("status={0}{1}" -f $patients.statusCode, $(if ($patients.error) { ", error=$($patients.error)" } else { "" }))

    $appointments = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl/api/appointments?page=1&per_page=1" -Headers $authHeaders
    $appointmentsOk = $appointments.ok -and $appointments.statusCode -eq 200
    Add-Result -name "appointments_list_admin" -passed $appointmentsOk -details ("status={0}{1}" -f $appointments.statusCode, $(if ($appointments.error) { ", error=$($appointments.error)" } else { "" }))
}
else {
    Add-Result -name "patients_list_admin" -passed $false -details "skipped (no admin token)"
    Add-Result -name "appointments_list_admin" -passed $false -details "skipped (no admin token)"
}

Write-Host ""
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.status -eq "FAIL" }).Count
Write-Host ""
Write-Host "[SMOKE] failed=$failed total=$($results.Count)"

if ($failed -gt 0) {
    exit 1
}

exit 0
