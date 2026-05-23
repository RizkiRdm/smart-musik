import { Track, HeadphoneProfile, EQSetting } from './types';
import { dbInstance } from './storage';

export const EQ_FREQUENCIES = [60, 150, 400, 1000, 2500, 4000, 6300, 10000, 14000, 16000];

class AudioManager {
  public audioContext: AudioContext | null = null;
  public audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private gainNode: GainNode | null = null;
  private isInitialized = false;

  constructor() {
    // Lazy initialize to respect gesture restrictions
  }

  public init() {
    if (this.isInitialized) return;

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    // We keep custom event listeners on the audio element elsewhere
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

    // Build 10-band peaking filter chain
    let currentInput: AudioNode = this.sourceNode;
    
    this.filters = EQ_FREQUENCIES.map((freq) => {
      if (!this.audioContext) throw new Error('AudioContext missing');
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      filter.Q.setValueAtTime(1.41, this.audioContext.currentTime);
      filter.gain.setValueAtTime(0, this.audioContext.currentTime);
      
      currentInput.connect(filter);
      currentInput = filter;
      return filter;
    });

    // Attach gain node for volume controller
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
    currentInput.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.isInitialized = true;
    console.warn('AudioManager fully initialized on user gesture.');
  }

  public ensureResume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public setVolume(volume: number) {
    if (!this.isInitialized) this.init();
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime
      );
    }
  }

  public applyBands(bands: number[]) {
    if (!this.isInitialized) this.init();
    if (bands.length !== 10) return;
    this.filters.forEach((filter, index) => {
      const val = Math.max(-12, Math.min(12, bands[index]));
      if (this.audioContext) {
        filter.gain.setValueAtTime(val, this.audioContext.currentTime);
      }
    });
  }

  public resetBands() {
    this.applyBands(Array(10).fill(0));
  }

  // AI RECOMMENDATION & REINFORCEMENT LEARNING LOGIC
  // Generates unique audio features dynamically or deterministically for a track
  public generateFeaturesForTrack(trackName: string, durationSec: number) {
    const sum = trackName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Deterministic random numbers [0, 1] based on seed
    const pseudoRand = (offset: number) => {
      const x = Math.sin(sum + offset) * 10000;
      return x - Math.floor(x);
    };

    return {
      bandEnergy: [
        pseudoRand(1), // Sub-bass
        pseudoRand(2), // Bass
        pseudoRand(3), // Low-mids
        pseudoRand(4), // Mids
        pseudoRand(5), // Upper-mids
        pseudoRand(6), // Presence
        pseudoRand(7)  // Treble
      ],
      spectralCentroid: pseudoRand(8),
      rms: pseudoRand(9),
      peakAvgRatio: pseudoRand(10)
    };
  }

  // Standard Smart Predictor combining:
  // Headphone Correction Curve + Track Spectral features + Current Mood biases
  // Outputting the calibrated 10-band target EQ setting
  public generateAIEQPredict(headphone: HeadphoneProfile, track: Track, mood?: 'chill' | 'energetic' | 'focus' | 'melancholic' | 'default'): number[] {
    const features = track.audioFeatures || this.generateFeaturesForTrack(track.fileName, track.duration);
    
    // Core correction curve from AutoEQ profile (form the baseline)
    const curve = [...headphone.correctionCurve];

    // Modify baseline using track audio characteristics:
    const energy = features.bandEnergy;
    const weight0 = (energy[0] - 0.5) * 4; // sub-bass pushes 60Hz
    const weight1 = (energy[1] - 0.5) * 3; // bass pushes 150Hz
    const weight2 = (energy[2] - 0.5) * 2; // low-mid pushes 400Hz
    const weight3 = (energy[3] - 0.5) * 1; // mid pushes 1000Hz
    const weight4 = (energy[4] - 0.5) * 1.5; // upper-mid pushes 2.5kHz
    const weight5 = (energy[5] - 0.5) * 2; // presence pushes 4kHz, 6.3kHz
    const weight6 = (energy[6] - 0.5) * -3; // excess treble pull down high bands to smooth it out

    let result = [
      curve[0] + weight0,
      curve[1] + weight1,
      curve[2] + weight2,
      curve[3] + weight3,
      curve[4] + weight4,
      curve[5] + weight5,
      curve[6] + weight5 * 0.7,
      curve[7] + weight6,
      curve[8] + weight6 * 1.2,
      curve[9] + weight6 * 1.5,
    ];

    // APPLY PLAYBACK MOOD CONTEXT COEFFS
    if (mood === 'chill') {
      result[0] += 1.5; // Low warmth boost
      result[1] += 1.0;
      result[7] -= 1.0; // High frequency roll-off for zero listening fatigue
      result[8] -= 1.5;
      result[9] -= 1.5;
    } else if (mood === 'energetic') {
      result[0] += 2.0; // Maximum bass punch
      result[1] += 1.5;
      result[5] += 1.5; // High end snap
      result[6] += 1.0;
      result[9] += 1.0;
    } else if (mood === 'focus') {
      // Scale all deviations towards flat baseline for transparent concentration focus sound
      result = result.map(v => v * 0.65);
    } else if (mood === 'melancholic') {
      result[0] += 1.0; // Sub-envelope
      result[3] += 1.5; // High mid presence to capture emotive vocals clearly
      result[4] += 1.5;
      result[5] += 1.0;
    }

    // Clamp values between [-12.0, +12.0] as mandated by design specification
    return result.map(val => Math.max(-12, Math.min(12, Number(val.toFixed(1)))));
  }

  // Reinforcement Learning Perturbation (Epsilon-Greedy Update)
  // Invoked when user dislikes active EQ profile.
  // Generation acts as step size dampener: gen=0 (2.0dB), gen=1 (1.5dB), gen=2 (1.0dB), gen>=3 (0.5dB)
  public generateAlternativeEQ(currentBands: number[], headphone: HeadphoneProfile, generation: number): number[] {
    let stepSize = 0.5;
    if (generation === 0) stepSize = 2.0;
    else if (generation === 1) stepSize = 1.5;
    else if (generation === 2) stepSize = 1.0;

    // Perturb bands randomly but biased towards the correction polarity
    return currentBands.map((bandVal, index) => {
      const brandCorrectionSign = Math.sign(headphone.correctionCurve[index]) || 1;
      
      // Epsilon perturbation logic
      const randomDirection = Math.random() > 0.45 ? brandCorrectionSign : -brandCorrectionSign;
      const noise = (Math.random() * 0.6 + 0.7) * stepSize * randomDirection;
      
      const newBandsVal = bandVal + noise;
      return Math.max(-12, Math.min(12, Number(newBandsVal.toFixed(1))));
    });
  }
}

export const audioService = new AudioManager();
