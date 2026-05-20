import { Track, EQSetting, HeadphoneProfile, FeedbackLog } from './types';

const DB_NAME = 'smart-muzic-db';
const DB_VERSION = 1;

export const DEFAULT_HEADPHONE_PROFILES: HeadphoneProfile[] = [
  {
    id: 'sony-mdr-7506',
    name: 'MDR-7506',
    brand: 'Sony',
    correctionCurve: [1.2, 0.5, -0.5, -1.0, -1.5, -2.0, 1.0, 0.5, -1.0, -1.5]
  },
  {
    id: 'sennheiser-hd-650',
    name: 'HD 650',
    brand: 'Sennheiser',
    correctionCurve: [2.5, 1.5, 0.5, 0.0, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5]
  },
  {
    id: 'kz-zs10-pro',
    name: 'ZS10 Pro',
    brand: 'KZ',
    correctionCurve: [-1.5, -2.0, 0.5, 1.5, 1.0, -3.0, -2.0, 1.5, 0.5, -1.0]
  },
  {
    id: 'beyer-dt-990-pro',
    name: 'DT 990 Pro',
    brand: 'Beyerdynamic',
    correctionCurve: [3.0, 1.5, 0.0, -0.5, -1.0, -1.5, -3.5, -4.0, -2.0, -1.0]
  },
  {
    id: 'audio-technica-ath-m50x',
    name: 'ATH-M50x',
    brand: 'Audio-Technica',
    correctionCurve: [-1.0, -1.5, 0.5, 1.0, -1.5, -2.0, -0.5, 1.0, 0.5, 0.0]
  },
  {
    id: 'apple-airpods-pro',
    name: 'AirPods Pro',
    brand: 'Apple',
    correctionCurve: [0.5, 0.0, -0.5, 0.5, 1.0, 0.5, -1.0, 0.0, 1.5, 2.0]
  },
  {
    id: 'audeze-lcd-x',
    name: 'LCD-X',
    brand: 'Audeze',
    correctionCurve: [0.0, 0.5, 0.5, 1.0, 1.5, 1.0, 2.0, 2.5, 3.0, 3.5]
  }
];

export class MiniDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('eq_settings')) {
          db.createObjectStore('eq_settings', { keyPath: 'trackId' });
        }
        if (!db.objectStoreNames.contains('feedback_log')) {
          db.createObjectStore('feedback_log', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(tx.objectStoreNames[0]);
  }

  // TRACKS
  async saveTrack(track: Track): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('tracks', 'readwrite');
      const request = store.put(track);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTrack(id: string): Promise<Track | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('tracks', 'readonly');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTracks(): Promise<Track[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('tracks', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTrack(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('tracks', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // EQ SETTINGS
  async saveEQSetting(setting: EQSetting): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('eq_settings', 'readwrite');
      const request = store.put(setting);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEQSetting(trackId: string): Promise<EQSetting | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('eq_settings', 'readonly');
      const request = store.get(trackId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEQSetting(trackId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('eq_settings', 'readwrite');
      const request = store.delete(trackId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllEQData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction(['eq_settings', 'feedback_log'], 'readwrite');
      const store1 = tx.objectStore('eq_settings');
      const store2 = tx.objectStore('feedback_log');
      store1.clear();
      store2.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // PREFERENCES
  async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('preferences', 'readonly');
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.value as T);
          } else {
            resolve(defaultValue);
          }
        };
        request.onerror = () => {
          resolve(defaultValue);
        };
      } catch {
        resolve(defaultValue);
      }
    });
  }

  async savePreference<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('preferences', 'readwrite');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // FEEDBACKS
  async saveFeedback(log: FeedbackLog): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('feedback_log', 'readwrite');
      const request = store.put(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFeedback(): Promise<FeedbackLog[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('feedback_log', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbInstance = new MiniDB();
