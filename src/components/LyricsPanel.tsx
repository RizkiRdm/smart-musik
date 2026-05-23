import { useState, useEffect, useRef } from 'react';
import { Play, FileText, Check, Edit2, Info, Sparkles, X } from 'lucide-react';
import { Track } from '../types';

interface LyricLine {
  time: number; // seconds
  text: string;
}

interface LyricsPanelProps {
  track: Track | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onUpdateLyrics: (trackId: string, updatedLrc: string) => void;
  onClose?: () => void;
}

// Generates cohesive, high-quality, atmospheric lyrics based on track properties
function generateThematicLyrics(track: Track): LyricLine[] {
  const duration = track.duration || 180;
  const numLines = Math.max(8, Math.floor(duration / 12));
  
  // Choose thematic template based on track name or metadata
  const titleLower = track.title.toLowerCase();
  const artistLower = (track.artist || '').toLowerCase();
  const fullText = `${titleLower} ${artistLower}`;

  let lineTemplates: string[] = [];

  if (fullText.includes('love') || fullText.includes('heart') || fullText.includes('you') || fullText.includes('dream')) {
    lineTemplates = [
      "IN THE SOFTEST LIGHT, OUR SIGNALS CROSS",
      "FINDING QUIET MOMENTS, CALCULATIONS LOST",
      "EVERY FREQUENCY I SEND IS TUNED TO YOU",
      "AN ACOUSTIC PORTRAIT OF A LOVE SO TRUE",
      "WE DRIFT THROUGH WAVES OF HARMONIC RESONANCE",
      "CAUGHT WITHIN A SILENT, ELEGANT DANCE",
      "UNDERNEATH THE DIGITAL CANOPY TONIGHT",
      "TWO PATTERNS MATCHING IN THE VELVET LIGHT",
      "FILTERING THE SORROW FROM OUR YESTERDAY",
      "LETTING ALL THE BASS-LINES CARRY US AWAY",
      "YOUR HEARTBEAT CALIBRATES MY DEEPEST MIND",
      "THE PERFECT SWEET SPOT WE WERE BORN TO FIND",
      "DRIFTING OFF INTO THE INFINITE NIGHT STREAM",
      "SAFE INSIDE THE MEMORY OF A GOLDEN DREAM"
    ];
  } else if (fullText.includes('night') || fullText.includes('dark') || fullText.includes('drive') || fullText.includes('neon') || fullText.includes('city') || track.genre === 'Synthwave' || track.genre === 'Electronic') {
    lineTemplates = [
      "NEON HEADLIGHTS SLICING THROUGH THE RAIN",
      "SYNTHESIZERS CRYING, WASHING OUT THE PAIN",
      "MIDNIGHT CALIBRATOR TICKING IN THE DARK",
      "EVERY TRANSIENT PULSE IGNITION OF A SPARK",
      "VOLTAGE CONTROLLED OSCILLATIONS IN OUR HEAD",
      "FADING OUT THE WARNING SIGNS THAT WE READ",
      "CRUISING PAST THE DIGITAL SKYLINE SO HIGH",
      "WHERE THE BASS IS HEAVY AND OUR SPIRITS FLY",
      "FILTERING THE HIGH BANDS, KEEPING IT SO CLEAN",
      "LIKE A PHANTOM DRIVER IN A CINEMATIC SCENE",
      "SUB-BASS RATTLING THE FRAME IN THE GLOOM",
      "GENERATING ECHOES IN A HOLLOW EMPTY ROOM",
      "WE RUN ON SIGNALS THAT ARE PURE AND RETRO-BOUND",
      "LOST WITHIN THE GRID OF HIGH FIDELITY SOUND"
    ];
  } else if (fullText.includes('sun') || fullText.includes('day') || fullText.includes('summer') || fullText.includes('bright') || track.moodTag === 'energetic') {
    lineTemplates = [
      "AWAKENING THE SPECTRUM, SUN BEGINS TO RISE",
      "BLINDING SOLAR GOLDEN FIRE IN OUR EYES",
      "RHYTHM PUMPIN' ELECTRICITY THROUGHOUT",
      "ERASING EVERY SHADOW, CLEARING OUT THE DOUBT",
      "TURN THE GAIN UP HIGHER, FEEL THE SUMMER HEAT",
      "PUMPING RAW ENERGY THROUGH THE DUSTY STREET",
      "DANCING ON THE PEAK THRESHOLDS, NEVER LOOKIN' BACK",
      "CHARGING UP THE BATTERIES ON THE STEREO TRACK",
      "HIGH FREQUENCY TRANSIENTS GLEAMING WHITE AND WILD",
      "VIBRANT SONIC PICTURES LIKE A PLAYFUL CHILD",
      "PUSHING FORWARD FAST, WE OUTRUN THE STORM",
      "CALIBRATED SYSTEMS KEEPING FEEDBACK WARM",
      "WE ARE THE LIVE STREAM THAT NEVER FADES AWAY",
      "BRIGHTENING THE EDGES OF THE GOLDEN SUMMER DAY"
    ];
  } else {
    // Elegant technical / ambient lo-fi default
    lineTemplates = [
      "ENTERING THE QUIET OF THE PLAYBACK STREAM",
      "SCANNING EMPTY BANDS INSIDE A LONELY DREAM",
      "MICRO-VOLTAGE CALIBRATION RUNNING IN THE BACK",
      "ISOLATING STEREO CHANNELS ON THE CURRENT TRACK",
      "AMBIENT VIBRATIONS HUMMING SOFT AND LOW",
      "WATCHING FREQUENCY RESPONSES START TO FLOW",
      "ACOUSTIC WARMTH RETURNING TO THE FROZEN WIRE",
      "AS THE SPECTRAL CENTROID CLIMBS A LITTLE HIGHER",
      "SUBTLE HARMONICS PAINTING PICTURES IN THE HEAD",
      "INTERPRETING THE PATTERNS THAT THE SENSORS READ",
      "NO MORE NOISE, WE SET THE EQUALIZER SCALE",
      "STEERING SAFELY FORWARD THROUGH THE GENTLE GALE",
      "WE ARE THE ECHOES OF A DISTANT RADIO SPACE",
      "BEAUTIFULLY ALIGNED IN THIS SOPHISTICATED PLACE"
    ];
  }

  const lines: LyricLine[] = [];
  const startOffset = 4; // Start lyrics after 4 seconds
  const playZone = duration - 10;
  const interval = playZone / numLines;

  for (let i = 0; i < numLines; i++) {
    const time = parseFloat((startOffset + (i * interval)).toFixed(1));
    const templateIndex = i % lineTemplates.length;
    lines.push({
      time,
      text: lineTemplates[templateIndex]
    });
  }

  return lines;
}

