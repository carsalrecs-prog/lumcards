$ErrorActionPreference = 'Stop'
try {
    $ankiStatus = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/health' -TimeoutSec 3
    if ($ankiStatus.app -ne 'lumcards' -and $ankiStatus.app -ne 'anki2') { throw 'El puerto esta ocupado por otra aplicacion.' }
    Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/shutdown' -Method Post -ContentType 'application/json' -Headers @{ 'X-Lumcards-Request' = '1'; 'X-Anki-Request' = '1' } -Body '{}' -TimeoutSec 60 | Out-Null
    Write-Host 'Lumcards cerrado. Tus tarjetas y repasos estan guardados.'
} catch {
    Write-Host 'No se pudo cerrar la app, o ya estaba cerrada.'
    Write-Host $_.Exception.Message
    exit 1
}
