/**
 * Storage adapter using IndexedDB.
 * Same get/set API as before so the rest of the app is unchanged.
 * IndexedDB is better for larger data: higher limits, async, non-blocking.
 */

const DB_NAME = 'EatThatFrogDB';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;
const STORAGE_KEYS = [
  'frog-tasks-kanban',
  'frog-stats-kanban',
  'frog-water-logs',
  'frog-water-settings',
  'frog-fitness-logs',
  'frog-fitness-settings',
];

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

/** One-time migration: copy from localStorage to IndexedDB if we have old data and IDB is empty */
function migrateFromLocalStorageIfNeeded() {
  return new Promise((resolve) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(STORAGE_KEYS[0]);
        req.onsuccess = () => {
          db.close();
          if (req.result != null) {
            resolve();
            return;
          }
          if (typeof localStorage === 'undefined') {
            resolve();
            return;
          }
          const migratedKey = `_migrated_from_localStorage_${DB_NAME}`;
          if (localStorage.getItem(migratedKey)) {
            resolve();
            return;
          }
          let hadData = false;
          openDB().then((rwDb) => {
            const rwTx = rwDb.transaction(STORE_NAME, 'readwrite');
            const rwStore = rwTx.objectStore(STORE_NAME);
            for (const key of STORAGE_KEYS) {
              const val = localStorage.getItem(key);
              if (val != null) {
                rwStore.put({ key, value: val });
                hadData = true;
              }
            }
            if (hadData) {
              for (const key of STORAGE_KEYS) localStorage.removeItem(key);
              localStorage.setItem(migratedKey, '1');
            }
            rwTx.oncomplete = () => {
              rwDb.close();
              resolve();
            };
            rwTx.onerror = () => {
              rwDb.close();
              resolve();
            };
          }).catch(() => resolve());
        };
        req.onerror = () => {
          db.close();
          resolve();
        };
      })
      .catch(() => resolve());
  });
}

let migrationPromise = null;
function ensureMigration() {
  if (!migrationPromise) migrationPromise = migrateFromLocalStorageIfNeeded();
  return migrationPromise;
}

function localStorageFallbackGet(key) {
  try {
    const value = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return value != null ? { value } : null;
  } catch {
    return null;
  }
}

function localStorageFallbackSet(key, value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage.setItem failed', e);
  }
}

export const storage = {
  async get(key) {
    try {
      await ensureMigration();
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const row = req.result;
          resolve(row != null ? { value: row.value } : null);
        };
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          reject(tx.error);
          db.close();
        };
      });
    } catch (e) {
      console.warn('storage.get failed, using localStorage fallback', e);
      return localStorageFallbackGet(key);
    }
  },

  async set(key, value) {
    try {
      await ensureMigration();
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ key, value });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          console.warn('storage.set failed', tx.error);
          db.close();
          reject(tx.error);
        };
      });
    } catch (e) {
      console.warn('storage.set failed, using localStorage fallback', e);
      localStorageFallbackSet(key, value);
    }
  },
};
