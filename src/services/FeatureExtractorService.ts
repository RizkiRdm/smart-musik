import Essentia from 'essentia.js';
import { AudioFeatures } from '../types';

class FeatureExtractorService {
  private static instance: FeatureExtractorService;
  private essentia: any;

  private constructor() {
    // Essentia.js might need WASM path configuration depending on environment
    this.essentia = new (Essentia as any).EssentiaJS(false); // false means don't use WASM for basic ops if not needed
  }

  public static getInstance(): FeatureExtractorService {
    if (!FeatureExtractorService.instance) {
      FeatureExtractorService.instance = new FeatureExtractorService();
    }
    return FeatureExtractorService.instance;
  }

  public async extractFeatures(file: File): Promise<AudioFeatures> {
    const audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    // Convert AudioBuffer to Float32Array
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    
    // Essentia analysis
    const signals = this.essentia.arrayToVector(channelData);
    
    // 1. RMS (Loudness)
    const rms = this.essentia.RMS(signals).rms;
    
    // 2. Spectral Centroid (Brightness)
    const spectrum = this.essentia.Spectrum(signals).spectrum;
    const centroid = this.essentia.Centroid(spectrum).centroid;
    
    // 3. Band Energies (Simple 7-band split)
    const bandEnergies = this.calculateBandEnergies(channelData, 7);
    
    // 4. Peak to Average Ratio
    const peak = Math.max(...Array.from(channelData.slice(0, 100000)).map(Math.abs));
    const par = peak / (rms || 0.01);

    audioCtx.close();

    return {
      bandEnergy: bandEnergies,
      spectralCentroid: Math.min(1, centroid / 5000), // Normalize
      rms: Math.min(1, rms * 10),
      peakAvgRatio: Math.min(1, par / 20)
    };
  }

  private calculateBandEnergies(data: Float32Array, numBands: number): number[] {
    const bandSize = Math.floor(data.length / numBands);
    const energies: number[] = [];
    
    for (let i = 0; i < numBands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += data[j] * data[j];
      }
      energies.push(Math.min(1, Math.sqrt(sum / bandSize) * 5));
    }
    
    return energies;
  }
}

export const featureExtractorService = FeatureExtractorService.getInstance();
