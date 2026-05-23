import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Track, EQSetting, FeedbackLog, HeadphoneProfile } from '../types';

export interface SmartEQSchema extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: {
      'by-title': string;
      'by-artist': string;
      'by-album': string;
    };
  };
  eq_settings: {
    key: [string, string, number];
    value: EQSetting;
    indexes: {
      'by-track-headphone': [string, string];
    };
  };
  feedback_log: {
    key: number;
    value: FeedbackLog;
    indexes: {
      'by-track': string;
    };
  };
  headphone_profiles: {
    key: string;
    value: HeadphoneProfile;
  };
  user_preferences: {
    key: string;
    value: { key: string; value: any };
  };
  asset_cache: {
    key: string;
    value: {
      key: string;
      data: ArrayBuffer | Uint8Array;
      cachedAt: number;
      version: string;
    };
  };
  rl_state: {
    key: string;
    value: {
      headphoneId: string;
      policyWeights: object;
      totalFeedback: number;
      lastUpdated: number;
    };
  };
}

const DB_NAME = 'smart-eq-player-web';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<SmartEQSchema>> {
  return openDB<SmartEQSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tracks store
      if (!db.objectStoreNames.contains('tracks')) {
        const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
        trackStore.createIndex('by-title', 'title');
        trackStore.createIndex('by-artist', 'artist');
        trackStore.createIndex('by-album', 'album');
      }

      // EQ Settings store
      if (!db.objectStoreNames.contains('eq_settings')) {
        const eqStore = db.createObjectStore('eq_settings', {
          keyPath: ['trackId', 'headphoneId', 'generation'],
        });
        eqStore.createIndex('by-track-headphone', ['trackId', 'headphoneId']);
      }

      // Feedback Log store
      if (!db.objectStoreNames.contains('feedback_log')) {
        const feedbackStore = db.createObjectStore('feedback_log', {
          keyPath: 'id',
          autoIncrement: true,
        });
        feedbackStore.createIndex('by-track', 'trackId');
      }

      // Headphone Profiles store
      if (!db.objectStoreNames.contains('headphone_profiles')) {
        db.createObjectStore('headphone_profiles', { keyPath: 'id' });
      }

      // User Preferences store
      if (!db.objectStoreNames.contains('user_preferences')) {
        db.createObjectStore('user_preferences', { keyPath: 'key' });
      }

      // Asset Cache store
      if (!db.objectStoreNames.contains('asset_cache')) {
        db.createObjectStore('asset_cache', { keyPath: 'key' });
      }

      // RL State store
      if (!db.objectStoreNames.contains('rl_state')) {
        db.createObjectStore('rl_state', { keyPath: 'headphoneId' });
      }
    },
  });
}

let dbPromise: Promise<IDBPDatabase<SmartEQSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}
