import { usePlaybackStore } from '../stores/playbackStore';
import { Track, EQSetting } from '../types';
import { eqService } from './EQService';
import { libraryService } from './LibraryService';
import { mlService } from './MLService';
import { getDB } from '../storage/db';
import { useEQStore } from '../stores/eqStore';

class AudioPlayerService {
  private static instance: AudioPlayerService;
  private context: AudioContext | null = null;
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    
    this.audioElement.addEventListener('timeupdate', () => {
      usePlaybackStore.getState().setCurrentTime(this.audioElement.currentTime);
    });
    
    this.audioElement.addEventListener('durationchange', () => {
      usePlaybackStore.getState().setDuration(this.audioElement.duration || 0);
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleEnded();
    });
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  private async handleEnded() {
    const state = usePlaybackStore.getState();
    if (state.repeatMode === 'one') {
      this.audioElement.currentTime = 0;
      this.audioElement.play();
    } else {
      const next = libraryService.getNextTrack(state.currentTrack, state.isShuffle, state.playbackMood);
      if (next) {
        await this.play(next);
      } else {
        state.setPlaying(false);
      }
    }
  }

  public init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    
    this.sourceNode = this.context.createMediaElementSource(this.audioElement);
    
    // Connect to EQ Service
    const eqOutput = eqService.init(this.context, this.sourceNode);
    
    // Final gain stage
    this.gainNode = this.context.createGain();
    this.gainNode.gain.setValueAtTime(usePlaybackStore.getState().volume, this.context.currentTime);
    
    eqOutput.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);

    this.isInitialized = true;
    console.log('AudioPlayerService initialized.');
  }

  public async play(track: Track) {
    if (!this.isInitialized) this.init();
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }

    if (track.fileObject) {
      const url = URL.createObjectURL(track.fileObject);
      this.audioElement.src = url;
      this.audioElement.play();
      
      // Update metadata in library
      const updatedTrack = {
        ...track,
        playCount: (track.playCount || 0) + 1,
        lastPlayedAt: Date.now()
      };
      libraryService.updateTrack(updatedTrack);

      usePlaybackStore.getState().setCurrentTrack(updatedTrack);
      usePlaybackStore.getState().setPlaying(true);

      this.handleEQPrediction(updatedTrack);
    }
  }

  private async handleEQPrediction(track: Track) {
    const db = await getDB();
    const activeHp = useEQStore.getState().activeHeadphone;
    
    if (activeHp) {
      const existing = await db.getAllFromIndex('eq_settings', 'by-track-headphone', [track.id, activeHp.id]);
      
      if (existing.length > 0) {
        const latest = existing.sort((a, b) => b.generation - a.generation)[0];
        eqService.applyBands(latest.bands);
        useEQStore.getState().setEQBands(latest.bands);
        useEQStore.getState().setMLGeneration(latest.generation);
      } else if (track.audioFeatures) {
        const bands = mlService.predictEQ(track.audioFeatures, activeHp);
        eqService.applyBands(bands);
        useEQStore.getState().setEQBands(bands);
        useEQStore.getState().setMLGeneration(0);

        const eqSetting: EQSetting = {
          trackId: track.id,
          headphoneId: activeHp.id,
          generation: 0,
          bands,
          isDefault: true,
          source: 'ml_initial',
          createdAt: Date.now()
        };
        await db.put('eq_settings', eqSetting);
      }
    } else {
      eqService.reset();
      useEQStore.getState().setEQBands(Array(10).fill(0));
    }
  }

  public toggle() {
    if (!this.isInitialized) return;
    
    if (this.audioElement.paused) {
      this.audioElement.play();
      usePlaybackStore.getState().setPlaying(true);
    } else {
      this.audioElement.pause();
      usePlaybackStore.getState().setPlaying(false);
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.context) {
      this.gainNode.gain.setTargetAtTime(clamped, this.context.currentTime, 0.02);
    }
    usePlaybackStore.getState().setVolume(clamped);
  }

  public seek(time: number) {
    this.audioElement.currentTime = time;
    usePlaybackStore.getState().setCurrentTime(time);
  }

  public getAudioElement() {
    return this.audioElement;
  }
}

export const audioPlayerService = AudioPlayerService.getInstance();
