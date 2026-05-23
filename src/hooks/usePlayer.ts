import { usePlaybackStore } from '../stores/playbackStore';
import { useLibraryStore } from '../stores/libraryStore';
import { audioPlayerService } from '../services/AudioPlayerService';
import { libraryService } from '../services/LibraryService';
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

  const next = async () => {
    const track = libraryService.getNextTrack(playback.currentTrack, playback.isShuffle, playback.playbackMood);
    if (track) await play(track);
  };

  const prev = async () => {
    // Basic prev logic: if shuffle, get smart shuffle. If not, get prev in list.
    const tracks = useLibraryStore.getState().tracks;
    if (tracks.length === 0) return;
    
    let target: Track;
    if (playback.isShuffle) {
      target = libraryService.getSmartShuffleNextTrack(playback.currentTrack, playback.playbackMood);
    } else {
      const idx = tracks.findIndex(t => t.id === playback.currentTrack?.id);
      const prevIdx = (idx - 1 + tracks.length) % tracks.length;
      target = tracks[prevIdx];
    }
    await play(target);
  };

  return {
    ...playback,
    play,
    toggle,
    setVolume,
    seek,
    next,
    prev,
  };
}
