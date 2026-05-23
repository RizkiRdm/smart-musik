import { useEQStore } from '../stores/eqStore';
import { eqService } from '../services/EQService';

export function useEQ() {
  const eq = useEQStore();

  const applyBands = (bands: number[]) => {
    eqService.applyBands(bands);
  };

  const reset = () => {
    eqService.reset();
  };

  return {
    ...eq,
    applyBands,
    reset,
  };
}
