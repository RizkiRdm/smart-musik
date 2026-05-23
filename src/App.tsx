import { useState, useEffect } from 'react';
import { 
  Library, 
  Settings, 
  Disc, 
  Radio, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  HelpCircle,
  FolderMinus,
  CheckCircle,
  HelpCircle as HelpIcon,
  FolderMinus as ClearIcon,
  FileText
} from 'lucide-react';

import { Track, HeadphoneProfile, EQSetting, FeedbackLog } from './types';
import { dbInstance, DEFAULT_HEADPHONE_PROFILES } from './storage';
import { audioService } from './audio';

// PAGES
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';

// COMPONENTS
import HeadphoneSelector from './components/HeadphoneSelector';
import NowPlayingPanel from './components/NowPlayingPanel';
import MiniPlayer from './components/MiniPlayer';
import EQFeedbackPill from './components/EQFeedbackPill';
import LyricsPanel from './components/LyricsPanel';
import { AppInitLoader } from './components/AppInitLoader';
import { useUIStore } from './stores/uiStore';

export default function App() {
  const isInitializing = useUIStore(state => state.isInitializing);

  if (isInitializing) {
    return <AppInitLoader />;
  }

  // STATE MANAGEMENTS
  const [activeTab, setActiveTab] = useState<'library' | 'settings'>('library');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [playbackMood, setPlaybackMood] = useState<'chill' | 'energetic' | 'focus' | 'melancholic' | 'default'>('default');
  const [showLyrics, setShowLyrics] = useState(false);

  const [activeHeadphone, setActiveHeadphone] = useState<HeadphoneProfile | null>(null);
  const [eqBands, setEqBands] = useState<number[]>(Array(10).fill(0));
  
  // RL model track-specific evaluation helper
  const [listeningMs, setListeningMs] = useState(0);
  const [showFeedbackPill, setShowFeedbackPill] = useState(false);
  const [hasEvaluatedActiveTrack, setHasEvaluatedActiveTrack] = useState(false);
  const [mlGeneration, setMlGeneration] = useState(0);
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>([]);

  // 1. DATABASE INITIALIZATION
  useEffect(() => {
    const startDb = async () => {
      try {
        await dbInstance.init();
        
        // Load settings preference (active headphone)
        const savedHpId = await dbInstance.getPreference<string | null>('selected_headphone_id', null);
        if (savedHpId) {
          const matched = DEFAULT_HEADPHONE_PROFILES.find((hp) => hp.id === savedHpId);
          if (matched) setActiveHeadphone(matched);
        }

        // Load playback settings preference
        const savedMood = await dbInstance.getPreference<'chill' | 'energetic' | 'focus' | 'melancholic' | 'default'>('selected_playback_mood', 'default');
        setPlaybackMood(savedMood);

        const savedShowLyrics = await dbInstance.getPreference<boolean>('show_lyrics_panel', false);
        setShowLyrics(savedShowLyrics);

        // Load tracks from Local cache
        const savedTracks = await dbInstance.getAllTracks();
        setTracks(savedTracks);

        // Load ML feedback logs
        const logs = await dbInstance.getAllFeedback();
        setFeedbackLogs(logs);

      } catch (err) {
        console.error('Failed to initialize local IndexedDB profiles:', err);
      }
    };
    startDb();
  }, []);

  // 2. AUDIO CONTEXT SYNCS
  useEffect(() => {
    const el = audioService.audioElement;
    if (!el) return;

    const handleTimeUpdate = () => {
      setCurrentTime(el.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(el.duration || 0);
    };

    const handleEnded = () => {
      handleTrackEnded();
    };

    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('durationchange', handleDurationChange);
    el.addEventListener('ended', handleEnded);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('durationchange', handleDurationChange);
      el.removeEventListener('ended', handleEnded);
    };
  }, [activeTrack, tracks, isRepeat, isShuffle]);

  // Handle auto volume syncs
  useEffect(() => {
    audioService.setVolume(volume);
  }, [volume]);

  // Synchronize filter sliders on change
  useEffect(() => {
    audioService.applyBands(eqBands);
  }, [eqBands]);

  // 3. TRACK TIMING TICKER COUNTER (For AI evaluation prompt)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && activeTrack && activeHeadphone && !hasEvaluatedActiveTrack) {
      interval = setInterval(() => {
        setListeningMs((prev) => {
          const next = prev + 1000;
          if (next >= 5000 && !showFeedbackPill) {
            setShowFeedbackPill(true);
          }
          return next;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, activeTrack, activeHeadphone, hasEvaluatedActiveTrack, showFeedbackPill]);

  // 4. ACTION CONTROLLERS
  const loadAndPlayTrack = async (track: Track) => {
    try {
      audioService.init(); // ensure lazy audio startup matches gesture response
      audioService.ensureResume();

      // Stop current
      if (audioService.audioElement) {
        audioService.audioElement.pause();
      }

      // Recreate object URL representing the stored binary File
      if (track.fileObject && audioService.audioElement) {
        const url = URL.createObjectURL(track.fileObject);
        audioService.audioElement.src = url;
      } else {
        // Fallback for metadata-only instances or reloaded references
        console.warn('Track file binary pointer missing from RAM cache. Loading file from IndexedDB...');
        const hydrated = await dbInstance.getTrack(track.id);
        if (hydrated && hydrated.fileObject && audioService.audioElement) {
          const url = URL.createObjectURL(hydrated.fileObject);
          audioService.audioElement.src = url;
        } else {
          alert('Could not stream. Stored binary stream handle is stale.');
          return;
        }
      }

      // Increment track play count and lastPlayedAt for Smart Shuffle
      const playedCount = (track.playCount || 0) + 1;
      const updatedTrack = {
        ...track,
        playCount: playedCount,
        lastPlayedAt: Date.now()
      };
      await dbInstance.saveTrack(updatedTrack);
      setTracks(prev => prev.map(t => t.id === track.id ? updatedTrack : t));

      setActiveTrack(updatedTrack);
      setIsPlaying(true);
      setCurrentTime(0);
      setListeningMs(0);
      setShowFeedbackPill(false);
      setHasEvaluatedActiveTrack(false);

      // Fetch or Calibrate EQ settings for this track
      const savedEQ = await dbInstance.getEQSetting(track.id);
      if (savedEQ) {
        setEqBands(savedEQ.bands);
        setMlGeneration(savedEQ.generation);
      } else if (activeHeadphone) {
        // First initial calibration prediction, incorporating active playbackMood adaptation
        const initialCalculatedBands = audioService.generateAIEQPredict(activeHeadphone, updatedTrack, playbackMood);
        setEqBands(initialCalculatedBands);
        setMlGeneration(0);
        
        // Save initial calibrated recommendation
        const initialEQ: EQSetting = {
          trackId: track.id,
          headphoneId: activeHeadphone.id,
          generation: 0,
          bands: initialCalculatedBands,
          isDefault: true,
          source: 'ml_initial',
          createdAt: Date.now()
        };
        await dbInstance.saveEQSetting(initialEQ);
      } else {
        // No headphone selector preset: Flat line
        setEqBands(Array(10).fill(0));
        setMlGeneration(0);
      }

      if (audioService.audioElement) {
        audioService.audioElement.play().catch(err => {
          console.warn('Audio play request blocked, awaiting direct interaction touch gesture.', err);
        });
      }

    } catch (err) {
      console.error('Failed to load track address:', err);
    }
  };

  const handlePlayToggle = () => {
    if (!activeTrack) return;
    audioService.init();
    audioService.ensureResume();

    if (isPlaying) {
      audioService.audioElement?.pause();
      setIsPlaying(false);
    } else {
      audioService.audioElement?.play();
      setIsPlaying(true);
    }
  };

  const handleSeekChange = (percent: number) => {
    if (!activeTrack || !audioService.audioElement) return;
    const target = (percent / 100) * duration;
    audioService.audioElement.currentTime = target;
    setCurrentTime(target);
  };

  // Smart Shuffle Recommendation Strategy
  const getSmartShuffleNextTrack = (currentTrack: Track | null): Track => {
    if (tracks.length === 1) return tracks[0];
    
    // Choose candidates (exclude current playing song to ensure variety if size permits)
    const candidates = tracks.filter((t) => !currentTrack || t.id !== currentTrack.id);
    if (candidates.length === 0) return tracks[0];

    // Score candidates based on history, mood, and time
    const scoredCandidates = candidates.map((trackItem) => {
      let score = 100; // Base baseline score

      // 1. ACTIVE PLAYBACK MOOD RELEVANCE
      if (trackItem.moodTag && trackItem.moodTag === playbackMood) {
        score += 80;
      }
      
      const fullText = `${trackItem.title} ${trackItem.artist || ''} ${trackItem.genre || ''}`.toLowerCase();
      if (playbackMood === 'chill' && (fullText.includes('chill') || fullText.includes('lofi') || fullText.includes('slow') || fullText.includes('ambient') || fullText.includes('acoustic'))) {
        score += 50;
      } else if (playbackMood === 'energetic' && (fullText.includes('energy') || fullText.includes('rock') || fullText.includes('pop') || fullText.includes('fast') || fullText.includes('dance') || fullText.includes('synth'))) {
        score += 50;
      } else if (playbackMood === 'focus' && (fullText.includes('study') || fullText.includes('calm') || fullText.includes('piano') || fullText.includes('instrumental') || fullText.includes('relax') || fullText.includes('ambient'))) {
        score += 50;
      } else if (playbackMood === 'melancholic' && (fullText.includes('sad') || fullText.includes('cry') || fullText.includes('rain') || fullText.includes('dark') || fullText.includes('blue'))) {
        score += 50;
      }

      // 2. FAVORITE GENRES PROPAGATION
      if (trackItem.genre) {
        const genrePlays = tracks
          .filter((t) => t.genre === trackItem.genre)
          .reduce((sum, t) => sum + (t.playCount || 0), 0);
        score += Math.min(60, genrePlays * 10);
      }

      // 3. RECENCY INTERVALLING (penalize frequently/recently played tracks)
      const playCount = trackItem.playCount || 0;
      score -= playCount * 15;

      if (trackItem.lastPlayedAt) {
        const minutesSincePlayed = (Date.now() - trackItem.lastPlayedAt) / (1000 * 60);
        score += Math.min(45, minutesSincePlayed * 2.5);
      } else {
        score += 60; // Huge boost for fresh unplayed songs
      }

      // 4. CHRONIC TIME OF DAY ALIGNMENT
      const hour = new Date().getHours();
      const isDay = hour >= 6 && hour < 18;
      
      if (isDay) {
        if (trackItem.moodTag === 'energetic' || trackItem.moodTag === 'focus') score += 25;
      } else {
        if (trackItem.moodTag === 'chill' || trackItem.moodTag === 'melancholic') score += 30;
      }

      // 5. RL USER SATISFACTION (Likes)
      const isLiked = feedbackLogs.some((log) => log.trackId === trackItem.id && log.signal === 'like');
      if (isLiked) {
        score += 40;
      }

      return { track: trackItem, score };
    });

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Filter top 3 candidates and select randomly to maintain variety
    const selectLimit = Math.min(scoredCandidates.length, 3);
    const selectedIdx = Math.floor(Math.random() * selectLimit);
    return scoredCandidates[selectedIdx].track;
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const prevTrack = getSmartShuffleNextTrack(activeTrack);
      loadAndPlayTrack(prevTrack);
    } else {
      const currentIdx = tracks.findIndex(t => t.id === activeTrack?.id);
      const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
      loadAndPlayTrack(tracks[prevIdx]);
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const nextTrack = getSmartShuffleNextTrack(activeTrack);
      loadAndPlayTrack(nextTrack);
    } else {
      const currentIdx = tracks.findIndex(t => t.id === activeTrack?.id);
      const nextIdx = (currentIdx + 1) % tracks.length;
      loadAndPlayTrack(tracks[nextIdx]);
    }
  };

  const handleTrackEnded = () => {
    if (isRepeat) {
      if (audioService.audioElement) {
        audioService.audioElement.currentTime = 0;
        audioService.audioElement.play().catch(() => {});
      }
    } else {
      handleNext();
    }
  };

  // Add selected file from folder picker
  const handleAddTracks = async (files: File[]) => {
    const parsedTracks: Track[] = [];

    for (const file of files) {
      // Create metadata values
      const id = `${file.name}-${file.size}-${Date.now()}`;
      
      const track: Track = {
        id,
        fileName: file.name,
        fileSize: file.size,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '), // Clean name
        artist: 'IMPORTED LOCAL SIGNAL',
        duration: 210, // Default baseline estimate of 3:30 min, gets computed correctly upon file decode
        durationMs: 210 * 1000,
        format: file.name.split('.').pop() || 'wav',
        hasEQ: false,
        audioFeatures: audioService.generateFeaturesForTrack(file.name, 210),
        fileObject: file,
        addedAt: Date.now()
      };

      // Hydrate actual duration on background element
      try {
        const dummyEl = document.createElement('audio');
        dummyEl.src = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          dummyEl.onloadedmetadata = () => {
            if (dummyEl.duration && !isNaN(dummyEl.duration)) {
              track.duration = dummyEl.duration;
              track.audioFeatures = audioService.generateFeaturesForTrack(file.name, dummyEl.duration);
            }
            resolve();
          };
          dummyEl.onerror = () => resolve(); // continue on parse failures
        });
      } catch {
        // ignore
      }

      await dbInstance.saveTrack(track);
      parsedTracks.push(track);
    }

    setTracks(prev => [...prev, ...parsedTracks]);

    // Play first imported song automatically
    if (parsedTracks.length > 0 && !activeTrack) {
      loadAndPlayTrack(parsedTracks[0]);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    await dbInstance.deleteTrack(id);
    await dbInstance.deleteEQSetting(id);
    
    setTracks(prev => prev.filter(t => t.id !== id));
    
    if (activeTrack?.id === id) {
      audioService.audioElement?.pause();
      setActiveTrack(null);
      setIsPlaying(false);
      setEqBands(Array(10).fill(0));
    }
  };

  const handleUpdateTrack = async (updatedTrack: Track) => {
    await dbInstance.saveTrack(updatedTrack);
    setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
    
    // Smoothly synchronise active track state if we configured current track tags
    if (activeTrack && activeTrack.id === updatedTrack.id) {
      setActiveTrack(prev => prev ? { ...prev, ...updatedTrack } : null);
    }
  };

  const handleUpdateLyricsText = async (trackId: string, updatedLrc: string) => {
    const matched = tracks.find(t => t.id === trackId);
    if (matched) {
      const updated = { ...matched, lyrics: updatedLrc };
      await handleUpdateTrack(updated);
    }
  };

  const handleMoodChange = async (newMood: 'chill' | 'energetic' | 'focus' | 'melancholic' | 'default') => {
    setPlaybackMood(newMood);
    await dbInstance.savePreference('selected_playback_mood', newMood);

    // Adaptively recalibrate active curves immediately under active headphone targets
    if (activeTrack && activeHeadphone) {
      const moodCompensatedBands = audioService.generateAIEQPredict(activeHeadphone, activeTrack, newMood);
      setEqBands(moodCompensatedBands);

      const updatedEQSetting: EQSetting = {
        trackId: activeTrack.id,
        headphoneId: activeHeadphone.id,
        generation: 0,
        bands: moodCompensatedBands,
        isDefault: true,
        source: 'ml_initial',
        createdAt: Date.now()
      };
      await dbInstance.saveEQSetting(updatedEQSetting);
    }
  };

  const handleLyricsToggle = async () => {
    const nextVal = !showLyrics;
    setShowLyrics(nextVal);
    await dbInstance.savePreference('show_lyrics_panel', nextVal);
  };

  // Select headphone Calibration curve
  const handleSelectHeadphone = async (hp: HeadphoneProfile) => {
    setActiveHeadphone(hp);
    await dbInstance.savePreference('selected_headphone_id', hp.id);

    // Apply compensation immediately to active track
    if (activeTrack) {
      const pred = audioService.generateAIEQPredict(hp, activeTrack);
      setEqBands(pred);
      setMlGeneration(0);
      setShowFeedbackPill(false);
      setHasEvaluatedActiveTrack(false);

      // Save updated parameters corresponding to profile changes
      const newEQ: EQSetting = {
        trackId: activeTrack.id,
        headphoneId: hp.id,
        generation: 0,
        bands: pred,
        isDefault: true,
        source: 'ml_initial',
        createdAt: Date.now()
      };
      await dbInstance.saveEQSetting(newEQ);
    }
  };

  // 5. RL MODEL TELEMETRIES / LIKE VS DISLIKE ADJUSTMENTS
  const handleLikeCalibration = async () => {
    if (!activeTrack || !activeHeadphone) return;

    // Save active state to table as finalized custom curve setting
    const finalEQSetting: EQSetting = {
      trackId: activeTrack.id,
      headphoneId: activeHeadphone.id,
      generation: mlGeneration,
      bands: eqBands,
      isDefault: false,
      source: 'rl_updated',
      createdAt: Date.now()
    };
    await dbInstance.saveEQSetting(finalEQSetting);

    // Track active flag to enable icon badges
    setTracks(prev => prev.map(t => t.id === activeTrack.id ? { ...t, hasEQ: true } : t));

    // Save feedback log item
    const feedback: FeedbackLog = {
      trackId: activeTrack.id,
      headphoneId: activeHeadphone.id,
      signal: 'like',
      generation: mlGeneration,
      listenDurationMs: listeningMs,
      createdAt: Date.now()
    } as any; // Cast for now as v1 storage expects it
    await dbInstance.saveFeedback(feedback);

    setShowFeedbackPill(false);
    setHasEvaluatedActiveTrack(true);

    // Sync logs list
    const logs = await dbInstance.getAllFeedback();
    setFeedbackLogs(logs);
  };

  const handleDislikeAndPerturb = async () => {
    if (!activeTrack || !activeHeadphone) return;

    const nextGeneration = mlGeneration + 1;
    const perturbedBands = audioService.generateAlternativeEQ(eqBands, activeHeadphone, mlGeneration);
    
    setEqBands(perturbedBands);
    setMlGeneration(nextGeneration);

    // Save perturbed preset target to DB
    const perturbedEQ: EQSetting = {
      trackId: activeTrack.id,
      headphoneId: activeHeadphone.id,
      generation: nextGeneration,
      bands: perturbedBands,
      isDefault: false,
      source: 'ml_initial',
      createdAt: Date.now()
    };
    await dbInstance.saveEQSetting(perturbedEQ);

    // Save disliking diagnostic logs
    const feedback: FeedbackLog = {
      trackId: activeTrack.id,
      headphoneId: activeHeadphone.id,
      signal: 'dislike',
      generation: mlGeneration,
      listenDurationMs: listeningMs,
      createdAt: Date.now()
    } as any;
    await dbInstance.saveFeedback(feedback);

    // Temporarily trigger shake/re-evaluation
    setListeningMs(0);
    setShowFeedbackPill(false); // hides and restarts the evaluation duration loop

    // Reload log analytics
    const logs = await dbInstance.getAllFeedback();
    setFeedbackLogs(logs);
  };

  // Hard Wipe Data Trigger (Settings diagnostics center)
  const handleClearAllData = async () => {
    audioService.audioElement?.pause();
    setIsPlaying(false);
    setActiveTrack(null);
    setEqBands(Array(10).fill(0));
    setTracks([]);
    setActiveHeadphone(null);
    setFeedbackLogs([]);

    await dbInstance.clearAllEQData();
    // Delete files too
    const all = await dbInstance.getAllTracks();
    for (const t of all) {
      await dbInstance.deleteTrack(t.id);
    }
    await dbInstance.savePreference('selected_headphone_id', null);
  };

  // Helper formatting timelines
  const formatTimeStr = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeProgressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-white overflow-hidden select-none font-sans">
      
      {/* Upper core deck */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Menu */}
        <nav className="w-64 bg-[#050505] border-r border-white/10 flex flex-col h-full z-15 select-none shrink-0">
          
          {/* Logo Header branding */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-serif italic text-2xl tracking-tight text-orange-500">
                Smart Muzic
              </span>
              <span className="font-mono text-[9px] text-white/40 tracking-[0.1em] uppercase mt-0.5">
                Offline AutoEQ Calibrator
              </span>
            </div>
            <Radio className="w-4 h-4 text-orange-500 animate-pulse shrink-0 ml-1" />
          </div>

          {/* Navigation link blocks */}
          <div className="p-4 flex-grow space-y-2 overflow-y-auto custom-scrollbar">
            
            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-xs font-bold uppercase transition-all tracking-wide ${
                activeTab === 'library'
                  ? 'bg-white/5 text-orange-400 border border-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Track Library</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-xs font-bold uppercase transition-all tracking-wide ${
                activeTab === 'settings'
                  ? 'bg-white/5 text-orange-400 border border-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Calibration Center</span>
            </button>

            <button
              onClick={handleLyricsToggle}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-sans text-xs font-bold uppercase transition-all tracking-wide ${
                showLyrics
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>Show Lyrics</span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/10">
                {showLyrics ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* PLAYBACK MOOD SECTOR PANEL */}
            <div className="pt-6 border-t border-white/10 space-y-2">
              <span className="font-mono text-[9px] text-white/40 font-bold uppercase tracking-widest block px-1">SMART PLAYBACK MOOD</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { tag: 'default', label: 'Default 🌌' },
                  { tag: 'chill', label: 'Chill 🍃' },
                  { tag: 'energetic', label: 'Energy ⚡' },
                  { tag: 'focus', label: 'Focus 🎯' },
                  { tag: 'melancholic', label: 'Shadow 🌙' }
                ].map((item) => {
                  const isSelected = playbackMood === item.tag;
                  return (
                    <button
                      key={item.tag}
                      onClick={() => handleMoodChange(item.tag as any)}
                      className={`px-3 py-2 rounded-xl text-left font-sans text-[10px] font-bold uppercase border transition-all truncate ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HEADPHONE SELECTOR WIDGET */}
            <div className="pt-6 border-t border-white/10">
              <span className="font-mono text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-2 px-1">CALIBRATION HARDWARE TARGET</span>
              <HeadphoneSelector
                activeProfileId={activeHeadphone?.id || null}
                onSelectProfile={handleSelectHeadphone}
              />
            </div>

          </div>

          {/* NO UPGRADE PRO BUTTON VISIBLE - Completely deleted per user prompt constraint */}
          
          {/* Diagnostic footprint footer */}
          <div className="p-4 border-t border-white/10 bg-white/[0.01] text-[9px] font-mono text-white/30 space-y-1">
            <p>DB ENGINE: INDEXEDDB_V1</p>
            <p>SIGNAL STATE: {activeTrack ? 'ACTIVE_STREAM' : 'DORMANT'}</p>
            <p className="text-white/20">©{new Date().getFullYear()} DEEPMIND ANTIGRAVITY</p>
          </div>
          
        </nav>

        {/* Center Main Work Space */}
        <main className="flex-1 flex h-full bg-zinc-950 relative overflow-hidden">
          <div className="flex-grow flex h-full relative overflow-hidden">
            {/* Primary active sub-page column */}
            <div className={`flex-1 h-full flex flex-col ${showLyrics ? 'hidden md:flex' : 'flex'}`}>
              {activeTab === 'library' ? (
                <LibraryPage
                  tracks={tracks}
                  onAddTracks={handleAddTracks}
                  onPlayTrack={loadAndPlayTrack}
                  onDeleteTrack={handleDeleteTrack}
                  activeTrackId={activeTrack?.id || null}
                  onUpdateTrack={handleUpdateTrack}
                />
              ) : (
                <SettingsPage
                  activeProfile={activeHeadphone}
                  onClearAllData={handleClearAllData}
                  feedbackLogs={feedbackLogs}
                  onRefreshData={async () => {
                    const logs = await dbInstance.getAllFeedback();
                    setFeedbackLogs(logs);
                  }}
                />
              )}
            </div>

            {/* Karaoke interactive lyrics scrolling panel */}
            {showLyrics && (
              <div className="flex-1 md:max-w-md lg:max-w-lg xl:max-w-xl h-full border-l border-white/10 flex flex-col transition-all duration-300">
                <LyricsPanel
                  track={activeTrack}
                  currentTime={currentTime}
                  onSeek={handleSeekChange}
                  onUpdateLyrics={handleUpdateLyricsText}
                  onClose={() => handleLyricsToggle()}
                />
              </div>
            )}
          </div>
        </main>

        {/* Right Slider Console */}
        <NowPlayingPanel
          track={activeTrack}
          isPlaying={isPlaying}
          activeHeadphone={activeHeadphone}
          eqBands={eqBands}
          onEQBandsChange={setEqBands}
          onPrev={handlePrev}
          onNext={handleNext}
          onPlayToggle={handlePlayToggle}
          progressPercent={activeProgressPercent}
          onSeekChange={handleSeekChange}
          currentTimeStr={formatTimeStr(currentTime)}
          durationTimeStr={formatTimeStr(duration)}
          volume={volume}
          onVolumeChange={setVolume}
        />

      </div>

      {/* Floating Evaluator Pill Dialogue for Smart AI EQ parameters */}
      <EQFeedbackPill
        isVisible={showFeedbackPill}
        onLike={handleLikeCalibration}
        onDislike={handleDislikeAndPerturb}
        eqBands={eqBands}
      />

      {/* Persistent Bottom Bar Deck */}
      <MiniPlayer
        track={activeTrack}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onPrev={handlePrev}
        onNext={handleNext}
        progressPercent={activeProgressPercent}
        onSeekChange={handleSeekChange}
        currentTimeStr={formatTimeStr(currentTime)}
        durationTimeStr={formatTimeStr(duration)}
        volume={volume}
        onVolumeChange={setVolume}
        isShuffle={isShuffle}
        onShuffleToggle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onRepeatToggle={() => setIsRepeat(!isRepeat)}
        showLyrics={showLyrics}
        onLyricsToggle={handleLyricsToggle}
      />

    </div>
  );
}
