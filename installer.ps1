<#
.SYNOPSIS
    Asistente de Instalacion de Lumcards para Windows
#>
param(
    [string]$InstallDir = "$env:LOCALAPPDATA\Programs\Lumcards",
    [switch]$PortableMode,
    [switch]$NoShortcuts,
    [switch]$Silent
)

$ErrorActionPreference = 'Stop'
$sourceDir = $PSScriptRoot

# Solo se distribuye el programa. Las colecciones, copias, registros y perfiles
# de WebView2 pertenecen al usuario y nunca se copian desde el equipo creador.
$appFiles = @(
    'Lumcards.exe', 'Lumcards.exe.config', 'Cerrar Lumcards.exe',
    'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll', 'WebView2Loader.dll',
    'server.py', 'engine.py', 'clean_engine.py', 'native_image_occlusion.py', 'text_import.py', 'clean_anki_importer.py', 'practice_store.py', 'start.ps1', 'stop.ps1',
    'requirements.txt', 'requirements-lock.txt', 'README.md', 'IDEAS.md', 'IMAGE_OCCLUSION_SOURCES.md', 'COMMERCIAL_ROADMAP.md',
    'INICIAR LUMCARDS.cmd', 'CERRAR LUMCARDS.cmd', 'Desinstalar Lumcards.cmd',
    'installer.ps1', 'uninstall.ps1', 'Instalar Lumcards.cmd', 'Instalador Lumcards.exe',
    'tools\launcher.cs', 'tools\installer_gui.cs', 'tools\close_launcher.cs',
    'tools\build-desktop.ps1', 'tools\desktop.manifest',
    'tools\vendor\webview2\LICENSE.txt', 'tools\vendor\webview2\version.json',
    'tools\vendor\webview2\Microsoft.Web.WebView2.Core.dll',
    'tools\vendor\webview2\Microsoft.Web.WebView2.WinForms.dll',
    'tools\vendor\webview2\WebView2Loader.dll'
)
$appDirectories = @('assets', 'dist', '.venv')
foreach ($requiredFile in @('Lumcards.exe', 'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll', 'WebView2Loader.dll', 'server.py', 'engine.py', 'clean_engine.py', 'start.ps1')) {
    if (-not (Test-Path -LiteralPath (Join-Path $sourceDir $requiredFile) -PathType Leaf)) {
        throw "El paquete de escritorio esta incompleto: falta $requiredFile. Ejecuta tools\build-desktop.ps1 antes de instalar."
    }
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n[+] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Create-Shortcut {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$Arguments,
        [string]$WorkingDir,
        [string]$IconPath,
        [string]$Description
    )
    $wshShell = New-Object -ComObject WScript.Shell
    $shortcut = $wshShell.CreateShortcut($ShortcutPath)
    $shortcut.TargetPath = $TargetPath
    $shortcut.Arguments = $Arguments
    $shortcut.WorkingDirectory = $WorkingDir
    if ($IconPath -and (Test-Path -LiteralPath $IconPath)) {
        $shortcut.IconLocation = "$IconPath,0"
    }
    $shortcut.Description = $Description
    $shortcut.Save()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wshShell) | Out-Null
}

Clear-Host
Write-Host "============================================================" -ForegroundColor DarkYellow
Write-Host "        ASISTENTE DE INSTALACION -- LUMCARDS (WINDOWS)      " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor DarkYellow
Write-Host "Instalador local para Lumcards."
Write-Host 'Ventana de escritorio: requiere Windows de 64 bits, .NET Framework 4.8 y Microsoft Edge WebView2 Runtime.'

if (-not $Silent -and -not $PortableMode) {
    Write-Host "`nOpciones de instalacion:"
    Write-Host " 1. Instalacion estandar en: $InstallDir (Recomendada)"
    Write-Host " 2. Modo portatil (Crear accesos directos para la carpeta actual)"
    Write-Host " 3. Cancelar"
    
    $choice = Read-Host "`nSelecciona una opcion [1/2/3] (Por defecto: 1)"
    if ($choice -eq '3') {
        Write-Host "`nInstalacion cancelada por el usuario." -ForegroundColor Yellow
        exit 0
    } elseif ($choice -eq '2') {
        $PortableMode = $true
    }
}

