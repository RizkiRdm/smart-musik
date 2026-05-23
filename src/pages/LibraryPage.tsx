import React, { useRef, useState } from 'react';
import { Music, Plus, Search, Trash2, Library, Play, Tag } from 'lucide-react';
import { Track } from '../types';

interface LibraryPageProps {
  tracks: Track[];
  onAddTracks: (files: File[]) => void;
  onPlayTrack: (track: Track) => void;
  onDeleteTrack: (trackId: string) => void;
  activeTrackId: string | null;
  onUpdateTrack: (track: Track) => void;
}

export default function LibraryPage({
  tracks,
  onAddTracks,
  onPlayTrack,
  onDeleteTrack,
  activeTrackId,
  onUpdateTrack
}: LibraryPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  const filteredTracks = tracks.filter((track) => {
    const term = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(term) ||
      (track.artist && track.artist.toLowerCase().includes(term)) ||
      (track.album && track.album.toLowerCase().includes(term)) ||
      (track.genre && track.genre.toLowerCase().includes(term))
    );
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddTracks(Array.from(e.target.files));
    }
  };

  const formatDurationBySeconds = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#111] p-8 select-none overflow-hidden">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 shrink-0">
        <div className="bg-white brutal-border p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-black text-2xl text-black flex items-center gap-3 uppercase tracking-tighter">
            <Library className="w-6 h-6 text-black" />
            Collection
          </h2>
          <p className="font-mono text-[10px] text-black/50 mt-1 font-bold uppercase tracking-widest">LOCAL_SIGNAL_DATABASE</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="brutal-button px-6 py-4 text-sm flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          IMPORT DATA
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="audio/*"
          className="hidden"
        />
      </div>

      {/* Search Input Filter */}
      {tracks.length > 0 && (
        <div className="relative mb-8 shrink-0 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER BY TITLE, ARTIST, GENRE..."
            className="w-full bg-white brutal-border px-12 py-4 font-black text-xs text-black placeholder:text-black/30 focus:outline-none focus:shadow-[4px_4px_0px_0px_#C8FF00] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black font-black text-[10px] hover:text-accent transition-colors"
            >
              CLEAR
            </button>
          )}
        </div>
      )}

      {/* Main Collection Container */}
      <div className="flex-1 min-h-[300px] flex flex-col overflow-hidden">
        {tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 brutal-border border-dashed bg-white/5 text-center min-h-[350px]">
            <div className="w-20 h-20 brutal-border bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6 text-black/20">
              <Music className="w-10 h-10" />
            </div>
            <h3 className="font-black text-xl text-white uppercase tracking-tighter">LIBRARY_EMPTY</h3>
            <p className="font-mono text-xs text-white/40 mt-3 max-w-[320px] font-bold">
              NO LOCAL SIGNALS DETECTED. IMPORT AUDIO FILES TO BEGIN CALIBRATION.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 brutal-button-secondary flex items-center gap-3 px-6"
            >
              <Plus className="w-5 h-5" />
              UPLOAD TRACKS
            </button>
          </div>
        ) : (
          <div className="bg-white brutal-border overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col flex-1">
            {/* Table Header */}
            <div className="grid grid-cols-[60px_1fr_140px_100px] items-center px-6 py-4 bg-black border-b-4 border-black font-black text-[11px] text-accent uppercase tracking-[0.2em] shrink-0">
              <span>IDX</span>
              <span>DATA_STREAM</span>
              <span>METRICS</span>
              <span className="text-center">OPS</span>
            </div>

            {/* Scrollable Tracks List */}
            <div className="overflow-y-auto flex-1 custom-scrollbar bg-zinc-50">
              {filteredTracks.map((track, index) => {
                const isActive = track.id === activeTrackId;
                const isEditing = editingTrackId === track.id;
                
                return (
                  <React.Fragment key={track.id}>
                    <div
                      className={`grid grid-cols-[60px_1fr_140px_100px] items-center px-6 py-5 border-b-2 border-black/10 hover:bg-accent/5 transition-all group select-none ${
                        isActive ? 'bg-accent/10 border-l-8 border-l-black' : 'border-l-8 border-l-transparent'
                      }`}
                    >
                      {/* Index or Play icon on hover */}
                      <div 
                        onClick={() => onPlayTrack(track)}
                        className="font-mono text-xs text-black font-black cursor-pointer"
                      >
                        <span className="group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
                        <Play className="hidden group-hover:block w-4 h-4 text-black fill-current" />
                      </div>

                      {/* Meta and metadata names */}
                      <div 
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center gap-4 overflow-hidden cursor-pointer"
                      >
                        <div className={`w-11 h-11 brutal-border flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isActive ? 'bg-accent' : 'bg-white'}`}>
                          <Music className={`w-5 h-5 text-black ${isActive ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="overflow-hidden pr-4">
                          <p className={`font-black text-sm truncate uppercase tracking-tighter leading-none ${isActive ? 'text-black' : 'text-black/80'}`}>
                            {track.title}
                          </p>
                          <p className="font-mono text-[10px] text-black/50 truncate mt-1.5 font-bold uppercase">
                            {track.artist || 'UNKNOWN'} {track.album ? `// ${track.album}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Duration and Genre flag */}
                      <div className="flex flex-col gap-1.5 items-start justify-center">
                        <span className="font-mono text-[11px] tabular-nums text-black font-black">
                          {formatDurationBySeconds(track.duration)}
                        </span>
                        {track.genre ? (
                          <span className="font-mono text-[9px] px-2 py-0.5 brutal-border bg-black text-accent uppercase font-black tracking-wider truncate max-w-[120px]">
                            {track.genre}
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] text-black/30 uppercase font-bold italic">
                            NULL_GENRE
                          </span>
                        )}
                      </div>

                      {/* Utility controllers */}
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrackId(isEditing ? null : track.id);
                          }}
                          className={`p-2 brutal-border transition-all ${
                            isEditing 
                              ? 'bg-black text-accent shadow-[2px_2px_0px_0px_#C8FF00]' 
                              : 'bg-white text-black hover:bg-accent'
                          }`}
                        >
                          <Tag className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrack(track.id);
                          }}
                          className="p-2 brutal-border bg-white text-black hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Expandable Meta Config */}
                    {isEditing && (
                      <div className="col-span-full bg-accent/5 border-b-4 border-black p-8 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-8">
                          
                          {/* Left Option: Change Genre */}
                          <div className="flex-1 flex flex-col gap-3">
                            <span className="font-black text-[10px] text-black uppercase tracking-widest block">GENRE_CLASSIFICATION</span>
                            <input
                              type="text"
                              value={track.genre || ''}
                              onChange={(e) => onUpdateTrack({ ...track, genre: e.target.value })}
                              placeholder="E.G. TECHNO, AMBIENT, METAL..."
                              className="w-full bg-white brutal-border px-4 py-3 font-black text-xs text-black placeholder:text-black/20 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                            />
                          </div>

                          {/* Right Option: Mood Assignment */}
                          <div className="flex flex-col gap-3 shrink-0">
                            <span className="font-black text-[10px] text-black uppercase tracking-widest block">SONG_MOOD</span>
                            <div className="flex gap-2 flex-wrap">
                              {(['default', 'chill', 'energetic', 'focus', 'melancholic'] as const).map((moodOption) => {
                                const isMoodSelected = (track.moodTag || 'default') === moodOption;
                                return (
                                  <button
                                    key={moodOption}
                                    onClick={() => onUpdateTrack({ ...track, moodTag: moodOption })}
                                    className={`px-4 py-2 brutal-border font-black text-[10px] uppercase transition-all ${
                                      isMoodSelected 
                                        ? 'bg-black text-accent shadow-[3px_3px_0px_0px_#C8FF00]' 
                                        : 'bg-white text-black hover:bg-accent'
                                    }`}
                                  >
                                    {moodOption}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Stats diagnostics */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono font-black text-black/40 border-t-2 border-black/10 pt-4 gap-2">
                          <span>STREAM_TELEMETRY: {track.playCount || 0} PLAYS</span>
                          <span>LAST_SESSION: {track.lastPlayedAt ? new Date(track.lastPlayedAt).toLocaleString().toUpperCase() : 'NEVER_STREAMED'}</span>
                        </div>

                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
