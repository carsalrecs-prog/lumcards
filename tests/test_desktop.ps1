param([string]$DesktopDir = (Join-Path (Split-Path $PSScriptRoot -Parent) 'tools\desktop-build'))
$ErrorActionPreference = 'Stop'
$ankiRoot = Split-Path $PSScriptRoot -Parent
$ankiTemp = Join-Path ([IO.Path]::GetTempPath()) ('anki2-desktop-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $ankiTemp | Out-Null
$ankiListener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$ankiListener.Start(); $ankiPort = $ankiListener.LocalEndpoint.Port; $ankiListener.Stop()
$ankiUrl = "http://127.0.0.1:$ankiPort"
$ankiServerArgs = @(('"' + (Join-Path $ankiRoot 'server.py') + '"'), '--host', '127.0.0.1', '--port', $ankiPort, '--data-dir', ('"' + (Join-Path $ankiTemp 'data') + '"'))
$ankiServer = Start-Process -FilePath (Join-Path $ankiRoot '.venv\Scripts\python.exe') -ArgumentList $ankiServerArgs -WorkingDirectory $ankiRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ankiTemp 'server.log') -RedirectStandardError (Join-Path $ankiTemp 'server-error.log') -PassThru
try {
    $ankiHealthy = $false
    for ($ankiAttempt=0; $ankiAttempt -lt 30; $ankiAttempt++) {
        try { $ankiHealth=Invoke-RestMethod "$ankiUrl/api/health" -TimeoutSec 2; if($ankiHealth.app -eq 'anki2') { $ankiHealthy=$true; break } } catch { }
        if($ankiServer.HasExited) { throw (Get-Content -Raw -LiteralPath (Join-Path $ankiTemp 'server-error.log')) }
        Start-Sleep -Milliseconds 300
    }
    if(-not $ankiHealthy) { throw 'No se pudo iniciar el servidor de prueba.' }
    $ankiReport = Join-Path $ankiTemp 'native-window.json'
    $ankiArgs = @('--self-test','--no-server','--url',"$ankiUrl/",'--profile',('"' + (Join-Path $ankiTemp 'webview') + '"'),'--report',('"' + $ankiReport + '"'))
    $ankiDesktop = Start-Process -FilePath (Join-Path $DesktopDir 'Anki 2.0.exe') -ArgumentList $ankiArgs -WorkingDirectory $DesktopDir -WindowStyle Hidden -PassThru
    if(-not $ankiDesktop.WaitForExit(45000)) { Stop-Process -Id $ankiDesktop.Id; throw 'El visor de prueba no terminó.' }
    if(-not (Test-Path -LiteralPath $ankiReport)) { throw "El visor no generó su informe. Salida: $($ankiDesktop.ExitCode)" }
    $ankiResult = Get-Content -Raw -LiteralPath $ankiReport | ConvertFrom-Json
    if(-not $ankiResult.success) { throw $ankiResult.error }
    if($ankiResult.host -ne 'WinForms WebView2' -or $ankiResult.windowTitle -ne 'Anki 2.0') { throw 'La ventana no es el host de escritorio esperado.' }
    if($ankiDesktop.ExitCode -ne 0) { throw 'La ventana nativa terminó con error.' }
    $ankiResult | ConvertTo-Json -Depth 4
    Write-Host "Prueba nativa completada. Informe: $ankiReport"
} finally {
    try { Invoke-RestMethod "$ankiUrl/api/shutdown" -Method Post -ContentType 'application/json' -Headers @{'X-Anki-Request'='1'} -Body '{}' -TimeoutSec 10 | Out-Null } catch { }
    if(-not $ankiServer.WaitForExit(10000)) { Stop-Process -Id $ankiServer.Id -ErrorAction SilentlyContinue }
}
