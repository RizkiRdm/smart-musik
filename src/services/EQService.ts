import { useEQStore } from '../stores/eqStore';

export const EQ_FREQUENCIES = [60, 150, 400, 1000, 2500, 4000, 6300, 10000, 14000, 16000];

class EQService {
  private static instance: EQService;
  private filters: BiquadFilterNode[] = [];
  private context: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): EQService {
    if (!EQService.instance) {
      EQService.instance = new EQService();
    }
    return EQService.instance;
  }

  public init(context: AudioContext, input: AudioNode): AudioNode {
    this.context = context;
    this.filters = [];

    let currentInput = input;

    EQ_FREQUENCIES.forEach((freq) => {
      const filter = context.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.setValueAtTime(freq, context.currentTime);
      filter.Q.setValueAtTime(1.41, context.currentTime);
      filter.gain.setValueAtTime(0, context.currentTime);

      currentInput.connect(filter);
      currentInput = filter;
      this.filters.push(filter);
    });

    return currentInput;
  }

  public applyBands(bands: number[]) {
    if (bands.length !== 10 || !this.context) return;
    
    this.filters.forEach((filter, index) => {
      const val = Math.max(-12, Math.min(12, bands[index]));
      filter.gain.setTargetAtTime(val, this.context!.currentTime, 0.05);
    });

    useEQStore.getState().setEQBands(bands);
  }

  public reset() {
    this.applyBands(Array(10).fill(0));
  }
}

export const eqService = EQService.getInstance();
