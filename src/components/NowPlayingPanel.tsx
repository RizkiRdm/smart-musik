import { Disc, Sliders, Volume2 } from 'lucide-react';
import { Track, HeadphoneProfile } from '../types';
import { mlService } from '../services/MLService';

interface NowPlayingPanelProps {
  track: Track | null;
  isPlaying: boolean;
  activeHeadphone: HeadphoneProfile | null;
  eqBands: number[];
  onEQBandsChange: (bands: number[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onPlayToggle: () => void;
  progressPercent: number;
  onSeekChange: (percent: number) => void;
  currentTimeStr: string;
  durationTimeStr: string;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function NowPlayingPanel({
  track,
  isPlaying,
  activeHeadphone,
  eqBands,
  onEQBandsChange,
  onPrev,
  onNext,
  onPlayToggle,
  progressPercent,
  onSeekChange,
  currentTimeStr,
  durationTimeStr,
  volume,
  onVolumeChange
}: NowPlayingPanelProps) {

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...eqBands];
    updated[index] = Number(val.toFixed(1));
    onEQBandsChange(updated);
  };

  const freqLabels = ['60Hz', '150Hz', '400Hz', '1kHz', '2.5kHz', '4kHz', '6.3kHz', '10kHz', '14kHz', '16kHz'];

  return (
    <aside className="w-[340px] bg-zinc-900 border-l-4 border-black flex flex-col h-full z-10 shrink-0 select-none">
      {track ? (
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 gap-6">
          
          {/* Cover Art Frame */}
          <div className="aspect-square w-full brutal-border relative bg-white flex items-center justify-center overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Disc className={`w-36 h-36 text-black/10 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
            <div className="absolute inset-x-0 bottom-0 bg-accent border-t-4 border-black px-4 py-3 flex items-center justify-between">
              <span className="font-black text-[11px] text-black uppercase tracking-tighter">SIGNAL ACTIVE</span>
              <span className="font-mono text-[10px] text-black/60 font-black uppercase">{track.format}</span>
            </div>
          </div>

          {/* Metadata Block */}
          <div className="bg-white brutal-border p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-lg text-black truncate uppercase tracking-tighter leading-none">
              {track.title}
            </h3>
            <p className="font-mono text-xs text-black/50 mt-1.5 truncate font-bold">
              {track.artist || 'UNKNOWN SOURCE'}
            </p>
          </div>

          {/* Hardware EQ Console */}
          <div className="bg-white brutal-border p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-black" />
              <span className="font-black text-xs text-black uppercase tracking-widest">HARDWARE CONSOLE</span>
            </div>

            {/* EQ Sliders Grid */}
            <div className="grid grid-cols-5 gap-y-6 gap-x-2">
              {eqBands.map((bandValue, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="font-mono text-[8px] text-black font-black uppercase">{freqLabels[index]}</span>
                  {/* Vertical Slider Simulation */}
                  <div className="relative h-24 w-6 brutal-border bg-zinc-100 flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={bandValue}
                      onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                      className="absolute h-full w-full opacity-0 cursor-pointer z-10"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        WebkitAppearance: 'none'
                      }}
                    />
                    {/* Fill track visualizer */}
                    <div 
                      className="absolute w-full bottom-0 bg-accent border-t-2 border-black pointer-events-none"
                      style={{
                        height: `${((bandValue + 12) / 24) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[9px] font-black text-black">
                    {bandValue > 0 ? `+${bandValue}` : bandValue}
                  </span>
                </div>
              ))}
            </div>

            {/* Preset and Helpers */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t-2 border-black">
              <button
                onClick={() => onEQBandsChange(Array(10).fill(0))}
                className="brutal-button-secondary py-2 text-[10px]"
              >
                FLAT
              </button>
              <button
                onClick={() => {
                  if (activeHeadphone && track.audioFeatures) {
                    const aiBands = mlService.predictEQ(track.audioFeatures, activeHeadphone);
                    onEQBandsChange(aiBands);
                  }
                }}
                disabled={!activeHeadphone || !track.audioFeatures}
                className="brutal-button py-2 text-[10px] disabled:bg-zinc-100 disabled:text-black/20 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
              >
                AUTO
              </button>
            </div>
          </div>

          {/* Volume Deck */}
          <div className="flex items-center gap-4 bg-white brutal-border px-4 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Volume2 className="w-5 h-5 text-black shrink-0" />
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                className="w-full h-3 brutal-border bg-zinc-100 appearance-none accent-black cursor-pointer"
              />
            </div>
            <span className="font-mono text-[11px] text-black font-black">{(volume * 100).toFixed(0)}%</span>
          </div>

        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 brutal-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6">
            <Disc className="w-10 h-10 text-black/10 animate-[spin_8s_linear_infinite]" />
          </div>
          <h4 className="font-black text-sm text-accent uppercase tracking-widest">CONSOLE DORMANT</h4>
          <p className="font-mono text-[10px] text-white/40 mt-3 max-w-[220px] leading-relaxed font-bold">
            LOAD AUDIO DATA SOURCE TO ACTIVATE HARDWARE INTERFACE.
          </p>
        </div>
      )}
    </aside>
  );
}
