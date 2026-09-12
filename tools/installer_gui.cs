using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace LumcardsInstaller
{
    public class InstallerForm : Form
    {
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblDest;
        private TextBox txtDest;
        private Button btnBrowse;
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkLaunch;
        private ProgressBar progressBar;
        private Label lblStatus;
        private Button btnInstall;
        private Button btnCancel;
        private Panel headerPanel;
        private bool installing;

        private static readonly string[] AppFiles = new string[] {
            "Lumcards.exe", "Lumcards.exe.config", "Cerrar Lumcards.exe",
            "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll", "WebView2Loader.dll",
            "server.py", "engine.py", "native_image_occlusion.py", "text_import.py", "clean_anki_importer.py", "practice_store.py", "start.ps1", "stop.ps1",
            "requirements.txt", "requirements-lock.txt", "README.md", "IDEAS.md", "IMAGE_OCCLUSION_SOURCES.md", "COMMERCIAL_ROADMAP.md",
            "INICIAR LUMCARDS.cmd", "CERRAR LUMCARDS.cmd", "Desinstalar Lumcards.cmd",
            "installer.ps1", "uninstall.ps1", "Instalar Lumcards.cmd", "Instalador Lumcards.exe",
            @"tools\launcher.cs", @"tools\installer_gui.cs", @"tools\close_launcher.cs",
            @"tools\build-desktop.ps1", @"tools\desktop.manifest",
            @"tools\vendor\webview2\LICENSE.txt", @"tools\vendor\webview2\version.json",
            @"tools\vendor\webview2\Microsoft.Web.WebView2.Core.dll",
            @"tools\vendor\webview2\Microsoft.Web.WebView2.WinForms.dll",
            @"tools\vendor\webview2\WebView2Loader.dll"
        };
        private static readonly string[] AppDirectories = new string[] { "assets", "dist", ".venv" };

        public InstallerForm()
        {
            InitializeComponent();
            this.FormClosing += (s, e) => { if (installing) e.Cancel = true; };
        }

        private void InitializeComponent()
        {
            this.Text = "Instalador de Lumcards";
            this.Size = new Size(540, 430);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular, GraphicsUnit.Point);
            this.BackColor = Color.FromArgb(248, 250, 252);

            // Icono si existe en disco o extraer
            try
            {
                string ico = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"assets\icon.ico");
                if (File.Exists(ico)) this.Icon = new Icon(ico);
            }
            catch { }

            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 85;
            headerPanel.BackColor = Color.FromArgb(99, 102, 241); // Lumcards Indigo

            lblTitle = new Label();
            lblTitle.Text = "Lumcards";
            lblTitle.Font = new Font("Segoe UI", 18F, FontStyle.Bold, GraphicsUnit.Point);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(24, 14);
            lblTitle.AutoSize = true;

            lblSubtitle = new Label();
            lblSubtitle.Text = "Tu espacio personal de aprendizaje y memorización en Windows";
            lblSubtitle.Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point);
            lblSubtitle.ForeColor = Color.FromArgb(238, 242, 255);
            lblSubtitle.Location = new Point(26, 48);
            lblSubtitle.AutoSize = true;

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSubtitle);
            this.Controls.Add(headerPanel);

            // Carpeta de instalación
            lblDest = new Label();
            lblDest.Text = "Carpeta de instalación:";
            lblDest.Location = new Point(24, 105);
            lblDest.AutoSize = true;
            this.Controls.Add(lblDest);

            string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\Lumcards");
            txtDest = new TextBox();
            txtDest.Text = defaultPath;
            txtDest.Location = new Point(24, 128);
            txtDest.Size = new Size(380, 26);
            this.Controls.Add(txtDest);

            btnBrowse = new Button();
            btnBrowse.Text = "Examinar…";
            btnBrowse.Location = new Point(412, 126);
            btnBrowse.Size = new Size(90, 28);
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtDest.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtDest.Text = fbd.SelectedPath;
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            // Opciones
            chkDesktop = new CheckBox();
            chkDesktop.Text = "Crear acceso directo en el Escritorio";
            chkDesktop.Checked = true;
            chkDesktop.Location = new Point(26, 175);
            chkDesktop.AutoSize = true;
            this.Controls.Add(chkDesktop);

            chkStartMenu = new CheckBox();
            chkStartMenu.Text = "Crear acceso directo en el Menú Inicio";
            chkStartMenu.Checked = true;
            chkStartMenu.Location = new Point(26, 205);
            chkStartMenu.AutoSize = true;
            this.Controls.Add(chkStartMenu);

            chkLaunch = new CheckBox();
            chkLaunch.Text = "Iniciar Lumcards al terminar la instalación";
            chkLaunch.Checked = true;
            chkLaunch.Location = new Point(26, 235);
            chkLaunch.AutoSize = true;
            this.Controls.Add(chkLaunch);

            // Barra de progreso y estado
            progressBar = new ProgressBar();
            progressBar.Location = new Point(24, 280);
            progressBar.Size = new Size(478, 18);
            progressBar.Visible = false;
            this.Controls.Add(progressBar);

            lblStatus = new Label();
            lblStatus.Text = "Requiere Windows x64, .NET 4.8 y Microsoft Edge WebView2 Runtime.";
            lblStatus.ForeColor = Color.FromArgb(100, 116, 139);
            lblStatus.Location = new Point(24, 305);
            lblStatus.Size = new Size(478, 30);
            this.Controls.Add(lblStatus);

            // Botones inferiores
            btnCancel = new Button();
            btnCancel.Text = "Cancelar";
            btnCancel.Location = new Point(316, 340);
            btnCancel.Size = new Size(88, 32);
            btnCancel.Click += (s, e) => this.Close();
            this.Controls.Add(btnCancel);

            btnInstall = new Button();
            btnInstall.Text = "Instalar";
            btnInstall.BackColor = Color.FromArgb(99, 102, 241);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold, GraphicsUnit.Point);
            btnInstall.Location = new Point(412, 340);
            btnInstall.Size = new Size(90, 32);
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            string sourceDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            string targetDir = txtDest.Text.Trim().TrimEnd('\\');

            try
            {
                if (string.IsNullOrEmpty(targetDir)) throw new ArgumentException("Selecciona una carpeta de instalación.");
                targetDir = Path.GetFullPath(targetDir).TrimEnd('\\');
                sourceDir = Path.GetFullPath(sourceDir).TrimEnd('\\');
                if (targetDir.Equals(Path.GetPathRoot(targetDir).TrimEnd('\\'), StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException("Selecciona una carpeta de aplicación, no la raíz de una unidad.");
                if (targetDir.StartsWith(sourceDir + "\\", StringComparison.OrdinalIgnoreCase) || sourceDir.StartsWith(targetDir + "\\", StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException("Usa una carpeta separada de la carpeta de origen o la misma ubicación para modo portátil.");
                foreach (string name in new string[] { "Lumcards.exe", "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll", "WebView2Loader.dll", "server.py", "start.ps1" })
                    if (!File.Exists(Path.Combine(sourceDir, name)))
                        throw new FileNotFoundException("El paquete de escritorio está incompleto: falta " + name + ". Ejecuta tools\\build-desktop.ps1 antes de instalar.");
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "No se puede instalar", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            bool createDesktop = chkDesktop.Checked;
            bool createStartMenu = chkStartMenu.Checked;
            bool launchAfter = chkLaunch.Checked;
            installing = true;
            btnCancel.Enabled = false;
            btnInstall.Enabled = false;
            btnBrowse.Enabled = false;
            txtDest.Enabled = false;
            chkDesktop.Enabled = false;
            chkStartMenu.Enabled = false;
            chkLaunch.Enabled = false;
            progressBar.Visible = true;
            progressBar.Style = ProgressBarStyle.Marquee;
            lblStatus.Text = "Copiando archivos de la aplicación…";

            Thread worker = new Thread(() =>
            {
                try
                {
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    // Copiar solo el programa; data nunca se distribuye ni se sobreescribe.
                    // La misma ubicación sirve como modo portátil: solo crea accesos.
                    if (!sourceDir.Equals(targetDir, StringComparison.OrdinalIgnoreCase))
                    {
                        foreach (string name in AppFiles)
                        {
                            string sourcePath = Path.Combine(sourceDir, name);
                            if (File.Exists(sourcePath))
                            {
                                string destinationPath = Path.Combine(targetDir, name);
                                Directory.CreateDirectory(Path.GetDirectoryName(destinationPath));
                                File.Copy(sourcePath, destinationPath, true);
                            }
                        }
                        foreach (string name in AppDirectories)
                        {
                            string sourcePath = Path.Combine(sourceDir, name);
                            if (Directory.Exists(sourcePath)) CopyDirectory(sourcePath, Path.Combine(targetDir, name));
                        }
                    }

                    // Crear accesos directos
                    string targetExe = Path.Combine(targetDir, "Lumcards.exe");
                    string iconPath = Path.Combine(targetDir, @"assets\icon.ico");
                    if (!File.Exists(iconPath)) iconPath = targetExe;

                    if (createDesktop)
                    {
                        string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                        CreateShortcut(Path.Combine(desktopPath, "Lumcards.lnk"), targetExe, "", targetDir, iconPath, "Lumcards · Tu espacio de aprendizaje");
                    }

                    if (createStartMenu)
                    {
                        string programsPath = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                        string lumMenu = Path.Combine(programsPath, "Lumcards");
                        if (!Directory.Exists(lumMenu)) Directory.CreateDirectory(lumMenu);

                        CreateShortcut(Path.Combine(lumMenu, "Lumcards.lnk"), targetExe, "", targetDir, iconPath, "Lumcards · Tu espacio de aprendizaje");
                        string closeExe = Path.Combine(targetDir, "Cerrar Lumcards.exe");
                        if (File.Exists(closeExe))
                        {
                            CreateShortcut(Path.Combine(lumMenu, "Cerrar Lumcards.lnk"), closeExe, "", targetDir, iconPath, "Cerrar Lumcards");
                        }
                    }

                    // Registrar desinstalador en Windows
                    RegisterUninstall(targetDir);

                    this.Invoke(new Action(() =>
                    {
                        installing = false;
                        btnCancel.Enabled = true;
                        btnCancel.Text = "Cerrar";
                        progressBar.Style = ProgressBarStyle.Blocks;
                        progressBar.Value = 100;
                        lblStatus.Text = "¡Instalación completada con éxito!";
                        lblStatus.ForeColor = Color.FromArgb(22, 163, 74);

                        btnInstall.Text = "Cerrar";
                        btnInstall.Enabled = true;
                        btnInstall.Click -= BtnInstall_Click;
                        btnInstall.Click += (s, ev) => this.Close();

                        if (launchAfter)
                        {
                            try
                            {
                                Process.Start(new ProcessStartInfo(targetExe) { WorkingDirectory = targetDir });
                            }
                            catch (Exception launchError)
                            {
                                MessageBox.Show("La instalación terminó, pero no se pudo abrir la aplicación: " + launchError.Message, "Lumcards", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                            }
                        }
                    }));
                }
                catch (Exception ex)
                {
                    this.Invoke(new Action(() =>
                    {
                        installing = false;
                        btnCancel.Enabled = true;
                        btnBrowse.Enabled = true;
                        txtDest.Enabled = true;
                        chkDesktop.Enabled = true;
                        chkStartMenu.Enabled = true;
                        chkLaunch.Enabled = true;
                        progressBar.Visible = false;
                        lblStatus.Text = "Error: " + ex.Message;
                        lblStatus.ForeColor = Color.Red;
                        btnInstall.Enabled = true;
                    }));
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        private static void CopyDirectory(string source, string destination)
        {
            if (!Directory.Exists(destination)) Directory.CreateDirectory(destination);
            foreach (string file in Directory.GetFiles(source))
            {
                if ((File.GetAttributes(file) & FileAttributes.ReparsePoint) != 0 || file.EndsWith(".pyc", StringComparison.OrdinalIgnoreCase)) continue;
                string dest = Path.Combine(destination, Path.GetFileName(file));
                File.Copy(file, dest, true);
            }
            foreach (string dir in Directory.GetDirectories(source))
            {
                if ((File.GetAttributes(dir) & FileAttributes.ReparsePoint) != 0 || Path.GetFileName(dir).Equals("__pycache__", StringComparison.OrdinalIgnoreCase)) continue;
                string dest = Path.Combine(destination, Path.GetFileName(dir));
                CopyDirectory(dir, dest);
            }
        }

        private static void CreateShortcut(string shortcutPath, string targetPath, string args, string workDir, string iconPath, string desc)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic sc = shell.CreateShortcut(shortcutPath);
                sc.TargetPath = targetPath;
                sc.Arguments = args;
                sc.WorkingDirectory = workDir;
                if (!string.IsNullOrEmpty(iconPath) && File.Exists(iconPath))
                {
                    sc.IconLocation = iconPath + ",0";
                }
                sc.Description = desc;
                sc.Save();
                Marshal.ReleaseComObject(sc);
                Marshal.ReleaseComObject(shell);
            }
            catch { }
        }

        private static void RegisterUninstall(string appDir)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Lumcards"))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "Lumcards");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "Lumcards");
                        key.SetValue("DisplayIcon", Path.Combine(appDir, @"assets\icon.ico"));
                        key.SetValue("InstallLocation", appDir);
                        key.SetValue("UninstallString", string.Format("powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"{0}\\uninstall.ps1\"", appDir));
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