// Parses standard .lrc format lyrics
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{0,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const msStr = match[3] || '0';
      const ms = parseInt(msStr.padEnd(3, '0')) / 1000;
      const totalSeconds = min * 60 + sec + ms;
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export default function LyricsPanel({
  track,
  currentTime,
  onSeek,
  onUpdateLyrics,
  onClose
}: LyricsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localLrc, setLocalLrc] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse or generate lyrics periodically when track loads
  useEffect(() => {
    if (!track) {
      setParsedLyrics([]);
      setLocalLrc('');
      return;
    }

    if (track.lyrics) {
      setParsedLyrics(parseLrc(track.lyrics));
      setLocalLrc(track.lyrics);
    } else {
      const generated = generateThematicLyrics(track);
      setParsedLyrics(generated);
      // Format as LRC for easy user editing
      const lrcString = generated
        .map((line) => {
          const m = Math.floor(line.time / 60).toString().padStart(2, '0');
          const s = Math.floor(line.time % 60).toString().padStart(2, '0');
          const ms = Math.floor((line.time % 1) * 100).toString().padStart(2, '0');
          return `[${m}:${s}.${ms}] ${line.text}`;
        })
        .join('\n');
      setLocalLrc(lrcString);
    }
  }, [track]);

  // Handle active line detection & scroll alignment
  const activeIndex = parsedLyrics.reduce((acc, lyric, index) => {
    if (currentTime >= lyric.time) {
      return index;
    }
    return acc;
  }, -1);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const element = activeLineRef.current;
      const container = containerRef.current;
      
      const containerHeight = container.clientHeight;
      const elementOffsetTop = element.offsetTop;
      const elementHeight = element.clientHeight;

      container.scrollTo({
        top: elementOffsetTop - containerHeight / 2 + elementHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  const handleSave = () => {
    if (track) {
      onUpdateLyrics(track.id, localLrc);
      setIsEditing(false);
    }
  };

  if (!track) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full bg-[#111]">
        <div className="w-16 h-16 brutal-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-black/20" />
        </div>
        <h3 className="font-black text-xl text-white uppercase tracking-tighter">LYRICS_OFFLINE</h3>
        <p className="font-mono text-[10px] text-white/30 max-w-[280px] mt-3 font-bold uppercase leading-relaxed">
          NO ACTIVE STREAM DETECTED. SELECT DATA SOURCE TO SYNC KARAOKE INTERFACE.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111] border-l-4 border-black relative">
      
      {/* Panel Top Header Bar */}
      <div className="px-6 py-5 bg-accent border-b-4 border-black flex justify-between items-center shrink-0 z-10 shadow-[0_4px_0_0_#000]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 brutal-border bg-black flex items-center justify-center text-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-black uppercase tracking-tighter leading-none">KARAOKE_INTERFACE</h3>
            <p className="font-mono text-[9px] text-black/60 font-black tracking-widest uppercase mt-1">
              {track.lyrics ? 'SYNC: CUSTOM_LRC' : 'SYNC: AUTO_GENERATED'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="brutal-button-secondary py-1.5 px-3 text-[10px]"
            >
              <Edit2 className="w-3.5 h-3.5 inline-block mr-1" />
              EDIT_LRC
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="brutal-button py-1.5 px-3 text-[10px]"
              >
                <Check className="w-3.5 h-3.5 inline-block mr-1" />
                SAVE
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="brutal-button-secondary py-1.5 px-3 text-[10px]"
              >
                CANCEL
              </button>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center brutal-border bg-white text-black hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {!isEditing ? (
          /* Lyrics Synchronized Scrolling Area */
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-10 py-24 scroll-smooth custom-scrollbar flex flex-col items-center justify-start gap-12"
          >
            {/* Pad the top */}
            <div className="h-32 shrink-0" />

            {parsedLyrics.map((lyric, idx) => {
              const isActive = activeIndex === idx;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(lyric.time)}
                  className={`text-center py-4 px-6 brutal-border transition-all duration-300 select-none max-w-lg w-full cursor-pointer ${
                    isActive
                      ? 'bg-accent text-black font-black text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-1'
                      : isPast
                      ? 'bg-white/5 text-white/40 font-black text-sm uppercase tracking-tight'
                      : 'bg-transparent text-white/10 font-black text-sm uppercase tracking-tight border-white/5'
                  }`}
                >
                  {lyric.text}
                </div>
              );
            })}

            {!track.lyrics && (
              <div className="mt-12 p-5 bg-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-black shrink-0" />
                <p className="font-mono text-[9px] text-black/60 font-black uppercase leading-normal">
                  AUTO_CALIBRATION_MODE: DEMONSTRATING AI_GENERATED SIGNALS.
                </p>
              </div>
            )}

            {/* Pad the bottom */}
            <div className="h-48 shrink-0" />
          </div>
        ) : (
          /* Plain Text editor */
          <div className="flex-1 flex flex-col p-8 gap-6 bg-zinc-900">
            <div className="flex items-start gap-4 p-5 brutal-border bg-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Info className="w-5 h-5 text-black shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-xs text-black uppercase tracking-widest">LRC_MANUAL_V1</p>
                <p className="font-mono text-[10px] text-black/60 font-black leading-normal uppercase">
                  FORMAT: [MM:SS.CC] TEXT. CALIBRATE TIME BRACKETS FOR REAL-TIME SYNC.
                </p>
              </div>
            </div>

            <textarea
              value={localLrc}
              onChange={(e) => setLocalLrc(e.target.value)}
              className="flex-grow w-full bg-white brutal-border p-6 font-mono text-xs text-black font-black placeholder:text-black/20 focus:outline-none focus:shadow-[6px_6px_0px_0px_#C8FF00] resize-none custom-scrollbar uppercase"
              placeholder="[00:04.00] INTRO SIGNAL...&#10;[00:15.50] MAIN CARRIER..."
            />
          </div>
        )}
      </div>

    </div>
  );
}
