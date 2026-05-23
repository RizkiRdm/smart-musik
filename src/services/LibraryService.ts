import * as mm from 'music-metadata-browser';
import { getDB } from '../storage/db';
import { Track } from '../types';
import { generateTrackId } from '../utils/trackId';
import { useLibraryStore } from '../stores/libraryStore';
import { featureExtractorService } from './FeatureExtractorService';

class LibraryService {
  private static instance: LibraryService;

  private constructor() {}

  public static getInstance(): LibraryService {
    if (!LibraryService.instance) {
      LibraryService.instance = new LibraryService();
    }
    return LibraryService.instance;
  }

  public async loadLibrary(): Promise<Track[]> {
    const db = await getDB();
    const tracks = await db.getAll('tracks');
    useLibraryStore.getState().setTracks(tracks);
    return tracks;
  }

  public async addFiles(files: File[]): Promise<Track[]> {
    const db = await getDB();
    const newTracks: Track[] = [];

    for (const file of files) {
      try {
        const id = await generateTrackId(file.name, file.size);
        
        // Check if already exists
        const existing = await db.get('tracks', id);
        if (existing) {
          console.warn(`Track ${file.name} already exists in library.`);
          continue;
        }

        // Parse metadata
        const metadata = await mm.parseBlob(file);
        
        const track: Track = {
          id,
          fileName: file.name,
          fileSize: file.size,
          title: metadata.common.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
          artist: metadata.common.artist || 'Unknown Artist',
          album: metadata.common.album || 'Unknown Album',
          duration: metadata.format.duration || 0,
          durationMs: (metadata.format.duration || 0) * 1000,
          format: file.name.split('.').pop() || 'unknown',
          hasEQ: false,
          audioFeatures: await featureExtractorService.extractFeatures(file).catch(() => null),
          fileObject: file,
          addedAt: Date.now(),
          genre: metadata.common.genre?.[0],
          playCount: 0,
        };

        await db.put('tracks', track);
        newTracks.push(track);
      } catch (err) {
        console.error(`Failed to parse metadata for ${file.name}:`, err);
      }
    }

    if (newTracks.length > 0) {
      useLibraryStore.getState().addTracks(newTracks);
    }

    return newTracks;
  }

  public async removeTrack(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('tracks', id);
    // Also delete associated EQ settings
    const tx = db.transaction(['eq_settings', 'feedback_log'], 'readwrite');
    const eqStore = tx.objectStore('eq_settings');
    const feedbackStore = tx.objectStore('feedback_log');
    
    // Note: eq_settings has compound key [trackId, hpId, gen]. 
    // We need to iterate or use index to delete all.
    const eqIndex = eqStore.index('by-track-headphone');
    let cursor = await eqIndex.openCursor(IDBKeyRange.bound([id, ''], [id, '\uffff']));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    useLibraryStore.getState().removeTrack(id);
  }

  public async updateTrack(track: Track): Promise<void> {
    const db = await getDB();
    await db.put('tracks', track);
    const tracks = useLibraryStore.getState().tracks;
    useLibraryStore.getState().setTracks(tracks.map(t => t.id === track.id ? track : t));
  }

  public getSmartShuffleNextTrack(currentTrack: Track | null, mood: string): Track {
    const tracks = useLibraryStore.getState().tracks;
    if (tracks.length === 0) throw new Error('No tracks in library');
    if (tracks.length === 1) return tracks[0];
    
    const candidates = tracks.filter((t) => !currentTrack || t.id !== currentTrack.id);
    if (candidates.length === 0) return tracks[0];

    const scoredCandidates = candidates.map((trackItem) => {
      let score = 100;

      if (trackItem.moodTag && trackItem.moodTag === mood) {
        score += 80;
      }
      
      const fullText = `${trackItem.title} ${trackItem.artist || ''} ${trackItem.genre || ''}`.toLowerCase();
      if (mood === 'chill' && (fullText.includes('chill') || fullText.includes('lofi') || fullText.includes('slow'))) score += 50;
      else if (mood === 'energetic' && (fullText.includes('energy') || fullText.includes('rock') || fullText.includes('fast'))) score += 50;
      else if (mood === 'focus' && (fullText.includes('study') || fullText.includes('calm') || fullText.includes('piano'))) score += 50;
      else if (mood === 'melancholic' && (fullText.includes('sad') || fullText.includes('cry') || fullText.includes('dark'))) score += 50;

      const playCount = trackItem.playCount || 0;
      score -= playCount * 15;

      if (trackItem.lastPlayedAt) {
        const minutesSincePlayed = (Date.now() - trackItem.lastPlayedAt) / (1000 * 60);
        score += Math.min(45, minutesSincePlayed * 2.5);
      } else {
        score += 60;
      }

      return { track: trackItem, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const selectLimit = Math.min(scoredCandidates.length, 3);
    const selectedIdx = Math.floor(Math.random() * selectLimit);
    return scoredCandidates[selectedIdx].track;
  }

  public getNextTrack(currentTrack: Track | null, shuffle: boolean, mood: string): Track | null {
    const tracks = useLibraryStore.getState().tracks;
    if (tracks.length === 0) return null;

    if (shuffle) {
      return this.getSmartShuffleNextTrack(currentTrack, mood);
    }

    const currentIdx = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % tracks.length;
    return tracks[nextIdx];
  }
}

export const libraryService = LibraryService.getInstance();
