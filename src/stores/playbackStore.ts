import { create } from 'zustand';
import { Track } from '../types';

interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  playbackMood: 'chill' | 'energetic' | 'focus' | 'melancholic' | 'default';

  setCurrentTrack: (track: Track | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setShuffle: (isShuffle: boolean) => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  setPlaybackMood: (mood: 'chill' | 'energetic' | 'focus' | 'melancholic' | 'default') => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  isShuffle: false,
  repeatMode: 'off',
  playbackMood: 'default',

  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setShuffle: (isShuffle) => set({ isShuffle }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  setPlaybackMood: (playbackMood) => set({ playbackMood }),
}));
