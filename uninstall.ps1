<#
.SYNOPSIS
    Desinstalador de Lumcards para Windows
#>
param(
    [switch]$Force,
    [switch]$KeepData
)

$ErrorActionPreference = 'Stop'
$appDir = $PSScriptRoot

Clear-Host
Write-Host '============================================================' -ForegroundColor DarkYellow
Write-Host '        DESINSTALADOR -- LUMCARDS (WINDOWS)                 ' -ForegroundColor Yellow
Write-Host '============================================================' -ForegroundColor DarkYellow

if (-not $Force) {
    $confirm = Read-Host 'Estas seguro de que deseas desinstalar Lumcards? [S/N] (Por defecto: N)'
    if ($confirm -ne 'S' -and $confirm -ne 's') {
        Write-Host "`nDesinstalacion cancelada." -ForegroundColor Green
        exit 0
    }
}

# 1. Stop background server
Write-Host "`n[+] Deteniendo procesos en segundo plano de Lumcards..." -ForegroundColor Cyan
$stopScript = Join-Path $appDir 'stop.ps1'
if (Test-Path -LiteralPath $stopScript) {
    try {
        & $stopScript
    } catch { }
}

# 2. Remove Shortcuts
Write-Host '[+] Eliminando accesos directos...' -ForegroundColor Cyan

$desktopDir = [Environment]::GetFolderPath('Desktop')
$desktopShortcut = Join-Path $desktopDir 'Lumcards.lnk'
if (Test-Path -LiteralPath $desktopShortcut) {
    Remove-Item -LiteralPath $desktopShortcut -Force -ErrorAction SilentlyContinue
    Write-Host '  -> Acceso directo del Escritorio eliminado.' -ForegroundColor Gray
}

$startMenuDir = [Environment]::GetFolderPath('Programs')
$lumStartMenu = Join-Path $startMenuDir 'Lumcards'
if (Test-Path -LiteralPath $lumStartMenu) {
    Remove-Item -LiteralPath $lumStartMenu -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host '  -> Accesos directos del Menu Inicio eliminados.' -ForegroundColor Gray
}

# 3. Handle data folder preservation
$dataFolder = Join-Path $appDir 'data'
$preserveData = $KeepData
if (-not $KeepData -and (Test-Path -LiteralPath $dataFolder)) {
    Write-Host "`n[!] Se ha detectado tu carpeta de tarjetas y repasos (data/)." -ForegroundColor Yellow
    $keepChoice = Read-Host 'Deseas CONSERVAR tus mazos, tarjetas y progreso? [S/N] (Recomendado: S)'
    if ($keepChoice -ne 'N' -and $keepChoice -ne 'n') {
        $preserveData = $true
    }
}

# 4. Remove installation files if installed in AppData
$defaultInstallDir = "$env:LOCALAPPDATA\Programs\Lumcards"
if ($appDir.TrimEnd('\') -eq $defaultInstallDir.TrimEnd('\')) {
    Write-Host "`n[+] Eliminando archivos del programa en $appDir..." -ForegroundColor Cyan
    
    Get-ChildItem -Path $appDir -Force | ForEach-Object {
        if ($preserveData -and $_.Name -eq 'data') {
            Write-Host "  -> Conservando tus datos en $(Join-Path $appDir 'data')" -ForegroundColor Green
        } else {
            Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "`n[i] Nota: La carpeta de origen ($appDir) no ha sido borrada para no afectar tus archivos de trabajo." -ForegroundColor Gray
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host '        DESINSTALACION COMPLETADA CORRECTAMENTE             ' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
