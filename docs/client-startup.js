// Public OAuth client identifier. This is safe to ship; no client secret is used
// by the browser token flow.
window.LUMCARDS_DRIVE_CLIENT_ID = '702374747374-e4f826l9rpoa33ebmidnov2mb3ncq88h.apps.googleusercontent.com';

// Local startup works under the desktop Content-Security-Policy.
(() => {
  try { document.documentElement.classList.toggle('dark', localStorage.getItem('anki2-theme') === 'dark'); } catch (_) {}
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then(registration => registration.update()).catch(() => {});
    });
  }
})();
