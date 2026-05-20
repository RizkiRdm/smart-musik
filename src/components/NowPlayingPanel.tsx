import { Disc, Heart, Sliders, Volume2 } from 'lucide-react';
import { Track, HeadphoneProfile } from '../types';
import { EQ_FREQUENCIES, audioService } from '../audio';

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

  const bandColors = [
    '#f97316', // 60Hz - orange-500
    '#ea580c', // 150Hz - orange-600
    '#f97316', // 400Hz - orange-500
    '#f59e0b', // 1kHz - amber-500
    '#d97706', // 2.5kHz - amber-650
    '#f59e0b', // 4kHz - amber-500
    '#fb923c', // 6.3kHz - orange-400
    '#f59e0b', // 10kHz - amber-500
    '#ea580c', // 14kHz - orange-600
    '#f97316', // 16kHz - orange-500
  ];

  const freqLabels = ['60Hz', '150Hz', '400Hz', '1kHz', '2.5kHz', '4kHz', '6.3kHz', '10Hz', '14kHz', '16kHz'];

  return (
    <aside className="w-[320px] bg-[#050505] border-l border-white/10 flex flex-col h-full z-10 shrink-0 select-none">
      {track ? (
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 gap-6">
          
          {/* Cover Art Frame */}
          <div className="aspect-square w-full rounded-2xl border border-white/10 relative bg-white/[0.02] flex items-center justify-center overflow-hidden shadow-2xl shadow-orange-500/5">
            <Disc className={`w-32 h-32 text-white/10 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-md border-t border-white/10 px-3 py-2.5 flex items-center justify-between">
              <span className="font-mono text-[9px] text-orange-400 border border-orange-500/30 rounded-lg px-2 py-0.5 tracking-widest font-bold bg-orange-950/20">NOW PLAYING</span>
              <span className="font-mono text-[9px] text-white/40 uppercase">{track.format} // {track.fileSize > 1024 * 1024 ? `${(track.fileSize / (1024 * 1024)).toFixed(1)}MB` : `${(track.fileSize / 1024).toFixed(0)}KB`}</span>
            </div>
          </div>

          {/* Metadata Block */}
          <div>
            <h3 className="font-sans text-base font-bold text-white truncate leading-tight">
              {track.title}
            </h3>
            <p className="font-sans text-xs text-white/40 mt-1.5 truncate">
              {track.artist || 'IMPORTED LOCAL SIGNAL'}
            </p>
          </div>

          {/* Hardware EQ Console */}
          <div className="border border-white/10 bg-white/[0.01] rounded-2xl p-4 relative">
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#050505] px-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono text-[10px] text-orange-400 font-bold uppercase tracking-wider">HARDWARE CONSOLE</span>
            </div>

            {/* EQ Sliders Grid */}
            <div className="grid grid-cols-5 gap-y-4 gap-x-2 mt-2">
              {eqBands.map((bandValue, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5">
                  <span className="font-mono text-[8px] text-white/40 font-semibold tracking-tighter uppercase">{freqLabels[index]}</span>
                  {/* Vertical Slider Simulation */}
                  <div className="relative h-20 w-4 flex items-center justify-center bg-white/5 border border-white/15 rounded-full overflow-hidden">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={bandValue}
                      onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                      className="absolute accent-orange-500 h-full w-full opacity-100 cursor-pointer"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        WebkitAppearance: 'none',
                        background: 'transparent'
                      }}
                    />
                    {/* Fill track visualizer */}
                    <div 
                      className="absolute w-1 pointer-events-none rounded-full"
                      style={{
                        bottom: '0',
                        height: `${((bandValue + 12) / 24) * 100}%`,
                        backgroundColor: bandColors[index],
                      }}
                    />
                  </div>
                  <span className="font-mono text-[8px] font-bold tabular-nums" style={{ color: bandColors[index] }}>
                    {bandValue > 0 ? `+${bandValue}` : bandValue}
                  </span>
                </div>
              ))}
            </div>

            {/* Preset and Helpers */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10 grid grid-cols-2">
              <button
                onClick={() => onEQBandsChange(Array(10).fill(0))}
                className="text-center font-sans text-[10px] text-white/60 hover:text-white py-1.5 border border-white/10 hover:border-white/30 rounded-xl uppercase transition-all duration-300"
              >
                Flat Curve
              </button>
              <button
                onClick={() => {
                  if (activeHeadphone) {
                    const aiBands = audioService.generateAIEQPredict(activeHeadphone, track);
                    onEQBandsChange(aiBands);
                  }
                }}
                disabled={!activeHeadphone}
                className={`text-center font-sans text-[10px] py-1.5 border rounded-xl uppercase transition-all duration-300 ${
                  activeHeadphone 
                    ? 'border-orange-500/20 text-orange-400 hover:bg-orange-500/10' 
                    : 'border-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                Auto-Calibrate
              </button>
            </div>
          </div>

          {/* Volume Deck */}
          <div className="flex items-center gap-3 border border-white/10 rounded-xl px-4 py-3 bg-white/[0.01]">
            <Volume2 className="w-4 h-4 text-white/40 shrink-0" />
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 105}
                onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                className="w-full accent-orange-500 h-1 bg-white/10 appearance-none cursor-pointer rounded-full"
              />
            </div>
            <span className="font-mono text-[10px] text-white/60 tabular-nums">{(volume * 100).toFixed(0)}%</span>
          </div>

        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <Disc className="w-12 h-12 text-white/10 mb-4 animate-[spin_10s_linear_infinite]" />
          <h4 className="font-serif italic text-sm text-white/60 leading-none">Console Dormant</h4>
          <p className="text-[10px] text-white/30 font-sans mt-2 max-w-[200px] leading-relaxed">
            Please select any audio signal track to activate the hardware visualizers.
          </p>
        </div>
      )}
    </aside>
  );
}
