import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
      "In the softest light, our signals cross",
      "Finding quiet moments, calculations lost",
      "Every frequency I send is tuned to you",
      "An acoustic portrait of a love so true",
      "We drift through waves of harmonic resonance",
      "Caught within a silent, elegant dance",
      "Underneath the digital canopy tonight",
      "Two patterns matching in the velvet light",
      "Filtering the sorrow from our yesterday",
      "Letting all the bass-lines carry us away",
      "Your heartbeat calibrates my deepest mind",
      "The perfect sweet spot we were born to find",
      "Drifting off into the infinite night stream",
      "Safe inside the memory of a golden dream"
    ];
  } else if (fullText.includes('night') || fullText.includes('dark') || fullText.includes('drive') || fullText.includes('neon') || fullText.includes('city') || track.genre === 'Synthwave' || track.genre === 'Electronic') {
    lineTemplates = [
      "Neon headlights slicing through the rain",
      "Synthesizers crying, washing out the pain",
      "Midnight calibrator ticking in the dark",
      "Every transient pulse ignition of a spark",
      "Voltage controlled oscillations in our head",
      "Fading out the warning signs that we read",
      "Cruising past the digital skyline so high",
      "Where the bass is heavy and our spirits fly",
      "Filtering the high bands, keeping it so clean",
      "Like a phantom driver in a cinematic scene",
      "Sub-bass rattling the frame in the gloom",
      "Generating echoes in a hollow empty room",
      "We run on signals that are pure and retro-bound",
      "Lost within the grid of high fidelity sound"
    ];
  } else if (fullText.includes('sun') || fullText.includes('day') || fullText.includes('summer') || fullText.includes('bright') || track.moodTag === 'energetic') {
    lineTemplates = [
      "Awakening the spectrum, sun begins to rise",
      "Blinding solar golden fire in our eyes",
      "Rhythm pumpin' electricity throughout",
      "Erasing every shadow, clearing out the doubt",
      "Turn the gain up higher, feel the summer heat",
      "Pumping raw energy through the dusty street",
      "Dancing on the peak thresholds, never lookin' back",
      "Charging up the batteries on the stereo track",
      "High frequency transients gleaming white and wild",
      "Vibrant sonic pictures like a playful child",
      "Pushing forward fast, we outrun the storm",
      "Calibrated systems keeping feedback warm",
      "We are the live stream that never fades away",
      "Brightening the edges of the golden summer day"
    ];
  } else {
    // Elegant technical / ambient lo-fi default
    lineTemplates = [
      "Entering the quiet of the playback stream",
      "Scanning empty bands inside a lonely dream",
      "Micro-voltage calibration running in the back",
      "Isolating stereo channels on the current track",
      "Ambient vibrations humming soft and low",
      "Watching frequency responses start to flow",
      "Acoustic warmth returning to the frozen wire",
      "As the spectral centroid climbs a little higher",
      "Subtle harmonics painting pictures in the head",
      "Interpreting the patterns that the sensors read",
      "No more noise, we set the equalizer scale",
      "Steering safely forward through the gentle gale",
      "We are the echoes of a distant radio space",
      "Beautifully aligned in this sophisticated place"
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
  const linesEndRef = useRef<HTMLDivElement>(null);
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

      // Scroll to center the active lyric line
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full bg-[#050505]">
        <FileText className="w-12 h-12 text-white/10 mb-3" />
        <h3 className="font-serif italic text-lg text-white">Lyrics Offline</h3>
        <p className="font-sans text-xs text-white/30 max-w-[280px] mt-2 leading-relaxed">
          No track currently playing. Select a track from your library collection to sync karaoke audio text.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Panel Top Header Bar */}
      <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center bg-orange-500/10 text-orange-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif italic text-base text-white leading-none">Karaoke Lyrics</h3>
            <p className="font-mono text-[9px] text-white/40 tracking-wider uppercase mt-1">
              {track.lyrics ? 'CUSTOM LOCAL LRC' : 'AUTO-SYNCHRONIZED'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit toggler */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-orange-500/50 hover:text-white text-white/80 px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase transition-all"
            >
              <Edit2 className="w-3 h-3" />
              Edit LRC
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 bg-orange-500 text-black px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase hover:bg-orange-400 transition-all"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-white/5 border border-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5"
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
            className="flex-1 overflow-y-auto px-6 py-12 scroll-smooth custom-scrollbar flex flex-col items-center justify-start gap-8"
          >
            {/* Pad the top so first lines can center nicely */}
            <div className="h-24 shrink-0" />

            {parsedLyrics.map((lyric, idx) => {
              const isActive = activeIndex === idx;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(lyric.time)}
                  className={`text-center py-2 px-4 rounded-xl cursor-pointer hover:bg-white/5 duration-300 transform transition-all select-none max-w-lg w-full ${
                    isActive
                      ? 'scale-105 font-serif italic text-xl md:text-2xl text-orange-400 font-semibold'
                      : isPast
                      ? 'font-sans text-sm md:text-base text-white/50 hover:text-white/80'
                      : 'font-sans text-sm md:text-base text-white/20 hover:text-white/40'
                  }`}
                >
                  {lyric.text}
                </div>
              );
            })}

            {!track.lyrics && (
              <div className="mt-8 p-3 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] max-w-sm flex items-center gap-3 select-none shrink-0 self-center">
                <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500/10 shrink-0" />
                <p className="font-mono text-[9px] text-white/30 uppercase leading-normal">
                  No lyrics saved. Currently demonstrating AI synchronized calibration lines. Click 'Edit' above to overwrite.
                </p>
              </div>
            )}

            {/* Pad the bottom of scroll block */}
            <div className="h-44 shrink-0" />
          </div>
        ) : (
          /* Plain Text editor for .lrc karaoke lyrics */
          <div className="flex-1 flex flex-col p-6 gap-4 bg-black/40">
            <div className="flex items-start gap-2.5 p-3.5 border border-white/15 rounded-xl bg-white/[0.02]">
              <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-sans text-[11px] text-white font-bold uppercase tracking-wide">LRC Formatting Manual</p>
                <p className="font-sans text-[10px] text-white/40 leading-normal">
                  Write or copy lyrics in standard timed brackets format, with lines synchronized: <strong>[minutes:seconds.centi] lyrics text</strong> (e.g., <code className="text-orange-400 font-mono">[00:15.50] My customized song lyrics</code>). Click save to persist this calibration sheet.
                </p>
              </div>
            </div>

            <textarea
              value={localLrc}
              onChange={(e) => setLocalLrc(e.target.value)}
              className="flex-grow w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none custom-scrollbar"
              placeholder="[00:04.00] Intro melody...&#10;[00:15.50] Hello lyric line..."
            />
          </div>
        )}
      </div>

    </div>
  );
}
