const assert = require('node:assert/strict');
const SyncManager = require('../dist/sync-manager.js');

console.log('--- Iniciando pruebas de SyncManager (Tri-Storage) ---');

// Mock localStorage if in node
if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
}

// 1. Probar disponibilidad de proveedores
assert.ok(SyncManager.device, 'Debe incluir DeviceStorageProvider');
assert.ok(SyncManager.drive, 'Debe incluir GoogleDriveProvider');
assert.ok(SyncManager.firebase, 'Debe incluir FirebaseProvider');
console.log('✓ Proveedores Device, Drive y Firebase registrados');

// 2. Probar Almacenamiento Local
async function testDevice() {
  const saveRes = await SyncManager.device.saveLocalDeck('test_1', { name: 'Mazo Demo', cards: [1, 2] });
  assert.equal(saveRes.success, true);
  const loaded = await SyncManager.device.loadLocalDeck('test_1');
  assert.equal(loaded.name, 'Mazo Demo');
  assert.equal(loaded.cards.length, 2);
  console.log('✓ DeviceStorageProvider guarda y recupera datos locales');
}

// 3. Probar Firebase Auth local
async function testFirebase() {
  const regRes = await SyncManager.firebase.register('estudiante@lumcards.com', 'password123', 'Estudiante Lumcards');
  assert.equal(regRes.success, true);
  assert.equal(regRes.user.email, 'estudiante@lumcards.com');
  assert.equal(SyncManager.firebase.isConnected(), true);

  // Sincronizar estadísticas
  const syncRes = await SyncManager.firebase.syncStats({ totalReviews: 45, streak: 5 });
  assert.equal(syncRes.success, true);
  assert.ok(syncRes.syncedAt);

  const pulled = await SyncManager.firebase.pullStats();
  assert.equal(pulled.stats.streak, 5);
  console.log('✓ FirebaseProvider autentica y sincroniza estadísticas');

  // Cerrar sesión
  await SyncManager.firebase.logout();
  assert.equal(SyncManager.firebase.isConnected(), false);
  console.log('✓ FirebaseProvider cierra sesión correctamente');
}

// 4. Probar Google Drive Provider
async function testDrive() {
  assert.equal(SyncManager.drive.isConnected(), false);
  await assert.rejects(SyncManager.drive.signIn('estudiante@example.test'), /configurad/);
  await assert.rejects(SyncManager.drive.uploadDeck(new Blob(['synthetic']), 'test.colpkg'), /Conecta/);
  await assert.rejects(SyncManager.drive.listFiles(), /Conecta/);
  await assert.rejects(SyncManager.drive.downloadDeck('synthetic'), /Conecta/);
  assert.equal(SyncManager.drive.isConnected(), false);
  console.log('✓ Drive rechaza conexiones y copias sin OAuth; contrato GIS en test_drive_oauth.cjs');
}

// 5. Probar Elección de Destino de Almacenamiento y Modo Invitado
async function testStorageChoiceAndGuest() {
  // Destino predeterminado
  assert.equal(SyncManager.getStorageDestination(), 'device');

  // Cambiar a Nube Firebase
  SyncManager.setStorageDestination('firebase');
  assert.equal(SyncManager.getStorageDestination(), 'firebase');

  // Cambiar a Google Drive
  SyncManager.setStorageDestination('gdrive');
  assert.equal(SyncManager.getStorageDestination(), 'gdrive');

  // Modo invitado sin contraseña
  const guestRes = SyncManager.firebase.continueAsGuest();
  assert.equal(guestRes.success, true);
  assert.ok(guestRes.user.name.includes('Invitado'));
  assert.equal(SyncManager.firebase.isConnected(), true);
  console.log('✓ Selector de destino de almacenamiento y Modo Invitado funcionan al 100%');
}

// 6. Probar Estado Global
async function testGlobal() {
  const status = await SyncManager.getGlobalStatus();
  assert.ok(status.device);
  assert.ok(status.drive);
  assert.ok(status.firebase);
  assert.ok(status.storageDestination);
  assert.equal(status.autoSync, true);
  console.log('✓ SyncManager reporta estado global unificado');
}

(async () => {
  await testDevice();
  await testFirebase();
  await testDrive();
  await testStorageChoiceAndGuest();
  await testGlobal();
  console.log('--- ✓ Todas las pruebas de SyncManager pasaron exitosamente ---');
})();

