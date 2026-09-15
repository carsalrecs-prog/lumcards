param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$ankiRoot = $PSScriptRoot
$ankiUrl = 'http://127.0.0.1:8765'
$ankiPython = Join-Path $ankiRoot '.venv\Scripts\python.exe'

# Normal launch opens the native window; -NoBrowser starts only the server.
if (-not $NoBrowser) {
    $lumDesktop = Join-Path $ankiRoot 'Lumcards.exe'
    if (-not (Test-Path -LiteralPath $lumDesktop)) {
        throw 'Falta Lumcards.exe. Ejecuta el instalador o tools\build-desktop.ps1.'
    }
    Start-Process -FilePath $lumDesktop -WorkingDirectory $ankiRoot
    exit 0
}

try {
    $ankiHealth = Invoke-RestMethod -Uri "$ankiUrl/api/health" -TimeoutSec 2
    if ($ankiHealth.app -eq 'lumcards' -or $ankiHealth.app -eq 'anki2') {
        exit 0
    }
} catch { }

if (-not (Test-Path -LiteralPath $ankiPython)) {
    Write-Host 'Preparando Lumcards. Esta primera instalacion necesita internet...'
    python -m venv (Join-Path $ankiRoot '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Instala Python 3.10 o superior y vuelve a abrir la app.' }
}
& $ankiPython -c "import zstandard; import PIL" 2>$null
if ($LASTEXITCODE -ne 0) {
    & $ankiPython -m pip install -r (Join-Path $ankiRoot 'requirements-lock.txt')
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar los componentes. Comprueba tu conexion.' }
}
$ankiLogs = Join-Path $ankiRoot 'data'
New-Item -ItemType Directory -Force -Path $ankiLogs | Out-Null
$ankiProcess = Start-Process -FilePath $ankiPython -ArgumentList @('"' + (Join-Path $ankiRoot 'server.py') + '"') -WorkingDirectory $ankiRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ankiLogs 'server.log') -RedirectStandardError (Join-Path $ankiLogs 'server-error.log') -PassThru
for ($ankiAttempt = 0; $ankiAttempt -lt 90; $ankiAttempt++) {
    Start-Sleep -Milliseconds 500
    try {
        $ankiHealth = Invoke-RestMethod -Uri "$ankiUrl/api/health" -TimeoutSec 2
        if ($ankiHealth.app -eq 'lumcards' -or $ankiHealth.app -eq 'anki2') {
            exit 0
        }
    } catch { }
    if ($ankiProcess.HasExited) { throw 'No se pudo iniciar la app. Revisa data\server-error.log.' }
}
throw 'La app sigue preparando tu biblioteca. Revisa data\server.log e intenta abrirla de nuevo.'
