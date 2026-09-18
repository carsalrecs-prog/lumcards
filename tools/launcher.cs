using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace LumcardsDesktop
{
    internal sealed class Options
    {
        internal string AppDir = AppDomain.CurrentDomain.BaseDirectory;
        internal Uri Url = new Uri("http://127.0.0.1:8765/");
        internal bool SelfTest, NoServer;
        internal string Report;
        internal string Profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Lumcards\WebView2");
        internal static Options Parse(string[] args)
        {
            Options result = new Options();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--self-test") result.SelfTest = true;
                else if (args[i] == "--no-server") result.NoServer = true;
                else if (args[i] == "--url" && i + 1 < args.Length) result.Url = new Uri(args[++i]);
                else if (args[i] == "--report" && i + 1 < args.Length) result.Report = Path.GetFullPath(args[++i]);
                else if (args[i] == "--profile" && i + 1 < args.Length) result.Profile = Path.GetFullPath(args[++i]);
                else throw new ArgumentException("Opción de inicio no válida: " + args[i]);
            }
            if (result.Url.Scheme != "http" || !result.Url.IsLoopback) throw new ArgumentException("La ventana solo puede abrir el servidor local de Lumcards.");
            return result;
        }
    }

    internal static class Program
    {
        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        private static extern int SetCurrentProcessExplicitAppUserModelID(string id);
        [STAThread]
        private static void Main(string[] args)
        {
            try
            {
                Options options = Options.Parse(args);
                bool first;
                string suffix = options.SelfTest ? ".Test." + Process.GetCurrentProcess().Id : "";
                using (Mutex mutex = new Mutex(true, @"Local\LumcardsDesktopWindow" + suffix, out first))
                {
                    if (!first)
                    {
                        for (int i = 0; i < 20; i++)
                        {
                            try { using (EventWaitHandle activate = EventWaitHandle.OpenExisting(@"Local\LumcardsDesktopActivate")) activate.Set(); return; }
                            catch (WaitHandleCannotBeOpenedException) { Thread.Sleep(100); }
                        }
                        return;
                    }
                    SetCurrentProcessExplicitAppUserModelID("Lumcards.Desktop.App");
                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    using (DesktopWindow window = new DesktopWindow(options)) Application.Run(window);
                }
            }
            catch (Exception error)
            {
                MessageBox.Show("No se pudo abrir Lumcards.\n\n" + error.Message, "Lumcards", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.ExitCode = 1;
            }
        }
    }

    internal sealed class DesktopWindow : Form
    {
        private readonly Options options;
        private readonly WebView2 web;
        private readonly Panel loading;
        private readonly Label status;
        private readonly Button retry;
        private NotifyIcon tray;
        private EventWaitHandle activateEvent, closeEvent;
        private RegisteredWaitHandle activateWait, closeWait;
        private bool exitRequested, allowClose, initializing, trayExplained, testFinished, eventsBound;
        private Task startupTask;
        private readonly string statePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Lumcards\window.json");
        private readonly JavaScriptSerializer json = new JavaScriptSerializer();

        internal DesktopWindow(Options options)
        {
            this.options = options;
            Text = "Lumcards"; StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1320, 900); MinimumSize = new Size(860, 600);
            AutoScaleMode = AutoScaleMode.Dpi; BackColor = Color.FromArgb(247, 248, 251);
            string iconPath = Path.Combine(options.AppDir, @"assets\icon.ico");
            if (File.Exists(iconPath)) Icon = new Icon(iconPath);
            if (!options.SelfTest) RestoreWindow();
            else { ShowInTaskbar = false; Opacity = 0; }
            web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = BackColor };
            Controls.Add(web);
            loading = new Panel { Dock = DockStyle.Fill, BackColor = BackColor };
            TableLayoutPanel center = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 5 };
            center.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
            center.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            center.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            center.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            center.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
            Label title = new Label { Text = "Lumcards", AutoSize = true, Anchor = AnchorStyles.None, Font = new Font("Segoe UI", 30, FontStyle.Bold), ForeColor = Color.FromArgb(79, 70, 229), Margin = new Padding(20) };
            status = new Label { Text = "Abriendo tu biblioteca…", AutoSize = true, MaximumSize = new Size(660, 0), Anchor = AnchorStyles.None, Font = new Font("Segoe UI", 12), TextAlign = ContentAlignment.MiddleCenter, Margin = new Padding(20) };
            retry = new Button { Text = "Volver a intentar", AutoSize = true, Anchor = AnchorStyles.None, Visible = false, Padding = new Padding(12, 6, 12, 6) };
            retry.Click += async (sender, e) => await InitializeAsync();
            center.Controls.Add(title, 0, 1); center.Controls.Add(status, 0, 2); center.Controls.Add(retry, 0, 3);
            loading.Controls.Add(center); Controls.Add(loading); loading.BringToFront();
            Shown += async (sender, e) => { if (!options.SelfTest) SetupTray(); await InitializeAsync(); };
            FormClosing += OnClosing;
            FormClosed += (sender, e) => Cleanup();
        }

        private bool IsLocal(string url)
        {
            Uri uri;
            return Uri.TryCreate(url, UriKind.Absolute, out uri) && uri.Scheme == options.Url.Scheme && uri.Host == options.Url.Host && uri.Port == options.Url.Port;
        }

        private async Task InitializeAsync()
        {
            if (initializing) return;
            initializing = true; retry.Visible = false; loading.Visible = true;
            try
            {
                CoreWebView2Environment.GetAvailableBrowserVersionString();
                status.Text = "Preparando tu biblioteca…";
                startupTask = EnsureServerAsync();
                await startupTask;
                if (exitRequested || IsDisposed) return;
                status.Text = "Abriendo tu ventana de estudio…";
                Directory.CreateDirectory(options.Profile);
                if (web.CoreWebView2 == null)
                {
                    CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, options.Profile);
                    await web.EnsureCoreWebView2Async(environment);
                }
                CoreWebView2Settings settings = web.CoreWebView2.Settings;
                settings.AreDefaultContextMenusEnabled = false; settings.AreDevToolsEnabled = false;
                settings.AreBrowserAcceleratorKeysEnabled = false; settings.IsStatusBarEnabled = false;
                settings.IsWebMessageEnabled = false; settings.AreHostObjectsAllowed = false;
                if (!eventsBound)
                {
                    eventsBound = true;
                    web.CoreWebView2.NavigationStarting += (sender, e) => { if (!IsLocal(e.Uri)) { e.Cancel = true; if (e.IsUserInitiated) OpenExternal(e.Uri); } };
                    web.CoreWebView2.NewWindowRequested += (sender, e) => { e.Handled = true; if (e.IsUserInitiated) { if (IsLocal(e.Uri)) web.CoreWebView2.Navigate(e.Uri); else OpenExternal(e.Uri); } };
                    web.CoreWebView2.DownloadStarting += OnDownload;
                    web.CoreWebView2.NavigationCompleted += async (sender, e) =>
                    {
                        if (e.IsSuccess) { loading.Visible = false; if (options.SelfTest && !testFinished) await FinishSelfTestAsync(); }
                        else if (e.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled && e.WebErrorStatus != CoreWebView2WebErrorStatus.ConnectionAborted) ShowError("No se pudo cargar la biblioteca (" + e.WebErrorStatus + "). El servidor local puede estar cerrado.");
                    };
                    web.CoreWebView2.ProcessFailed += (sender, e) => ShowError("El visor se cerró inesperadamente. Tus tarjetas siguen guardadas. Vuelve a abrir la aplicación.");
                }
                UriBuilder navigationUri = new UriBuilder(options.Url);
                navigationUri.Query = "desktopLaunch=" + Guid.NewGuid().ToString("N");
                web.CoreWebView2.Navigate(navigationUri.Uri.ToString());
            }
            catch (WebView2RuntimeNotFoundException) { ShowError("Falta Microsoft Edge WebView2 Runtime, el visor integrado de la aplicación. Instálalo desde la página oficial de Microsoft indicada en README.md y vuelve a abrir Lumcards."); }
            catch (Exception error) { ShowError(error.Message); }
            finally { initializing = false; }
        }

        private async Task<bool> IsHealthyAsync()
        {
            return await Task.Run(() =>
            {
                try
                {
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create(new Uri(options.Url, "/api/health"));
                    request.Timeout = 2500; request.ReadWriteTimeout = 2500; request.Proxy = null;
                    using (WebResponse response = request.GetResponse())
                    using (StreamReader reader = new StreamReader(response.GetResponseStream()))
                    {
                        Dictionary<string, object> body = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(reader.ReadToEnd());
                        string appName = body.ContainsKey("app") ? Convert.ToString(body["app"]) : "";
                        return (appName == "lumcards" || appName == "anki2") && body.ContainsKey("ok") && Convert.ToBoolean(body["ok"]);
                    }
                }
                catch { return false; }
            });
        }

        private async Task EnsureServerAsync()
        {
            if (await IsHealthyAsync()) return;
            if (exitRequested) return;
            if (options.NoServer) throw new InvalidOperationException("El servidor local de prueba no está disponible.");
            string script = Path.Combine(options.AppDir, "start.ps1");
            if (!File.Exists(script)) throw new FileNotFoundException("Falta start.ps1. Reinstala la aplicación conservando la carpeta data.");
            ProcessStartInfo start = new ProcessStartInfo {
                FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe"),
                Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\" -NoBrowser",
                WorkingDirectory = options.AppDir, UseShellExecute = false, CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden
            };
            using (Process process = Process.Start(start))
            {
                for (int attempt = 0; attempt < 100; attempt++)
                {
                    await Task.Delay(700);
                    if (await IsHealthyAsync()) return;
                    if (process.HasExited && process.ExitCode != 0)
                    {
                        if (await IsHealthyAsync()) return;
                        throw new InvalidOperationException("No se pudo iniciar la biblioteca. Revisa data\\server-error.log en la carpeta de la aplicación.");
                    }
                }
            }
            throw new TimeoutException("La biblioteca tarda más de lo esperado. Espera un momento y vuelve a intentarlo.");
        }

        private void OnDownload(object sender, CoreWebView2DownloadStartingEventArgs e)
        {
            CoreWebView2Deferral deferral = e.GetDeferral();
            BeginInvoke(new Action(() =>
            {
                try
                {
                    using (SaveFileDialog dialog = new SaveFileDialog())
                    {
                        dialog.FileName = Path.GetFileName(e.ResultFilePath); dialog.Filter = "Todos los archivos|*.*"; dialog.OverwritePrompt = true;
                        e.Handled = true;
                        if (dialog.ShowDialog(this) == DialogResult.OK) e.ResultFilePath = dialog.FileName; else e.Cancel = true;
                    }
                }
                finally { deferral.Complete(); }
            }));
        }

        private static void OpenExternal(string url)
        {
            Uri uri;
            if (!Uri.TryCreate(url, UriKind.Absolute, out uri) || (uri.Scheme != "https" && uri.Scheme != "http")) return;
            try { Process.Start(new ProcessStartInfo(uri.ToString()) { UseShellExecute = true }); } catch { }
        }

        private void SetupTray()
        {
            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("Abrir Lumcards", null, (sender, e) => RestoreApp());
            menu.Items.Add("Carpeta de datos", null, (sender, e) => Process.Start("explorer.exe", "\"" + Path.Combine(options.AppDir, "data") + "\""));
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Salir y detener el servidor", null, async (sender, e) => await ExitAsync());
            tray = new NotifyIcon { Text = "Lumcards", Icon = Icon, ContextMenuStrip = menu, Visible = true };
            tray.DoubleClick += (sender, e) => RestoreApp();
            activateEvent = new EventWaitHandle(false, EventResetMode.AutoReset, @"Local\LumcardsDesktopActivate");
            closeEvent = new EventWaitHandle(false, EventResetMode.AutoReset, @"Local\LumcardsDesktopClose");
            activateWait = ThreadPool.RegisterWaitForSingleObject(activateEvent, (state, timedOut) => SafeInvoke(RestoreApp), null, -1, false);
            closeWait = ThreadPool.RegisterWaitForSingleObject(closeEvent, (state, timedOut) => SafeInvoke(async () => await ExitAsync()), null, -1, false);
        }
        private void SafeInvoke(Action action) { try { if (!IsDisposed) BeginInvoke(action); } catch (InvalidOperationException) { } }
        private void RestoreApp() { Show(); if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal; Activate(); BringToFront(); }

        private async Task ExitAsync()
        {
            if (exitRequested) return;
            exitRequested = true;
            status.Text = "Cerrando la biblioteca…";
            if (startupTask != null)
            {
                try { await startupTask; }
                catch (Exception error) { Log("Inicio pendiente al cerrar: " + error.Message); }
            }
            try
            {
                await Task.Run(() =>
                {
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create(new Uri(options.Url, "/api/shutdown"));
                    request.Method = "POST"; request.ContentType = "application/json"; request.Headers["X-Lumcards-Request"] = "1"; request.Headers["X-Anki-Request"] = "1"; request.Timeout = 30000; request.Proxy = null;
                    byte[] body = Encoding.UTF8.GetBytes("{}"); request.ContentLength = body.Length;
                    using (Stream stream = request.GetRequestStream()) stream.Write(body, 0, body.Length);
                    using (request.GetResponse()) { }
                });
            }
            catch (Exception error) { Log("No se pudo detener el servidor: " + error.Message); }
            allowClose = true;
            Close();
        }

        private void OnClosing(object sender, FormClosingEventArgs e)
        {
            if (!options.SelfTest) SaveWindow();
            if (!allowClose && !options.SelfTest && e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                if (exitRequested) return;
                Hide();
                if (!trayExplained && tray != null)
                {
                    trayExplained = true;
                    tray.ShowBalloonTip(5000, "Lumcards sigue disponible", "Puedes volver a abrirlo desde el icono de la bandeja. Elige «Salir y detener el servidor» para cerrarlo por completo.", ToolTipIcon.Info);
                }
            }
        }

        private void RestoreWindow()
        {
            try
            {
                if (!File.Exists(statePath)) return;
                Dictionary<string, int> state = json.Deserialize<Dictionary<string, int>>(File.ReadAllText(statePath));
                Rectangle bounds = new Rectangle(state["x"], state["y"], Math.Max(860, state["width"]), Math.Max(600, state["height"]));
                foreach (Screen screen in Screen.AllScreens)
                    if (Rectangle.Intersect(screen.WorkingArea, bounds).Width >= 200 && Rectangle.Intersect(screen.WorkingArea, bounds).Height >= 150)
                    { StartPosition = FormStartPosition.Manual; Bounds = bounds; break; }
                if (state["maximized"] == 1) WindowState = FormWindowState.Maximized;
            }
            catch { }
        }
        private void SaveWindow()
        {
            try
            {
                Rectangle bounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                Directory.CreateDirectory(Path.GetDirectoryName(statePath));
                File.WriteAllText(statePath, json.Serialize(new { x = bounds.X, y = bounds.Y, width = bounds.Width, height = bounds.Height, maximized = WindowState == FormWindowState.Maximized ? 1 : 0 }));
            }
            catch { }
        }

        private async Task FinishSelfTestAsync()
        {
            testFinished = true;
            try
            {
                string result = "";
                for (int i = 0; i < 40; i++)
                {
                    result = await web.ExecuteScriptAsync("JSON.stringify({title:document.title,ready:!!document.querySelector('.app-layout'),width:innerWidth,origin:location.origin})");
                    Dictionary<string, object> state = json.Deserialize<Dictionary<string, object>>(json.Deserialize<string>(result));
                    if (Convert.ToBoolean(state["ready"]))
                    {
                        WriteReport(new { success = true, host = "WinForms WebView2", windowTitle = Text, source = web.Source.ToString(), page = state, processId = Process.GetCurrentProcess().Id, browserProcessId = web.CoreWebView2.BrowserProcessId });
                        exitRequested = true; Close(); return;
                    }
                    await Task.Delay(250);
                }
                throw new InvalidOperationException("El visor cargó la página, pero la biblioteca no terminó de abrirse: " + result);
            }
            catch (Exception error) { WriteReport(new { success = false, error = error.ToString() }); Environment.ExitCode = 1; exitRequested = true; Close(); }
        }
        private void WriteReport(object report)
        {
            if (String.IsNullOrEmpty(options.Report)) return;
            Directory.CreateDirectory(Path.GetDirectoryName(options.Report));
            File.WriteAllText(options.Report, json.Serialize(report), Encoding.UTF8);
        }
        private void ShowError(string message)
        {
            Log(message); status.Text = message; loading.Visible = true; loading.BringToFront(); retry.Visible = true;
            if (options.SelfTest) { WriteReport(new { success = false, error = message }); Environment.ExitCode = 1; exitRequested = true; Close(); }
        }
        private void Log(string message)
        {
            try { string folder = Path.GetDirectoryName(statePath); Directory.CreateDirectory(folder); File.AppendAllText(Path.Combine(folder, "desktop.log"), DateTime.Now.ToString("s") + " " + message + Environment.NewLine); } catch { }
        }
        private void Cleanup()
        {
            if (activateWait != null) activateWait.Unregister(null);
            if (closeWait != null) closeWait.Unregister(null);
            if (activateEvent != null) activateEvent.Dispose();
            if (closeEvent != null) closeEvent.Dispose();
            if (tray != null) { tray.Visible = false; tray.ContextMenuStrip.Dispose(); tray.Dispose(); }
            web.Dispose();
        }
    }
}
