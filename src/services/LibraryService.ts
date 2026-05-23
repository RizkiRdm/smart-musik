import * as mm from 'music-metadata-browser';
import { getDB } from '../storage/db';
import { Track } from '../types';
import { generateTrackId } from '../utils/trackId';
import { useLibraryStore } from '../stores/libraryStore';

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
          audioFeatures: null, // To be extracted by FeatureExtractorService later
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
}

export const libraryService = LibraryService.getInstance();
