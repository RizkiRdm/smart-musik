import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Shuffle, RotateCcw, FileText } from 'lucide-react';
import { Track } from '../types';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  progressPercent: number; // 0 to 100
  onSeekChange: (percent: number) => void;
  currentTimeStr: string;
  durationTimeStr: string;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isShuffle: boolean;
  onShuffleToggle: () => void;
  isRepeat: boolean;
  onRepeatToggle: () => void;
  showLyrics?: boolean;
  onLyricsToggle?: () => void;
}

export default function MiniPlayer({
  track,
  isPlaying,
  onPlayToggle,
  onPrev,
  onNext,
  progressPercent,
  onSeekChange,
  currentTimeStr,
  durationTimeStr,
  volume,
  onVolumeChange,
  isShuffle,
  onShuffleToggle,
  isRepeat,
  onRepeatToggle,
  showLyrics = false,
  onLyricsToggle
}: MiniPlayerProps) {

  return (
    <footer className="h-24 bg-white border-t-4 border-black flex items-center px-6 justify-between select-none z-20 shrink-0 shadow-[0_-4px_0_0_#000]">
      
      {/* Track info Left */}
      <div className="flex items-center gap-4 w-[300px] overflow-hidden shrink-0">
        {track ? (
          <>
            <div className="w-14 h-14 brutal-border bg-accent flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#000]">
              <Music className="w-7 h-7 text-black" />
            </div>
            <div className="overflow-hidden">
              <p className="font-black text-sm text-black truncate uppercase tracking-tighter leading-none">
                {track.title}
              </p>
              <p className="font-mono text-[11px] text-black/60 truncate mt-1 font-bold">
                {track.artist || 'UNKNOWN SOURCE'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 brutal-border bg-zinc-100 flex items-center justify-center shrink-0">
              <div className="w-4 h-4 brutal-border bg-black/10" />
            </div>
            <div>
              <p className="font-black text-[11px] text-black/30 uppercase tracking-widest">NO SIGNAL</p>
              <p className="font-mono text-[10px] text-black/20 mt-0.5">LOAD DATA SOURCE</p>
            </div>
          </>
        )}
      </div>

      {/* Primary Players Middle */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-2">
        {/* Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={onShuffleToggle}
            className={`p-2 brutal-border transition-all ${isShuffle ? 'bg-accent text-black shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-black/30 hover:text-black hover:bg-zinc-50'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            disabled={!track}
            className="p-2 brutal-border bg-white text-black hover:bg-accent disabled:bg-zinc-100 disabled:text-black/20 disabled:cursor-not-allowed transition-all"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Core play pause center */}
          <button
            onClick={onPlayToggle}
            disabled={!track}
            className="w-14 h-14 brutal-border bg-accent text-black disabled:bg-zinc-100 disabled:text-black/20 cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none flex items-center justify-center shadow-[4px_4px_0px_0px_#000]"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-[1px]" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!track}
            className="p-2 brutal-border bg-white text-black hover:bg-accent disabled:bg-zinc-100 disabled:text-black/20 disabled:cursor-not-allowed transition-all"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onRepeatToggle}
            className={`p-2 brutal-border transition-all ${isRepeat ? 'bg-accent text-black shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-black/30 hover:text-black hover:bg-zinc-50'}`}
            title="Repeat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider bar */}
        <div className="w-full flex items-center gap-4">
          <span className="font-mono text-[11px] text-black font-black tabular-nums shrink-0 w-10 text-right">
            {currentTimeStr}
          </span>
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={(e) => onSeekChange(Number(e.target.value))}
              disabled={!track}
              className="w-full h-3 brutal-border bg-white appearance-none accent-black cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>
          <span className="font-mono text-[11px] text-black font-black tabular-nums shrink-0 w-10">
            {durationTimeStr}
          </span>
        </div>
      </div>

      {/* Right Side Options placeholder */}
      <div className="w-[300px] flex items-center justify-end gap-4 shrink-0">
        {onLyricsToggle && (
          <button
            onClick={onLyricsToggle}
            className={`p-2 brutal-border transition-all ${
              showLyrics
                ? 'bg-black text-accent shadow-[3px_3px_0px_0px_#C8FF00]'
                : 'bg-white text-black/30 hover:text-black hover:bg-zinc-50'
            }`}
            title="Lyrics"
          >
            <FileText className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 brutal-border bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
          <Volume2 className="w-5 h-5 text-black shrink-0" />
          <div className="relative w-28 flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-black/10 appearance-none accent-black cursor-pointer"
            />
          </div>
        </div>
      </div>

    </footer>
  );
}
