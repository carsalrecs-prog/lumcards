import os
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class TestScriptSyntax(unittest.TestCase):
    def test_powershell_scripts_syntax(self):
        """Verifica que todos los scripts .ps1 del repositorio tengan sintaxis válida sin errores de parseo."""
        ps1_files = []
        for path in ROOT.rglob("*.ps1"):
            # Excluir entornos virtuales o dependencias externas si existieran
            parts = set(path.parts)
            if {".venv", "node_modules", "vendor"}.intersection(parts):
                continue
            ps1_files.append(path)

        self.assertGreater(len(ps1_files), 0, "No se encontraron scripts .ps1 para validar.")

        for ps1 in ps1_files:
            cmd = [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                f"& {{ param($p) $e = $null; $t = $null; [System.Management.Automation.Language.Parser]::ParseFile($p, [ref]$t, [ref]$e); if ($e.Count -gt 0) {{ foreach ($err in $e) {{ Write-Error $err.Message }}; exit 1 }} }} -p '{ps1}'"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(
                result.returncode,
                0,
                f"Error de sintaxis de PowerShell en {ps1.relative_to(ROOT)}:\n{result.stderr}\n{result.stdout}"
            )

if __name__ == "__main__":
    unittest.main()
