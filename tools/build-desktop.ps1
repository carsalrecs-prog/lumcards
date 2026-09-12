param([switch]$StageOnly)
$ErrorActionPreference = 'Stop'
$ankiRoot = Split-Path $PSScriptRoot -Parent
$ankiCompiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$ankiSdk = Join-Path $PSScriptRoot 'vendor\webview2'
$ankiBuild = Join-Path $PSScriptRoot 'desktop-build'
New-Item -ItemType Directory -Force -Path $ankiBuild | Out-Null
Get-ChildItem -LiteralPath $ankiBuild -File | Remove-Item -Force -ErrorAction SilentlyContinue
foreach ($ankiDll in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll')) {
    if (-not (Test-Path -LiteralPath (Join-Path $ankiSdk $ankiDll))) { throw "Falta $ankiDll en tools\vendor\webview2." }
    Copy-Item -LiteralPath (Join-Path $ankiSdk $ankiDll) -Destination (Join-Path $ankiBuild $ankiDll) -Force
}
$lumArgs = @('/nologo','/target:winexe','/platform:x64','/optimize+',('/win32icon:' + (Join-Path $ankiRoot 'assets\icon.ico')),('/win32manifest:' + (Join-Path $PSScriptRoot 'desktop.manifest')),('/out:' + (Join-Path $ankiBuild 'Lumcards.exe')),'/reference:System.dll','/reference:System.Core.dll','/reference:System.Drawing.dll','/reference:System.Windows.Forms.dll','/reference:System.Web.Extensions.dll',('/reference:' + (Join-Path $ankiSdk 'Microsoft.Web.WebView2.Core.dll')),('/reference:' + (Join-Path $ankiSdk 'Microsoft.Web.WebView2.WinForms.dll')),(Join-Path $PSScriptRoot 'launcher.cs'))
& $ankiCompiler @lumArgs
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar la ventana de escritorio de Lumcards.' }
Copy-Item -LiteralPath (Join-Path $ankiRoot 'Lumcards.exe.config') -Destination $ankiBuild -Force
New-Item -ItemType Directory -Force -Path (Join-Path $ankiBuild 'assets') | Out-Null
Copy-Item -LiteralPath (Join-Path $ankiRoot 'assets\icon.ico') -Destination (Join-Path $ankiBuild 'assets\icon.ico') -Force
& $ankiCompiler /nologo /target:winexe /platform:x64 /optimize+ "/win32icon:$(Join-Path $ankiRoot 'assets\icon.ico')" "/out:$(Join-Path $ankiBuild 'Instalador Lumcards.exe')" /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:Microsoft.CSharp.dll (Join-Path $PSScriptRoot 'installer_gui.cs')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar el instalador de Lumcards.' }
& $ankiCompiler /nologo /target:winexe /platform:x64 /optimize+ "/win32icon:$(Join-Path $ankiRoot 'assets\icon.ico')" "/out:$(Join-Path $ankiBuild 'Cerrar Lumcards.exe')" /reference:System.dll /reference:System.Core.dll /reference:System.Windows.Forms.dll (Join-Path $PSScriptRoot 'close_launcher.cs')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar el acceso de cierre de Lumcards.' }
if (-not $StageOnly) {
    foreach ($lumFile in @('Lumcards.exe','Lumcards.exe.config','Instalador Lumcards.exe','Cerrar Lumcards.exe','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll')) {
        $source = Join-Path $ankiBuild $lumFile
        if (Test-Path -LiteralPath $source) {
            try {
                Copy-Item -LiteralPath $source -Destination (Join-Path $ankiRoot $lumFile) -Force
            } catch {
                Write-Warning "No se pudo sobreescribir $lumFile (puede estar en uso): $_"
            }
        }
    }
}
Write-Host "Aplicacion de escritorio Lumcards compilada en $ankiBuild"
