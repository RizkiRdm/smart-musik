import * as tflite from '@tensorflow/tfjs-tflite';
import { AudioFeatures, HeadphoneProfile } from '../types';

class MLService {
  private static instance: MLService;
  private model: tflite.TFLiteModel | null = null;
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  public async loadModel() {
    if (this.isLoaded) return;
    try {
      this.model = await tflite.loadTFLiteModel('/model/smart_eq_model.bin');
      this.isLoaded = true;
      console.log('MLService: TFLite model loaded.');
    } catch (err) {
      console.error('MLService: Failed to load model:', err);
    }
  }

  public predictEQ(features: AudioFeatures, headphone: HeadphoneProfile): number[] {
    // If model not loaded or fails, fallback to heuristic
    if (!this.model) {
      return this.fallbackPredict(features, headphone);
    }

    try {
      // Inputs: [bandEnergy(7), spectralCentroid(1), rms(1), peakAvgRatio(1), correctionCurve(10)] = 20 features
      const inputArr = new Float32Array([
        ...features.bandEnergy,
        features.spectralCentroid,
        features.rms,
        features.peakAvgRatio,
        ...headphone.correctionCurve
      ]);

      // TFLite inference
      // Note: Actual implementation depends on model signature. Assuming simple [1, 20] -> [1, 10]
      // For now, using fallback since real TFLite execution might need more setup (WASM, etc.)
      return this.fallbackPredict(features, headphone);
    } catch (err) {
      console.warn('MLService: Prediction failed, using fallback.', err);
      return this.fallbackPredict(features, headphone);
    }
  }

  private fallbackPredict(features: AudioFeatures, headphone: HeadphoneProfile): number[] {
    // Heuristic: start with headphone correction, then adjust by energy
    return headphone.correctionCurve.map((base, i) => {
      const energyIdx = Math.min(6, Math.floor((i / 10) * 7));
      const energy = features.bandEnergy[energyIdx];
      
      // If energy is low in that band, boost it slightly
      const boost = (1 - energy) * 2;
      // If spectral centroid is high (bright), cut high frequencies
      const brightnessCut = i > 6 ? (features.spectralCentroid * -3) : 0;
      
      return Math.max(-12, Math.min(12, base + boost + brightnessCut));
    });
  }
}

export const mlService = MLService.getInstance();
