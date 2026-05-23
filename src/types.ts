export interface AudioFeatures {
  bandEnergy: number[];      // length 7, normalized 0–1
  spectralCentroid: number;  // normalized 0–1
  rms: number;               // normalized 0–1
  peakAvgRatio: number;      // normalized 0–1
}

export interface Track {
  id: string;          // SHA256 of fileName + fileSize
  fileName: string;    // original file name
  fileSize: number;
  title: string;       // parsed from metadata or fileName
  artist?: string;
  album?: string;
  duration: number;    // duration in seconds (for UI convenience)
  durationMs: number;  // duration in milliseconds
  format: string;      // mp3, wav, ogg, etc.
  hasEQ: boolean;
  audioFeatures: AudioFeatures | null;
  fileObject?: File;   // in-memory File object
  fileHandle?: FileSystemFileHandle | null; // for File System Access API
  addedAt: number;
  genre?: string;
  playCount?: number;
  lastPlayedAt?: number;
  moodTag?: 'chill' | 'energetic' | 'focus' | 'melancholic' | 'default';
  lyrics?: string;
}

export interface EQSetting {
  trackId: string;
  headphoneId: string;
  generation: number;
  bands: number[];     // length 10, range [-12, +12]
  isDefault: boolean;
  source: 'ml_initial' | 'rl_updated';
  createdAt: number;
}

export interface HeadphoneProfile {
  id: string;
  name: string;
  brand: string;
  correctionCurve: number[];  // length 10
}

export interface FeedbackLog {
  id: number;          // autoIncrement
  trackId: string;
  headphoneId: string;
  signal: 'like' | 'dislike';
  generation: number;
  listenDurationMs: number;
  createdAt: number;
}
