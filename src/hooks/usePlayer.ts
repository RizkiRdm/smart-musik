import { usePlaybackStore } from '../stores/playbackStore';
import { audioPlayerService } from '../services/AudioPlayerService';
import { Track } from '../types';

export function usePlayer() {
  const playback = usePlaybackStore();

  const play = async (track: Track) => {
    await audioPlayerService.play(track);
  };

  const toggle = () => {
    audioPlayerService.toggle();
  };

  const setVolume = (volume: number) => {
    audioPlayerService.setVolume(volume);
  };

  const seek = (time: number) => {
    audioPlayerService.seek(time);
  };

  return {
    ...playback,
    play,
    toggle,
    setVolume,
    seek,
  };
}
