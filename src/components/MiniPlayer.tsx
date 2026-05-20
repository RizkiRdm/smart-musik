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
    <footer className="h-20 bg-[#050505] border-t border-white/10 flex items-center px-6 justify-between select-none z-20 shrink-0">
      
      {/* Track info Left */}
      <div className="flex items-center gap-3 w-[260px] overflow-hidden shrink-0">
        {track ? (
          <>
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/5">
              <Music className="w-5 h-5 text-orange-500 animate-spin-slow" />
            </div>
            <div className="overflow-hidden">
              <p className="font-sans text-xs font-bold text-white truncate tracking-tight leading-none">
                {track.title}
              </p>
              <p className="font-sans text-[10px] text-white/40 truncate mt-1.5">
                {track.artist || 'Unknown Signal Source'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div>
              <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest font-semibold">Ready to playback</p>
              <p className="font-sans text-[9px] text-white/20 mt-0.5">Please import or select a track</p>
            </div>
          </>
        )}
      </div>

      {/* Primary Players Middle */}
      <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onShuffleToggle}
            className={`p-1.5 transition-colors ${isShuffle ? 'text-orange-400' : 'text-white/30 hover:text-white/60'}`}
            title="Randomize list play order"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            disabled={!track}
            className="p-1.5 text-white/40 hover:text-white disabled:text-white/10 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Core play pause center */}
          <button
            onClick={onPlayToggle}
            disabled={!track}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500 disabled:bg-white/5 text-black disabled:text-white/20 select-none cursor-pointer transition-all duration-300 hover:bg-orange-400 hover:scale-105 active:scale-95 shadow-md shadow-orange-500/20"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-black" />
            ) : (
              <Play className="w-4 h-4 fill-current text-black translate-x-[1px]" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!track}
            className="p-1.5 text-white/40 hover:text-white disabled:text-white/10 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onRepeatToggle}
            className={`p-1.5 transition-colors ${isRepeat ? 'text-orange-400' : 'text-white/30 hover:text-white/60'}`}
            title="Toggle single repeating song looping"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider bar */}
        <div className="w-full flex items-center gap-3">
          <span className="font-mono text-[9px] text-white/40 tabular-nums select-none shrink-0 w-8 text-right">
            {currentTimeStr}
          </span>
          <div className="flex-1 relative flex items-center pr-1 pl-1">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={(e) => onSeekChange(Number(e.target.value))}
              disabled={!track}
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-orange-500 cursor-pointer disabled:opacity-30"
            />
          </div>
          <span className="font-mono text-[9px] text-white/40 tabular-nums select-none shrink-0 w-8">
            {durationTimeStr}
          </span>
        </div>
      </div>

      {/* Right Side Options placeholder (matches layout widths) */}
      <div className="w-[260px] flex items-center justify-end gap-3 shrink-0">
        {onLyricsToggle && (
          <button
            onClick={onLyricsToggle}
            className={`p-1.5 rounded-xl border transition-all ${
              showLyrics
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-white/[0.01] border-white/5 text-white/30 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Toggle Synchronized Lyrics Panel"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
        <Volume2 className="w-4 h-4 text-white/40 shrink-0" />
        <div className="relative w-24 flex items-center pr-1 pl-1">
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-full h-1 bg-white/10 rounded-full accent-orange-500 appearance-none cursor-pointer"
          />
        </div>
      </div>

    </footer>
  );
}
