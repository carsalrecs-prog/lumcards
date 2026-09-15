param([string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent))

$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$brainRoot = Join-Path $project 'brain'
$required = @(
    '00_HOME.md', '01_CURRENT.md', '02_NEXT.md', '03_DECISIONS.md',
    '04_LOG.md', '05_ARCHITECTURE.md', '06_LEGAL.md', '07_PROTOCOL.md',
    '08_HANDOFF.md', '09_GUIDE.md', 'templates/Tarea.md', 'templates/Relevo.md'
)
$problems = [Collections.Generic.List[string]]::new()
foreach ($name in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $brainRoot $name) -PathType Leaf)) {
        $problems.Add("Falta brain/$name")
    }
}
$budgets = @{ '00_HOME.md' = 4000; '08_HANDOFF.md' = 5000 }
foreach ($name in $budgets.Keys) {
    $path = Join-Path $brainRoot $name
    if (Test-Path -LiteralPath $path) {
        $size = (Get-Content -Raw -Encoding UTF8 -LiteralPath $path).Length
        if ($size -gt $budgets[$name]) { $problems.Add("brain/${name}: $size caracteres; limite $($budgets[$name])") }
    }
}

# Revisar solo la memoria, sin recorrer colecciones, dependencias ni compilaciones.
$notes = @(Get-ChildItem -LiteralPath $brainRoot -File -Filter '*.md' -Recurse)
$linkCount = 0
foreach ($note in $notes) {
    $body = Get-Content -Raw -Encoding UTF8 -LiteralPath $note.FullName
    foreach ($match in [regex]::Matches($body, '\[\[([^]|#]+)')) {
        $linkCount++
        $link = $match.Groups[1].Value.Trim()
        $filename = $link
        if (-not $filename.EndsWith('.md')) { $filename += '.md' }
        $candidates = @(
            (Join-Path $note.DirectoryName $filename),
            (Join-Path $brainRoot $filename),
            (Join-Path $project $filename)
        )
        $exists = @($candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }).Count -gt 0
        if (-not $exists -and $link -notmatch '[/\\]') {
            $matchesByName = @($notes | Where-Object { $_.Name -eq $filename })
            $exists = $matchesByName.Count -eq 1
        }
        if (-not $exists) { $problems.Add("Enlace roto o ambiguo en $($note.Name): $link") }
    }
}

$validationHeading = 'Validaci' + [char]243 + 'n'
$acceptanceHeading = 'Objetivo y aceptaci' + [char]243 + 'n'
$schemas = @{
    '08_HANDOFF.md' = @('Control','Hecho',$validationHeading,'Pendiente','Primer paso','Bloqueos y procesos')
}
foreach ($name in $schemas.Keys) {
    $path = Join-Path $brainRoot $name
    if (Test-Path -LiteralPath $path) {
        $body = Get-Content -Raw -Encoding UTF8 -LiteralPath $path
        foreach ($heading in $schemas[$name]) {
            if ($body -notmatch ('(?m)^## ' + [regex]::Escape($heading) + '\r?$')) {
                $problems.Add("Falta seccion '$heading' en $name")
            }
        }
        if ($body -notmatch '(?m)^- Estado: (en_curso|lista_para_relevo|bloqueada|hecha)\.?\r?$') {
            $problems.Add("Estado invalido en $name")
        }
        if ($body -notmatch '\[\[tasks/[^\]]+\]\]') { $problems.Add('El relevo debe enlazar una ficha en tasks/') }
    }
}
$taskHeadings = @('Control',$acceptanceHeading,'Archivos y alcance','Checkpoint',$validationHeading,'Pendiente y primer paso','Bloqueos y procesos','Cierre')
$tasks = @($notes | Where-Object { $_.DirectoryName -eq (Join-Path $brainRoot 'tasks') })
foreach ($task in $tasks) {
    $body = Get-Content -Raw -Encoding UTF8 -LiteralPath $task.FullName
    foreach ($heading in $taskHeadings) {
        if ($body -notmatch ('(?m)^## ' + [regex]::Escape($heading) + '\r?$')) {
            $problems.Add("Falta '$heading' en $($task.Name)")
        }
    }
    if ($body -notmatch '(?m)^- Estado: (en_curso|lista_para_relevo|bloqueada|hecha)\.?\r?$') {
        $problems.Add("Estado invalido en $($task.Name)")
    }
}
$entrypoints = @{ 'AGENTS.md' = 'brain/08_HANDOFF.md'; 'CLAUDE.md' = '@AGENTS.md'; '.agents/rules/brain.md' = 'AGENTS.md' }
foreach ($entry in $entrypoints.Keys) {
    $path = Join-Path $project $entry
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { $problems.Add("Falta $entry"); continue }
    $body = Get-Content -Raw -Encoding UTF8 -LiteralPath $path
    if (-not $body.Contains($entrypoints[$entry])) { $problems.Add("Entrada desconectada: $entry") }
    if ($entry -eq '.agents/rules/brain.md' -and $body -notmatch '(?m)^trigger: always_on\r?$') {
        $problems.Add('La regla de Antigravity debe declarar trigger: always_on')
    }
}
foreach ($jsonFile in @('app.json', 'templates.json', 'graph.json')) {
    try {
        Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $project ".obsidian/$jsonFile") | ConvertFrom-Json | Out-Null
    } catch { $problems.Add("Configuracion Obsidian invalida: $jsonFile") }
}
if ($problems.Count -gt 0) { throw ($problems -join [Environment]::NewLine) }
[pscustomobject]@{
    Status = 'OK'
    HomeCharacters = (Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $brainRoot '00_HOME.md')).Length
    HandoffCharacters = (Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $brainRoot '08_HANDOFF.md')).Length
    NotesChecked = $notes.Count
    LinksChecked = $linkCount
    TasksChecked = $tasks.Count
    AgentEntrypoints = $entrypoints.Count
} | Format-List
