import { useEQStore } from '../stores/eqStore';
import { eqService } from '../services/EQService';
import { HeadphoneProfile, EQSetting } from '../types';
import { getDB } from '../storage/db';

export function useEQ() {
  const eq = useEQStore();

  const applyBands = (bands: number[]) => {
    eqService.applyBands(bands);
    eq.setEQBands(bands);
  };

  const selectHeadphone = async (hp: HeadphoneProfile) => {
    eq.setActiveHeadphone(hp);
    const db = await getDB();
    await db.put('user_preferences', { key: 'selected_headphone_id', value: hp.id });
  };

  const reset = () => {
    eqService.reset();
  };

  return {
    ...eq,
    applyBands,
    selectHeadphone,
    reset,
  };
}
