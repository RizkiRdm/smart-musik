import { create } from 'zustand';
import { HeadphoneProfile } from '../types';

interface EQState {
  eqBands: number[];
  mlGeneration: number;
  activeHeadphone: HeadphoneProfile | null;
  isGenerating: boolean;
  showFeedbackPill: boolean;
  hasEvaluatedActiveTrack: boolean;

  setEQBands: (bands: number[]) => void;
  setMLGeneration: (generation: number) => void;
  setActiveHeadphone: (headphone: HeadphoneProfile | null) => void;
  setGenerating: (isGenerating: boolean) => void;
  setShowFeedbackPill: (show: boolean) => void;
  setHasEvaluatedActiveTrack: (evaluated: boolean) => void;
}

export const useEQStore = create<EQState>((set) => ({
  eqBands: Array(10).fill(0),
  mlGeneration: 0,
  activeHeadphone: null,
  isGenerating: false,
  showFeedbackPill: false,
  hasEvaluatedActiveTrack: false,

  setEQBands: (eqBands) => set({ eqBands }),
  setMLGeneration: (mlGeneration) => set({ mlGeneration }),
  setActiveHeadphone: (activeHeadphone) => set({ activeHeadphone }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setShowFeedbackPill: (showFeedbackPill) => set({ showFeedbackPill }),
  setHasEvaluatedActiveTrack: (hasEvaluatedActiveTrack) => set({ hasEvaluatedActiveTrack }),
}));
