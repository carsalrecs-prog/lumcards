/* ==========================================================================
   Lumcards Studio · Motor de Sincronización Tri-Storage (sync-manager.js)
   Soporte Multiplataforma: Web, Android (APK) y Windows Desktop
   1. Firebase: Autenticación, estadísticas, repasos y rachas en tiempo real.
   2. Google Drive: Almacenamiento gratuito de mazos grandes, fotos y audios en la cuenta del usuario ($0 costo de servidor).
   3. Local Device: Almacenamiento offline prioritario en el dispositivo.
   ========================================================================== */

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LumcardsSync = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Configuración predeterminada y llaves de almacenamiento
  const STORAGE_KEYS = {
    DRIVE_TOKEN: 'lumcards_gdrive_token',
    DRIVE_USER: 'lumcards_gdrive_user',
    FIREBASE_USER: 'lumcards_firebase_user',
    FIREBASE_CONFIG: 'lumcards_firebase_config',
    SYNC_CONFIG: 'lumcards_sync_config',
    OFFLINE_QUEUE: 'lumcards_offline_queue'
  };

  // ── 1. Proveedor de Almacenamiento Local (Dispositivo) ───────
  const DeviceStorageProvider = {
    name: 'device',
    label: 'Almacenamiento Local del Dispositivo',
    async getInfo() {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate();
          return {
            available: true,
            usedBytes: est.usage || 0,
            quotaBytes: est.quota || 0,
            percent: est.quota ? Math.round((est.usage / est.quota) * 100) : 0
          };
        } catch (_) {}
      }
      return { available: true, usedBytes: 0, quotaBytes: 0, percent: 0 };
    },
    async saveLocalDeck(deckId, data) {
      try {
        localStorage.setItem(`lumcards_deck_${deckId}`, JSON.stringify(data));
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    async loadLocalDeck(deckId) {
      const raw = localStorage.getItem(`lumcards_deck_${deckId}`);
      return raw ? JSON.parse(raw) : null;
    }
  };

  // ── 2. Proveedor de Google Drive Personal (User-Owned Cloud) ─
  const GoogleDriveProvider = {
    name: 'gdrive',
    label: 'Google Drive Personal del Usuario',
    // Public OAuth client ID, supplied by deployment configuration; never a client secret.
    clientId: '',
    folderName: 'Lumcards Mazos y Estudio',
    token: null,
    user: null,
    expiresAt: 0,
    authGeneration: 0,

    init() {
      // Retire legacy persistent/simulated credentials. OAuth tokens stay in memory.
      try {
        localStorage.removeItem(STORAGE_KEYS.DRIVE_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.DRIVE_USER);
      } catch (_) {}
    },

    isConnected() {
      this.init();
      if (this.token && Date.now() >= this.expiresAt) this.disconnect();
      return Boolean(this.token && this.user);
    },

    getUser() {
      return this.isConnected() ? this.user : null;
    },

    async signIn() {
      this.disconnect();
      const generation = this.authGeneration;
      const clientId = this.clientId || (typeof window !== 'undefined' && window.LUMCARDS_DRIVE_CLIENT_ID);
      if (!clientId || !/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(clientId)) {
        throw new Error('Google Drive todavía no está configurado en esta instalación.');
      }
      const oauth = typeof window !== 'undefined' && window.google?.accounts?.oauth2;
      if (!oauth) throw new Error('No se pudo cargar Google. Comprueba tu conexión y vuelve a intentarlo.');
      return new Promise((resolve, reject) => {
        const client = oauth.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          error_callback: () => reject(new Error('No se completó la autorización de Google. Vuelve a conectar Drive.')),
          callback: async (response) => {
            try {
              if (generation !== this.authGeneration) throw new Error('Conexión cancelada.');
              if (response.error || !response.access_token || !(Number(response.expires_in) > 0)) {
                throw new Error('Google no autorizó la conexión a Drive.');
              }
              const scopes = String(response.scope || '').split(/\s+/);
              if (!scopes.includes('https://www.googleapis.com/auth/drive.file')) {
                throw new Error('Se necesita permiso para gestionar las copias de Lumcards en Drive.');
              }
              const expiresAt = Date.now() + Number(response.expires_in) * 1000;
              const profile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              if (!profile.ok) throw new Error('No se pudo verificar la cuenta de Google.');
              const user = await profile.json();
              if (!user.email) throw new Error('Google no devolvió el correo de la cuenta.');
              if (generation !== this.authGeneration) throw new Error('Conexión cancelada.');
              this.token = response.access_token;
              this.expiresAt = expiresAt;
              this.user = user;
              resolve({ success: true, user });
            } catch (error) { reject(error); }
          }
        });
        client.requestAccessToken();
      });
    },

    signOut() { return this.disconnect(); },

    disconnect() {
      this.authGeneration++;
      this.token = null;
      this.user = null;
      this.expiresAt = 0;
      this.init();
      return { success: true };
    },

    async authorizedFetch(url, options = {}) {
      if (!this.isConnected()) throw new Error('Conecta Google Drive para continuar.');
      const token = this.token;
      const response = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        if (this.token === token) this.disconnect();
        throw new Error('La autorización de Google Drive caducó. Vuelve a conectar tu cuenta.');
      }
      return response;
    },

    uploadDeck(blob, filename) {
      return this.uploadDeckPackage(filename || `mazo_${Date.now()}.colpkg`, blob);
    },

    downloadDeck(fileId) {
      return this.downloadCloudDeck(fileId);
    },

    listFiles() {
      return this.listCloudDecks();
    },

    // Buscar o crear carpeta de Lumcards en el Drive del usuario
    async getOrCreateFolder() {
      if (!this.isConnected()) throw new Error('Conecta Google Drive para continuar.');
      const q = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${this.folderName}' and trashed = false`);
      const searchRes = await this.authorizedFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!searchRes.ok) throw new Error('No se pudo acceder a Google Drive. Puede que el token haya expirado.');
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Crear la carpeta
      const createRes = await this.authorizedFetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.folderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Carpeta oficial de Lumcards para sincronización de mazos, fotos y audio.'
        })
      });
      if (!createRes.ok) throw new Error('No se pudo crear la carpeta de Lumcards en Google Drive.');
      const folder = await createRes.json();
      return folder.id;
    },

    // Subir respaldo o paquete de mazo al Drive del usuario
    async uploadDeckPackage(filename, contentBlob, description = 'Respaldo de Lumcards') {
      // Si el usuario tiene un token real de Google OAuth
      if (!this.isConnected()) throw new Error('Conecta Google Drive para continuar.');
      {
        const folderId = await this.getOrCreateFolder();
        const metadata = {
          name: filename,
          parents: [folderId],
          description: description
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', contentBlob);

        const res = await this.authorizedFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
          body: form
        });

        if (!res.ok) throw new Error('No se pudo subir el mazo a Google Drive.');
        return await res.json();
      }

    },

    // Listar mazos disponibles en la carpeta de Drive
    async listCloudDecks() {
      if (!this.isConnected()) throw new Error('Conecta Google Drive para continuar.');
      {
        const folderId = await this.getOrCreateFolder();
        const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
        const res = await this.authorizedFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,modifiedTime,mimeType)&orderBy=modifiedTime desc`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        if (!res.ok) throw new Error('No se pudieron listar los mazos en Google Drive.');
        const data = await res.json();
        return data.files || [];
      }

    },

    // Descargar un mazo de Google Drive
    async downloadCloudDeck(fileId) {
      if (!this.isConnected()) throw new Error('Conecta Google Drive para continuar.');
      {
        const res = await this.authorizedFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        if (!res.ok) throw new Error('No se pudo descargar el archivo de Google Drive.');
        return await res.blob();
      }

    }
  };

  // ── 3. Proveedor de Firebase (Cloud Sync & Auth) ─────────────
  // Correo(s) con acceso total de administrador: aprueban/revocan el acceso
  // de otros usuarios (flujo de pago manual por Yape). Ver brain/03_DECISIONS.md
  // "Modelo de negocio: acceso pago manual + tienda de mazos" en el repositorio Lumcards.
  const ADMIN_EMAILS = ['carsal.recs@gmail.com'];

  const FirebaseProvider = {
    name: 'firebase',
    label: 'Nube Lumcards (Firebase)',
    user: null,
    config: null,
    access: null, // { approved, isAdmin, pending, note } — cache del último checkAccess()

    isAdminEmail(email) {
      return ADMIN_EMAILS.includes(String(email || '').toLowerCase().trim());
    },

    init() {
      try {
        const conf = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
        if (conf) this.config = JSON.parse(conf);
        const usr = localStorage.getItem(STORAGE_KEYS.FIREBASE_USER);
        if (usr) this.user = JSON.parse(usr);

        if (typeof window !== 'undefined' && window.firebase && !window.firebase.apps?.length) {
          window.firebase.initializeApp(this.getConfig());
          if (window.firebase.analytics) {
            try { window.firebase.analytics(); } catch (_) {}
          }
        }
      } catch (_) {}
    },

    setConfig(cfg) {
      this.config = cfg;
      localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(cfg));
    },

    getConfig() {
      // Reading configuration must not initialize the SDK: init() calls this method.
      if (!this.config) {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
          if (saved) this.config = JSON.parse(saved);
        } catch (_) {}
      }
      return this.config || {
        apiKey: "AIzaSyBw6a1fhczXknvFTYhVoPh8-gkOmxlWXA0",
        authDomain: "lumcards.firebaseapp.com",
        databaseURL: "https://lumcards-default-rtdb.firebaseio.com",
        projectId: "lumcards",
        storageBucket: "lumcards.firebasestorage.app",
        messagingSenderId: "702374747374",
        appId: "1:702374747374:web:9bc56c595e5b2bf511a7ff",
        measurementId: "G-S6BLY1XT49"
      };
    },

    isConnected() {
      this.init();
      return Boolean(this.user);
    },

    getUser() {
      this.init();
      return this.user;
    },

    // Inicio de sesión con correo / Google / Anónimo
    async login(email, password) {
      if (typeof window !== 'undefined' && window.firebase?.auth) {
        try {
          const auth = window.firebase.auth();
          const userCred = await auth.signInWithEmailAndPassword(email, password);
          this.user = { uid: userCred.user.uid, email: userCred.user.email, name: userCred.user.displayName || email.split('@')[0] };
          localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
          return { success: true, user: this.user };
        } catch (err) {
          if (err.code === 'auth/configuration-not-found') {
            console.warn('Firebase Auth sin activar en consola. Entrando en modo sesión local.');
            this.user = { uid: 'usr_' + Date.now(), email, name: email.split('@')[0], isLocalSession: true };
            localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
            return { success: true, user: this.user, notice: 'offline_auth_fallback' };
          }
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            throw new Error('Credenciales no encontradas. Si aún no tienes cuenta, pulsa en «Crear Cuenta».');
          }
          throw err;
        }
      }

      // Autenticación ligera local-friendly
      if (email && email.includes('@')) {
        this.user = { uid: 'usr_' + Date.now(), email, name: email.split('@')[0] };
        localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
        return { success: true, user: this.user };
      }
      throw new Error('Ingresa un correo electrónico válido para iniciar sesión.');
    },

    signIn(email, password) {
      return this.login(email, password);
    },

    async register(email, password, name) {
      if (typeof window !== 'undefined' && window.firebase?.auth) {
        try {
          const auth = window.firebase.auth();
          const userCred = await auth.createUserWithEmailAndPassword(email, password);
          if (name && userCred.user.updateProfile) await userCred.user.updateProfile({ displayName: name });
          this.user = { uid: userCred.user.uid, email: userCred.user.email, name: name || email.split('@')[0] };
          localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
          return { success: true, user: this.user };
        } catch (err) {
          if (err.code === 'auth/configuration-not-found') {
            this.user = { uid: 'usr_' + Date.now(), email, name: name || email.split('@')[0], isLocalSession: true };
            localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
            return { success: true, user: this.user, notice: 'offline_auth_fallback' };
          }
          if (err.code === 'auth/email-already-in-use') {
            throw new Error('Este correo ya está registrado. Pulsa arriba en «Iniciar Sesión» para acceder.');
          }
          throw err;
        }
      }

      this.user = { uid: 'usr_' + Date.now(), email, name: name || email.split('@')[0] };
      localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
      return { success: true, user: this.user };
    },

    async logout() {
      if (typeof window !== 'undefined' && window.firebase?.auth) {
        try { await window.firebase.auth().signOut(); } catch (_) {}
      }
      this.user = null;
      localStorage.removeItem(STORAGE_KEYS.FIREBASE_USER);
      return { success: true };
    },

    signOut() {
      return this.logout();
    },

    saveProgress(statsData) {
      return this.syncStats(statsData);
    },

    getProgress() {
      return this.pullStats();
    },

    // Sincronizar estadísticas y rachas con Cloud Firestore
    async syncStats(statsData) {
      if (!this.user) throw new Error('Inicia sesión en Lumcards para sincronizar tus estadísticas.');
      const payload = {
        userId: this.user.uid,
        updatedAt: new Date().toISOString(),
        stats: statsData
      };

      if (typeof window !== 'undefined' && window.firebase?.firestore) {
        const db = window.firebase.firestore();
        await db.collection('users').doc(this.user.uid).set(payload, { merge: true });
        return { success: true, syncedAt: payload.updatedAt };
      }

      localStorage.setItem(`lumcards_cloud_stats_${this.user.uid}`, JSON.stringify(payload));
      return { success: true, syncedAt: payload.updatedAt, localMock: true };
    },

    async pullStats() {
      if (!this.user) return null;
      if (typeof window !== 'undefined' && window.firebase?.firestore) {
        const db = window.firebase.firestore();
        const doc = await db.collection('users').doc(this.user.uid).get();
        return doc.exists ? doc.data() : null;
      }
      const raw = localStorage.getItem(`lumcards_cloud_stats_${this.user.uid}`);
      return raw ? JSON.parse(raw) : null;
    },

    // Inicio de sesión con Cuenta de Google oficial (Popup de Google)
    async signInWithGoogle() {
      if (typeof window !== 'undefined' && window.firebase?.auth) {
        try {
          const auth = window.firebase.auth();
          const provider = new window.firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const userCred = await auth.signInWithPopup(provider);
          this.user = {
            uid: userCred.user.uid,
            email: userCred.user.email,
            name: userCred.user.displayName || userCred.user.email.split('@')[0],
            photoURL: userCred.user.photoURL,
            provider: 'google'
          };
          localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
          return { success: true, user: this.user };
        } catch (err) {
          console.warn('Firebase Google Auth error:', err);
          if (err.code === 'auth/popup-closed-by-user') {
            throw new Error('La ventana de Google se cerró antes de completar el inicio de sesión.');
          }
          if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
            return {
              success: false,
              needsProviderEnable: true,
              error: 'Debes habilitar el proveedor "Google" en la consola de Firebase.',
              consoleUrl: 'https://console.firebase.google.com/project/lumcards/authentication/providers'
            };
          }
          throw err;
        }
      }
      throw new Error('Servicio de Google Auth no disponible. Comprueba tu conexión a internet.');
    },

    // Sincronizar todos los mazos, tarjetas, estadísticas y configuraciones a Cloud Firestore
    async syncFullWorkspace(workspaceData) {
      this.init();
      if (!this.user || !this.user.uid) return { success: false, reason: 'no_user' };
      
      const payload = {
        userId: this.user.uid,
        email: this.user.email || '',
        name: this.user.name || '',
        updatedAt: new Date().toISOString(),
        decks: (workspaceData.decks || []).map(d => ({
          id: d.id,
          name: d.name,
          total: d.total || 0,
          new: d.new || 0,
          learn: d.learn || 0,
          due: d.due || 0,
          parentName: d.parentName || null
        })),
        cards: (workspaceData.cards || []).slice(0, 5000),
        stats: workspaceData.stats || {},
        settings: workspaceData.settings || {}
      };

      if (typeof window !== 'undefined' && window.firebase?.firestore && !this.user.isLocalSession) {
        try {
          const db = window.firebase.firestore();
          await db.collection('users').doc(this.user.uid).set(payload, { merge: true });
          localStorage.setItem('lumcards_last_cloud_sync', payload.updatedAt);
          return { success: true, syncedAt: payload.updatedAt, cloud: true };
        } catch (err) {
          console.warn('Firestore sync error:', err);
          localStorage.setItem(`lumcards_cloud_backup_${this.user.uid}`, JSON.stringify(payload));
          return { success: false, error: err.message, localFallback: true };
        }
      }

      localStorage.setItem(`lumcards_cloud_backup_${this.user.uid}`, JSON.stringify(payload));
      return { success: true, syncedAt: payload.updatedAt, localMock: true };
    },

    // Descargar mazo y tarjetas completos desde Cloud Firestore
    async pullFullWorkspace() {
      this.init();
      if (!this.user || !this.user.uid) return null;

      if (typeof window !== 'undefined' && window.firebase?.firestore && !this.user.isLocalSession) {
        try {
          const db = window.firebase.firestore();
          const doc = await db.collection('users').doc(this.user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            if (data && data.decks && data.decks.length > 0) {
              localStorage.setItem('lumcards_last_cloud_sync', data.updatedAt || new Date().toISOString());
              return data;
            }
          }
        } catch (err) {
          console.warn('Error pulling workspace from Firestore:', err);
        }
      }

      const raw = localStorage.getItem(`lumcards_cloud_backup_${this.user.uid}`);
      return raw ? JSON.parse(raw) : null;
    },

    continueAsGuest() {
      this.user = { uid: 'guest_' + Date.now(), email: 'invitado@lumcards.local', name: 'Estudiante Invitado' };
      localStorage.setItem(STORAGE_KEYS.FIREBASE_USER, JSON.stringify(this.user));
      return { success: true, user: this.user };
    },

    // ── Control de acceso (aprobación manual, pago por Yape) ────
    // Crea/actualiza el registro de acceso del usuario actual en Firestore
    // (users/{uid}). El administrador queda aprobado automáticamente;
    // cualquier otra cuenta nueva entra en estado pendiente hasta que el
    // administrador la apruebe manualmente desde el panel.
    async ensureAccessRecord() {
      this.init();
      if (!this.user || !this.user.uid || this.user.isLocalSession || this.user.email === 'invitado@lumcards.local') return null;
      const isAdmin = this.isAdminEmail(this.user.email);

      if (typeof window !== 'undefined' && window.firebase?.firestore) {
        try {
          const db = window.firebase.firestore();
          const ref = db.collection('users').doc(this.user.uid);
          const snap = await ref.get();
          const existing = snap.exists ? snap.data() : null;
          const payload = {
            email: this.user.email || '',
            name: this.user.name || '',
            isAdmin,
            accessApproved: isAdmin ? true : Boolean(existing?.accessApproved),
            accessRequestedAt: existing?.accessRequestedAt || new Date().toISOString()
          };
          await ref.set(payload, { merge: true });
          this.access = {
            approved: payload.accessApproved,
            isAdmin,
            pending: !payload.accessApproved,
            note: existing?.accessNote || ''
          };
          return this.access;
        } catch (err) {
          console.warn('No se pudo verificar el acceso en Firestore:', err);
        }
      }

      // Sin Firestore disponible (entorno de pruebas / offline): admin
      // siempre aprobado, cualquier otra cuenta queda marcada pendiente
      // en localStorage para no bloquear el desarrollo local.
      const key = `lumcards_access_${this.user.uid}`;
      const raw = localStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : null;
      const record = { approved: isAdmin ? true : Boolean(existing?.approved), isAdmin, pending: false, note: existing?.note || '' };
      record.pending = !record.approved;
      localStorage.setItem(key, JSON.stringify(record));
      this.access = record;
      return record;
    },

    // Devuelve el estado de acceso actual (usa la caché si ya se calculó
    // en esta sesión; si no, lo calcula).
    async checkAccess() {
      this.init();
      if (!this.user) return { approved: false, isAdmin: false, pending: false, noUser: true };
      if (this.user.isLocalSession || this.user.email === 'invitado@lumcards.local') {
        return { approved: true, isAdmin: false, pending: false, localOnly: true };
      }
      if (this.access) return this.access;
      return this.ensureAccessRecord();
    },

    isAdmin() {
      this.init();
      return Boolean(this.user && this.isAdminEmail(this.user.email));
    },

    // Lista todos los usuarios registrados (solo funciona si las reglas de
    // Firestore permiten `list` en /users al correo administrador).
    async listAllUsers() {
      if (!this.isAdmin()) throw new Error('Solo el administrador puede ver la lista de usuarios.');
      if (typeof window === 'undefined' || !window.firebase?.firestore) {
        throw new Error('Firestore no está disponible en este entorno.');
      }
      const db = window.firebase.firestore();
      const snap = await db.collection('users').orderBy('accessRequestedAt', 'desc').get();
      return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    },

    // Aprueba o revoca el acceso de un usuario específico.
    async setUserAccess(uid, approved, note = '') {
      if (!this.isAdmin()) throw new Error('Solo el administrador puede aprobar o revocar acceso.');
      if (typeof window === 'undefined' || !window.firebase?.firestore) {
        throw new Error('Firestore no está disponible en este entorno.');
      }
      const db = window.firebase.firestore();
      await db.collection('users').doc(uid).set({
        accessApproved: Boolean(approved),
        accessNote: note || '',
        accessUpdatedAt: new Date().toISOString(),
        accessUpdatedBy: this.user?.email || ''
      }, { merge: true });
      return { success: true };
    }
  };

  // ── 4. Gestor Orquestador de Sincronización (SyncManager) ───
  const SyncManager = {
    device: DeviceStorageProvider,
    drive: GoogleDriveProvider,
    firebase: FirebaseProvider,

    init() {
      this.drive.init();
      this.firebase.init();
    },

    getStorageDestination() {
      try {
        return localStorage.getItem('lumcards_storage_destination') || 'device';
      } catch (_) {
        return 'device';
      }
    },

    setStorageDestination(dest) {
      const valid = ['device', 'firebase', 'gdrive'];
      const chosen = valid.includes(dest) ? dest : 'device';
      try {
        localStorage.setItem('lumcards_storage_destination', chosen);
      } catch (_) {}
      return chosen;
    },

    // Estado global de sincronización
    async getGlobalStatus() {
      this.init();
      const localInfo = await this.device.getInfo();
      const driveUser = this.drive.getUser();
      const firebaseUser = this.firebase.getUser();

      return {
        device: {
          active: true,
          ...localInfo
        },
        drive: {
          connected: Boolean(driveUser),
          user: driveUser,
          label: driveUser ? `${driveUser.name || 'Conectado'} (${driveUser.email})` : 'No conectado'
        },
        firebase: {
          connected: Boolean(firebaseUser),
          user: firebaseUser,
          label: firebaseUser ? `${firebaseUser.name || 'Sesión iniciada'} (${firebaseUser.email})` : 'Sesión no iniciada'
        },
        storageDestination: this.getStorageDestination(),
        autoSync: localStorage.getItem('lumcards_auto_sync') !== 'false'
      };
    },

    setAutoSync(enabled) {
      localStorage.setItem('lumcards_auto_sync', String(enabled));
    },

    // Exportar mazo completo para guardar en Drive o enviar a móvil
    async exportDeckPackage(deckId) {
      // Si estamos en escritorio, pedir al servidor el paquete .apkg
      if (typeof window !== 'undefined' && window.fetch) {
        const url = deckId && deckId !== 'all' ? `/api/export?deckId=${encodeURIComponent(deckId)}` : '/api/export';
        const res = await fetch(url, { headers: { 'X-Lumcards-Request': '1', 'X-Anki-Request': '1' } });
        if (!res.ok) throw new Error('No se pudo exportar el mazo.');
        const blob = await res.blob();
        return {
          blob,
          filename: `mazo-${deckId || 'coleccion'}-${new Date().toISOString().slice(0, 10)}.colpkg`
        };
      }
      throw new Error('Exportación no disponible en este entorno.');
    },

    // Subir mazo a Google Drive
    async backupDeckToDrive(deckId, deckName) {
      if (!this.drive.isConnected()) {
        throw new Error('Conecta tu Google Drive primero para poder guardar tus mazos en tu nube.');
      }
      const pkg = await this.exportDeckPackage(deckId);
      const filename = `${deckName || 'Mazo'}_${new Date().toISOString().slice(0, 10)}.colpkg`;
      const result = await this.drive.uploadDeckPackage(filename, pkg.blob, `Mazo de Lumcards: ${deckName}`);
      return { success: true, file: result };
    }
  };

  return SyncManager;
}));
