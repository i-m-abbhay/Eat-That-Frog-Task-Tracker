/**
 * Firebase Realtime Database sync: write tasks/stats and listen for remote changes.
 * Uses a sync code to namespace data; deviceId avoids applying our own writes back.
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const DEVICE_ID_KEY = 'frog-sync-deviceId';
const DEBOUNCE_MS = 1000;

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

let app = null;
let db = null;
let syncCodeRef = null;
let unsubscribe = null;
let writeTimeout = null;
let lastPayload = null;

/**
 * @param {Object} firebaseConfig - { apiKey, authDomain?, databaseURL, projectId, storageBucket?, messagingSenderId?, appId }
 * @param {string} syncCode
 * @returns {{ write: (tasks: any[], stats: object) => void, listen: (callback: (data: { tasks: any[], stats: object, sourceDeviceId: string, updatedAt: number }) => void) => () => void, disconnect: () => void }}
 */
export function initSync(firebaseConfig, syncCode) {
  if (app) {
    try {
      app.delete?.();
    } catch (_) {}
    app = null;
    db = null;
    syncCodeRef = null;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
  }

  if (!firebaseConfig?.apiKey || !firebaseConfig?.databaseURL || !syncCode?.trim()) {
    return {
      write: () => {},
      listen: () => () => {},
      disconnect: () => {},
    };
  }

  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  const code = syncCode.trim().replace(/[.#$[\]]/g, '-');
  // Use "rooms" path so Firebase rules can allow access only to a specific room (sync code), not list all rooms
  syncCodeRef = ref(db, `rooms/${code}`);

  const deviceId = getOrCreateDeviceId();

  const flushWrite = () => {
    writeTimeout = null;
    if (lastPayload && db && syncCodeRef) {
      const { tasks, stats } = lastPayload;
      const payload = {
        tasks,
        stats,
        sourceDeviceId: deviceId,
        updatedAt: Date.now(),
      };
      set(syncCodeRef, payload).catch((err) => console.warn('Sync write failed', err));
      lastPayload = null;
    }
  };

  const write = (tasks, stats) => {
    if (!db || !syncCodeRef) return;
    lastPayload = { tasks, stats };
    if (writeTimeout) clearTimeout(writeTimeout);
    writeTimeout = setTimeout(flushWrite, DEBOUNCE_MS);
  };

  const listen = (callback) => {
    if (!syncCodeRef) return () => {};
    unsubscribe = onValue(syncCodeRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.tasks || !data.stats) return;
      callback({
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        stats: data.stats,
        sourceDeviceId: data.sourceDeviceId || '',
        updatedAt: data.updatedAt || 0,
      });
    });
    return () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  };

  /** Subscribe to connection status (true = connected, false = offline). Returns unsubscribe. */
  const subscribeConnectStatus = (callback) => {
    if (!db) return () => {};
    const connectedRef = ref(db, '.info/connected');
    const unsub = onValue(connectedRef, (snapshot) => callback(snapshot.val() === true));
    return () => unsub();
  };

  const disconnect = () => {
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    lastPayload = null;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    syncCodeRef = null;
    db = null;
    if (app) {
      try {
        app.delete?.();
      } catch (_) {}
      app = null;
    }
  };

  return { write, listen, disconnect, deviceId, subscribeConnectStatus };
}

export { getOrCreateDeviceId };
