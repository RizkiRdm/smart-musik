import { create } from 'zustand';
import { Track } from '../types';

interface LibraryState {
  tracks: Track[];
  isLibraryLoading: boolean;
  searchQuery: string;

  setTracks: (tracks: Track[]) => void;
  addTracks: (tracks: Track[]) => void;
  removeTrack: (trackId: string) => void;
  setLibraryLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  isLibraryLoading: false,
  searchQuery: '',

  setTracks: (tracks) => set({ tracks }),
  addTracks: (newTracks) => set((state) => ({ 
    tracks: [...state.tracks, ...newTracks].sort((a, b) => a.title.localeCompare(b.title))
  })),
  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter((t) => t.id !== trackId)
  })),
  setLibraryLoading: (isLibraryLoading) => set({ isLibraryLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
