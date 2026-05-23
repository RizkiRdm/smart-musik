import { create } from 'zustand';

interface UIState {
  isInitializing: boolean;
  initProgress: number;
  initStatus: string;
  isModelLoaded: boolean;
  isHeadphoneDBLoaded: boolean;
  activeTab: 'library' | 'settings';
  
  setInitializing: (isInitializing: boolean) => void;
  setInitProgress: (progress: number) => void;
  setInitStatus: (status: string) => void;
  setModelLoaded: (isLoaded: boolean) => void;
  setHeadphoneDBLoaded: (isLoaded: boolean) => void;
  setActiveTab: (tab: 'library' | 'settings') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isInitializing: true,
  initProgress: 0,
  initStatus: 'Initializing application...',
  isModelLoaded: false,
  isHeadphoneDBLoaded: false,
  activeTab: 'library',

  setInitializing: (isInitializing) => set({ isInitializing }),
  setInitProgress: (initProgress) => set({ initProgress }),
  setInitStatus: (initStatus) => set({ initStatus }),
  setModelLoaded: (isModelLoaded) => set({ isModelLoaded }),
  setHeadphoneDBLoaded: (isHeadphoneDBLoaded) => set({ isHeadphoneDBLoaded }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
