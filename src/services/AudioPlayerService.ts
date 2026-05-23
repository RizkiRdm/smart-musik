import { usePlaybackStore } from '../stores/playbackStore';
import { Track } from '../types';
import { eqService } from './EQService';

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
      // Logic for next track should be handled by a hook or higher level service
      usePlaybackStore.getState().setPlaying(false);
    });
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
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
      
      usePlaybackStore.getState().setCurrentTrack(track);
      usePlaybackStore.getState().setPlaying(true);
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
