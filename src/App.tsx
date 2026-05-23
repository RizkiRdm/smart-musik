import { useEffect, useState } from 'react';
import {
  Library,
  Settings,
  Radio,
  FileText
} from 'lucide-react';

import { Track, HeadphoneProfile } from './types';
import { DEFAULT_HEADPHONE_PROFILES } from './storage';
import { getDB } from './storage/db';

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

// STORES & HOOKS
import { useUIStore } from './stores/uiStore';
import { usePlayer } from './hooks/usePlayer';
import { useLibrary } from './hooks/useLibrary';
import { useEQ } from './hooks/useEQ';
import { mlService } from './services/MLService';

export default function App() {
  const isInitializing = useUIStore(state => state.isInitializing);
  const [activeTab, setActiveTab] = useState<'library' | 'settings'>('library');
  const [showLyrics, setShowLyrics] = useState(false);

  // HOOKS
  const player = usePlayer();
  const library = useLibrary();
  const eq = useEQ();

  // 1. DATABASE INITIALIZATION
  useEffect(() => {
    const startDb = async () => {
      try {
        const db = await getDB();

        // Load ML Model
        await mlService.loadModel();

        // Load settings preference (active headphone)
        const savedHpEntry = await db.get('user_preferences', 'selected_headphone_id');
        const savedHpId = savedHpEntry?.value;
        if (savedHpId) {
          const matched = DEFAULT_HEADPHONE_PROFILES.find((hp) => hp.id === (savedHpId as string));
          if (matched) eq.setActiveHeadphone(matched);
        }

        // Load playback settings preference
        const savedMoodEntry = await db.get('user_preferences', 'selected_playback_mood');
        const savedMood = savedMoodEntry?.value;
        if (savedMood) player.setPlaybackMood(savedMood as any);

        const savedShowLyricsEntry = await db.get('user_preferences', 'show_lyrics_panel');
        const savedShowLyrics = savedShowLyricsEntry?.value;
        if (savedShowLyrics !== undefined) setShowLyrics(savedShowLyrics as boolean);

        // Load tracks
        await library.loadLibrary();

      } catch (err) {
        console.error('Failed to initialize App data:', err);
      }
    };
    startDb();
  }, []);

  // 2. AUDIO SYNC (handled by AudioPlayerService mostly, but we sync volume/eq if needed)
  useEffect(() => {
    player.setVolume(player.volume);
  }, [player.volume]);

  useEffect(() => {
    eq.applyBands(eq.eqBands);
  }, [eq.eqBands]);

  // 3. ACTIONS
  const handleMoodChange = async (newMood: any) => {
    player.setPlaybackMood(newMood);
    const db = await getDB();
    await db.put('user_preferences', { key: 'selected_playback_mood', value: newMood });
  };

  const handleLyricsToggle = async () => {
    const nextVal = !showLyrics;
    setShowLyrics(nextVal);
    const db = await getDB();
    await db.put('user_preferences', { key: 'show_lyrics_panel', value: nextVal });
  };

  const handleClearAllData = async () => {
    const db = await getDB();
    await db.clear('tracks');
    await db.clear('eq_settings');
    await db.clear('feedback_log');
    window.location.reload();
  };

  const formatTimeStr = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeProgressPercent = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  if (isInitializing) {
    return <AppInitLoader />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#111] text-white overflow-hidden select-none font-sans">

      {/* Upper core deck */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar Menu */}
        <nav className="w-64 bg-zinc-900 border-r-3 border-black flex flex-col h-full z-15 select-none shrink-0">

          {/* Logo Header branding */}
          <div className="p-6 border-b-3 border-black flex items-center justify-between bg-accent">
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-black uppercase leading-none">
                SMART EQ
              </span>
              <span className="font-mono text-[9px] text-black font-bold tracking-[0.1em] uppercase mt-1">
                v2.0 CALIBRATOR
              </span>
            </div>
            <Radio className="w-6 h-6 text-black shrink-0 ml-1" />
          </div>

          {/* Navigation link blocks */}
          <div className="p-4 flex-grow space-y-3 overflow-y-auto custom-scrollbar">

            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-4 py-4 brutal-border font-black text-xs uppercase transition-all tracking-wider ${activeTab === 'library'
                  ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-accent/10'
                }`}
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-4 brutal-border font-black text-xs uppercase transition-all tracking-wider ${activeTab === 'settings'
                  ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-accent/10'
                }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={handleLyricsToggle}
              className={`w-full flex items-center justify-between px-4 py-4 brutal-border font-black text-xs uppercase transition-all tracking-wider ${showLyrics
                  ? 'bg-black text-accent shadow-[4px_4px_0px_0px_#C8FF00]'
                  : 'bg-white text-black hover:bg-accent/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>Lyrics</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 brutal-border ${showLyrics ? 'bg-accent text-black' : 'bg-black text-white'}`}>
                {showLyrics ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* PLAYBACK MOOD SECTOR PANEL */}
            <div className="pt-6 border-t-3 border-black space-y-3">
              <span className="font-black text-[10px] text-accent uppercase tracking-widest block px-1">SYSTEM MOOD</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tag: 'default', label: 'Default' },
                  { tag: 'chill', label: 'Chill' },
                  { tag: 'energetic', label: 'Energy' },
                  { tag: 'focus', label: 'Focus' },
                  { tag: 'melancholic', label: 'Dark' }
                ].map((item) => {
                  const isSelected = player.playbackMood === item.tag;
                  return (
                    <button
                      key={item.tag}
                      onClick={() => handleMoodChange(item.tag as any)}
                      className={`px-3 py-3 brutal-border text-center font-black text-[10px] uppercase transition-all truncate ${isSelected
                          ? 'bg-accent text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-accent/20'
                        }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HEADPHONE SELECTOR WIDGET */}
            <div className="pt-6 border-t-3 border-black">
              <span className="font-black text-[10px] text-accent uppercase tracking-widest block mb-3 px-1">HARDWARE PROFILE</span>
              <HeadphoneSelector
                activeProfileId={eq.activeHeadphone?.id || null}
                onSelectProfile={(hp) => eq.selectHeadphone(hp)}
              />
            </div>

          </div>

          {/* Diagnostic footprint footer */}
          <div className="p-4 border-t-3 border-black bg-black text-[10px] font-mono text-accent space-y-1">
            <p>DB: INDEXEDDB_V2</p>
            <p>ML: TFLITE_ENABLED</p>
            <p className="opacity-50">©2026 DEEPMIND</p>
          </div>

        </nav>

        {/* Center Main Work Space */}
        <main className="flex-1 flex h-full bg-zinc-950 relative overflow-hidden">
          <div className="grow flex h-full relative overflow-hidden">
            {/* Primary active sub-page column */}
            <div className={`flex-1 h-full flex flex-col ${showLyrics ? 'hidden md:flex' : 'flex'}`}>
              {activeTab === 'library' ? (
                <LibraryPage
                  tracks={library.tracks}
                  onAddTracks={(files) => library.addFiles(files)}
                  onPlayTrack={(track) => player.play(track)}
                  onDeleteTrack={(id) => library.removeTrack(id)}
                  activeTrackId={player.currentTrack?.id || null}
                  onUpdateTrack={(track) => library.updateTrack(track)}
                />
              ) : (
                <SettingsPage
                  activeProfile={eq.activeHeadphone}
                  onClearAllData={handleClearAllData}
                  feedbackLogs={[]} // TODO: Fetch from DB in SettingsPage
                  onRefreshData={async () => { }}
                />
              )}
            </div>

            {/* Karaoke interactive lyrics scrolling panel */}
            {showLyrics && (
              <div className="flex-1 md:max-w-md lg:max-w-lg xl:max-w-xl h-full border-l border-white/10 flex flex-col transition-all duration-300">
                <LyricsPanel
                  track={player.currentTrack}
                  currentTime={player.currentTime}
                  onSeek={(p) => player.seek((p / 100) * player.duration)}
                  onUpdateLyrics={(tid, lrc) => {
                    const matched = library.tracks.find(t => t.id === tid);
                    if (matched) library.updateTrack({ ...matched, lyrics: lrc });
                  }}
                  onClose={() => handleLyricsToggle()}
                />
              </div>
            )}
          </div>
        </main>

        {/* Right Slider Console */}
        <NowPlayingPanel
          track={player.currentTrack}
          isPlaying={player.isPlaying}
          activeHeadphone={eq.activeHeadphone}
          eqBands={eq.eqBands}
          onEQBandsChange={(b) => eq.applyBands(b)}
          onPrev={() => player.prev()}
          onNext={() => player.next()}
          onPlayToggle={() => player.toggle()}
          progressPercent={activeProgressPercent}
          onSeekChange={(p) => player.seek((p / 100) * player.duration)}
          currentTimeStr={formatTimeStr(player.currentTime)}
          durationTimeStr={formatTimeStr(player.duration)}
          volume={player.volume}
          onVolumeChange={(v) => player.setVolume(v)}
        />

      </div>

      {/* Floating Evaluator Pill Dialogue for Smart AI EQ parameters */}
      <EQFeedbackPill
        isVisible={eq.showFeedbackPill}
        onLike={() => { }} // TODO
        onDislike={() => { }} // TODO
        eqBands={eq.eqBands}
      />

      {/* Persistent Bottom Bar Deck */}
      <MiniPlayer
        track={player.currentTrack}
        isPlaying={player.isPlaying}
        onPlayToggle={() => player.toggle()}
        onPrev={() => player.prev()}
        onNext={() => player.next()}
        progressPercent={activeProgressPercent}
        onSeekChange={(p) => player.seek((p / 100) * player.duration)}
        currentTimeStr={formatTimeStr(player.currentTime)}
        durationTimeStr={formatTimeStr(player.duration)}
        volume={player.volume}
        onVolumeChange={(v) => player.setVolume(v)}
        isShuffle={player.isShuffle}
        onShuffleToggle={() => player.setShuffle(!player.isShuffle)}
        isRepeat={player.repeatMode === 'one'}
        onRepeatToggle={() => player.setRepeatMode(player.repeatMode === 'one' ? 'off' : 'one')}
        showLyrics={showLyrics}
        onLyricsToggle={handleLyricsToggle}
      />

    </div>
  );
}
