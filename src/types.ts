export interface AudioFeatures {
  bandEnergy: number[];      // length 7, normalized 0–1
  spectralCentroid: number;  // normalized 0–1
  rms: number;               // normalized 0–1
  peakAvgRatio: number;      // normalized 0–1
}

export interface Track {
  id: string;
  name: string;        // full filename
  fileSize: number;
  title: string;       // track title or parsed filename
  artist?: string;
  album?: string;
  duration: number;    // duration in seconds
  format: string;      // mp3, wav, ogg, etc.
  hasEQ: boolean;
  audioFeatures: AudioFeatures | null;
  fileObject?: File;   // in-memory storage of the handle/File for active sessions
  addedAt: number;
  genre?: string;      // Dynamic genre assignment
  playCount?: number;  // SMART SHUFFLE Play Count tracking
  lastPlayedAt?: number; // SMART SHUFFLE Last history track
  moodTag?: 'chill' | 'energetic' | 'focus' | 'melancholic' | 'default'; // Playback mood matching
  lyrics?: string;     // Embedded karaoke synced lyrics
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
  id: string;
  trackId: string;
  headphoneId: string;
  signal: 'like' | 'dislike';
  generation: number;
  listenDurationMs: number;
  createdAt: number;
}
