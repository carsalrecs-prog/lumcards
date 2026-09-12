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
  const signInRes = await SyncManager.drive.signIn('mock_oauth_token_123');
  assert.equal(signInRes.success, true);
  assert.equal(SyncManager.drive.isConnected(), true);
  assert.equal(SyncManager.drive.token, 'mock_oauth_token_123');

  // Desconectar
  SyncManager.drive.disconnect();
  assert.equal(SyncManager.drive.isConnected(), false);
  console.log('✓ GoogleDriveProvider conecta y desconecta tokens');
}

// 5. Probar Estado Global
async function testGlobal() {
  const status = await SyncManager.getGlobalStatus();
  assert.ok(status.device);
  assert.ok(status.drive);
  assert.ok(status.firebase);
  assert.equal(status.autoSync, true);
  console.log('✓ SyncManager reporta estado global unificado');
}

(async () => {
  await testDevice();
  await testFirebase();
  await testDrive();
  await testGlobal();
  console.log('--- ✓ Todas las pruebas de SyncManager pasaron exitosamente ---');
})();
