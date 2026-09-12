using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

namespace LumcardsClose
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                // El host cierra su ventana, bandeja y servicio de forma ordenada.
                using (EventWaitHandle closeEvent = EventWaitHandle.OpenExisting(@"Local\LumcardsDesktopClose"))
                {
                    closeEvent.Set();
                    if (!WaitForDesktopExit())
                    {
                        Environment.ExitCode = 1;
                        MessageBox.Show("Lumcards no terminó de cerrar en dos minutos. Espera a que termine de guardar y vuelve a intentarlo antes de desinstalar o actualizar.", "No se pudo cerrar Lumcards", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                    return;
                }
            }
            catch (WaitHandleCannotBeOpenedException) { }
            catch (UnauthorizedAccessException) { }

            try
            {
                HttpWebRequest health = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8765/api/health");
                health.Timeout = 2000;
                using (WebResponse response = health.GetResponse())
                using (StreamReader reader = new StreamReader(response.GetResponseStream()))
                {
                    if (!Regex.IsMatch(reader.ReadToEnd(), "\"app\"\\s*:\\s*\"(lumcards|anki2)\"")) return;
                }
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8765/api/shutdown");
                req.Method = "POST";
                req.Timeout = 60000;
                req.ContentType = "application/json";
                req.Headers.Add("X-Lumcards-Request", "1");
                req.Headers.Add("X-Anki-Request", "1");
                byte[] body = System.Text.Encoding.UTF8.GetBytes("{}");
                req.ContentLength = body.Length;
                using (Stream stream = req.GetRequestStream()) stream.Write(body, 0, body.Length);
                using (req.GetResponse()) { }
            }
            catch { }
        }

        private static bool WaitForDesktopExit()
        {
            try
            {
                using (Mutex desktop = Mutex.OpenExisting(@"Local\LumcardsDesktopWindow"))
                {
                    bool acquired = false;
                    try
                    {
                        try { acquired = desktop.WaitOne(120000); }
                        catch (AbandonedMutexException) { acquired = true; }
                        return acquired;
                    }
                    finally { if (acquired) desktop.ReleaseMutex(); }
                }
            }
            catch (WaitHandleCannotBeOpenedException) { return true; }
            catch (UnauthorizedAccessException) { return false; }
        }
    }
}