$sourceDir = [IO.Path]::GetFullPath($sourceDir).TrimEnd('\')
$targetDir = [IO.Path]::GetFullPath($(if ($PortableMode) { $sourceDir } else { $InstallDir })).TrimEnd('\')
if ($targetDir -eq [IO.Path]::GetPathRoot($targetDir).TrimEnd('\')) {
    throw 'Selecciona una carpeta de aplicacion, no la raiz de una unidad.'
}
if ($targetDir.StartsWith($sourceDir + '\', [StringComparison]::OrdinalIgnoreCase) -or $sourceDir.StartsWith($targetDir + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'La carpeta de instalacion debe estar separada de la carpeta de origen. Usa el modo portatil para conservar la ubicacion actual.'
}

Write-Step "Preparando directorio de destino: $targetDir"
if (-not (Test-Path -LiteralPath $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

# Copy files if not portable
if (-not $PortableMode -and ($sourceDir.TrimEnd('\') -ne $targetDir.TrimEnd('\'))) {
    Write-Step "Copiando archivos de la aplicacion a $targetDir..."
    foreach ($itemName in $appFiles) {
        $sourcePath = Join-Path $sourceDir $itemName
        if (Test-Path -LiteralPath $sourcePath -PathType Leaf) {
            $fileDestination = Join-Path $targetDir $itemName
            New-Item -ItemType Directory -Force -Path (Split-Path $fileDestination -Parent) | Out-Null
            Copy-Item -LiteralPath $sourcePath -Destination $fileDestination -Force
        }
    }
    foreach ($itemName in $appDirectories) {
        $sourcePath = Join-Path $sourceDir $itemName
        if (Test-Path -LiteralPath $sourcePath -PathType Container) {
            $destinationPath = Join-Path $targetDir $itemName
            if (-not (Test-Path -LiteralPath $destinationPath)) {
                New-Item -ItemType Directory -Path $destinationPath | Out-Null
            }
            Get-ChildItem -LiteralPath $sourcePath -Force | ForEach-Object {
                Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Recurse -Force
            }
        }
    }
    Write-Host '  -> Tu carpeta data y tu biblioteca permanecen intactas.' -ForegroundColor Gray
    Write-Success "Archivos copiados correctamente."
}

# Ensure assets/icon.ico exists
$iconPath = Join-Path $targetDir 'assets\icon.ico'
if (-not (Test-Path -LiteralPath $iconPath)) {
    Write-Step "Generando icono..."
    $pythonExe = Join-Path $targetDir '.venv\Scripts\python.exe'
    if (Test-Path -LiteralPath $pythonExe) {
        $iconScript = Join-Path $targetDir 'tools\generate_icon.py'
        if (Test-Path -LiteralPath $iconScript) {
            & $pythonExe $iconScript 2>$null
        }
    }
}

# Verify / Setup Python Environment
$targetPython = Join-Path $targetDir '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $targetPython)) {
    Write-Step "Configurando entorno de ejecucion de Python..."
    $sysPython = (Get-Command python -ErrorAction SilentlyContinue).Source
    if (-not $sysPython) {
        Write-Warn "No se detecto Python en el sistema. Asegurate de tener Python 3.10+ instalado."
    } else {
        python -m venv (Join-Path $targetDir '.venv')
        & (Join-Path $targetDir '.venv\Scripts\pip.exe') install -r (Join-Path $targetDir 'requirements-lock.txt')
    }
} else {
    Write-Success "Entorno virtual de Python listo."
}

# Create Shortcuts
if (-not $NoShortcuts) {
    Write-Step "Creando accesos directos con icono personalizado..."
    
    $appExe = Join-Path $targetDir 'Lumcards.exe'
    $stopPs1 = Join-Path $targetDir 'stop.ps1'
    $icon = Join-Path $targetDir 'assets\icon.ico'
    if (-not (Test-Path -LiteralPath $icon)) {
        $icon = "$env:SystemRoot\System32\shell32.dll"
    }

    $desktopDir = [Environment]::GetFolderPath('Desktop')
    $startMenuDir = [Environment]::GetFolderPath('Programs')
    
    $lumAppDir = Join-Path $startMenuDir 'Lumcards'
    if (-not (Test-Path -LiteralPath $lumAppDir)) {
        New-Item -ItemType Directory -Force -Path $lumAppDir | Out-Null
    }

    $psExe = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $stopArgs = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $stopPs1 + '"'

    # 1. Desktop Shortcut
    $desktopShortcut = Join-Path $desktopDir 'Lumcards.lnk'
    Create-Shortcut -ShortcutPath $desktopShortcut `
                    -TargetPath $appExe `
                    -Arguments '' `
                    -WorkingDir $targetDir `
                    -IconPath $icon `
                    -Description 'Lumcards -- Tu espacio personal de aprendizaje'
    Write-Success "Acceso directo en el Escritorio creado."

    # 2. Start Menu: Launch
    $startMenuShortcut = Join-Path $lumAppDir 'Lumcards.lnk'
    Create-Shortcut -ShortcutPath $startMenuShortcut `
                    -TargetPath $appExe `
                    -Arguments '' `
                    -WorkingDir $targetDir `
                    -IconPath $icon `
                    -Description 'Lumcards -- Tu espacio personal de aprendizaje'

    # 3. Start Menu: Close App
    $closeShortcut = Join-Path $lumAppDir 'Cerrar Lumcards.lnk'
    $closeExe = Join-Path $targetDir 'Cerrar Lumcards.exe'
    $closeTarget = if (Test-Path -LiteralPath $closeExe) { $closeExe } else { $psExe }
    $closeArguments = if (Test-Path -LiteralPath $closeExe) { '' } else { $stopArgs }
    Create-Shortcut -ShortcutPath $closeShortcut `
                    -TargetPath $closeTarget `
                    -Arguments $closeArguments `
                    -WorkingDir $targetDir `
                    -IconPath "$env:SystemRoot\System32\shell32.dll,27" `
                    -Description 'Detener el servidor local de Lumcards'

    # 4. Start Menu: Uninstall (if installed in AppData)
    $uninstallerCmd = Join-Path $targetDir 'Desinstalar Lumcards.cmd'
    if (Test-Path -LiteralPath $uninstallerCmd) {
        $uninstallShortcut = Join-Path $lumAppDir 'Desinstalar Lumcards.lnk'
        Create-Shortcut -ShortcutPath $uninstallShortcut `
                        -TargetPath $uninstallerCmd `
                        -Arguments '' `
                        -WorkingDir $targetDir `
                        -IconPath "$env:SystemRoot\System32\shell32.dll,131" `
                        -Description 'Desinstalar Lumcards de este equipo'
    }

    Write-Success "Accesos directos creados en el Menu Inicio."
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "         INSTALACION DE LUMCARDS COMPLETADA CON EXITO       " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "`nPuedes abrir la aplicacion desde el icono en tu Escritorio"
Write-Host "o buscando 'Lumcards' en el Menu Inicio de Windows.`n"

if (-not $Silent) {
    $launchNow = Read-Host "Deseas iniciar Lumcards ahora mismo? [S/N] (Por defecto: S)"
    if ($launchNow -ne 'N' -and $launchNow -ne 'n') {
        Write-Host "Iniciando Lumcards..." -ForegroundColor Cyan
        Start-Process -FilePath (Join-Path $targetDir 'Lumcards.exe') -WorkingDirectory $targetDir
    }
}
