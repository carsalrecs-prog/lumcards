import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class InstallerPayloadTests(unittest.TestCase):
    def test_powershell_installer_copies_and_requires_clean_engine(self):
        source = (ROOT / "installer.ps1").read_text(encoding="utf-8-sig")
        payload = re.search(r"\$appFiles\s*=\s*@\((.*?)\)\s*\n\$appDirectories", source, re.S)
        required = re.search(r"foreach\s*\(\$requiredFile\s+in\s+@\((.*?)\)\)", source, re.S)

        self.assertIsNotNone(payload, "No se encontró la lista de archivos del instalador PowerShell")
        self.assertIsNotNone(required, "No se encontró la validación del paquete PowerShell")
        self.assertIn("'clean_engine.py'", payload.group(1))
        self.assertIn("'clean_engine.py'", required.group(1))

    def test_gui_installer_copies_and_requires_clean_engine(self):
        source = (ROOT / "tools" / "installer_gui.cs").read_text(encoding="utf-8-sig")
        payload = re.search(r"AppFiles\s*=\s*new string\[\]\s*\{(.*?)\};", source, re.S)
        required = re.search(r"foreach\s*\(string name in new string\[\]\s*\{(.*?)\}\)", source, re.S)

        self.assertIsNotNone(payload, "No se encontró la lista de archivos del instalador gráfico")
        self.assertIsNotNone(required, "No se encontró la validación del paquete gráfico")
        self.assertIn('"clean_engine.py"', payload.group(1))
        self.assertIn('"clean_engine.py"', required.group(1))

    def test_desktop_navigation_bypasses_a_stale_service_worker_shell(self):
        source = (ROOT / "tools" / "launcher.cs").read_text(encoding="utf-8-sig")

        self.assertIn('navigationUri.Query = "desktopLaunch=" + Guid.NewGuid().ToString("N")', source)
        self.assertIn("web.CoreWebView2.Navigate(navigationUri.Uri.ToString())", source)


if __name__ == "__main__":
    unittest.main()
