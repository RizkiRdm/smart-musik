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
    <div className="flex-grow flex flex-col h-full bg-[#050505] p-6 select-none overflow-hidden">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="font-serif italic text-2xl text-white flex items-center gap-2">
            <Library className="w-5 h-5 text-orange-500" />
            Track Collection
          </h2>
          <p className="font-sans text-xs text-white/40 mt-1">Local Indexed Database Library</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-4 py-2.5 font-sans text-xs font-bold uppercase transition-all duration-300 rounded-xl shadow-lg shadow-orange-500/15"
        >
          <Plus className="w-4 h-4" />
          Import Music
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
        <div className="relative mb-6 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matching title, artist, or genre..."
            className="w-full max-w-sm bg-white/5 border border-white/10 px-10 py-2.5 rounded-xl font-sans text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white font-sans text-[10px] font-bold"
            >
              CLEAR
            </button>
          )}
        </div>
      )}

      {/* Main Collection Container */}
      <div className="flex-1 min-h-[300px] flex flex-col overflow-hidden">
        {tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-white/10 bg-white/[0.01] rounded-2xl text-center min-h-[350px]">
            <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-4 text-white/30">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="font-serif italic text-lg text-white">No tracks loaded yet</h3>
            <p className="font-sans text-xs text-white/40 mt-1.5 max-w-[280px]">
              Import local audio files (such as MP3 or WAV) to start calibrating frequency compensation bands.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex items-center gap-2 bg-white/5 border border-white/10 hover:border-orange-500/50 text-white/80 hover:text-white px-5 py-2.5 font-sans text-xs font-bold uppercase transition-all rounded-xl duration-300"
            >
              <Plus className="w-4 h-4" />
              Add Audio Tracks
            </button>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-2xl">
            <Search className="w-8 h-8 text-white/20 mb-2" />
            <p className="font-sans text-white/40text-xs uppercase font-semibold">No matched tracks</p>
            <p className="text-white/30 text-xs mt-1">Refine your filtration keywords</p>
          </div>
        ) : (
          <div className="border border-white/10 bg-white/[0.01] rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/5 flex flex-col flex-1">
            {/* Table Header */}
            <div className="grid grid-cols-[48px_1fr_120px_88px] items-center px-4 py-3 bg-white/[0.03] border-b border-white/10 font-sans text-[10px] text-white/40 uppercase tracking-widest leading-none font-bold shrink-0">
              <span>#</span>
              <span>Track Details</span>
              <span>Duration / Genre</span>
              <span className="text-center">Action</span>
            </div>

            {/* Scrollable Tracks List */}
            <div className="divide-y divide-white/5 overflow-y-auto flex-1 custom-scrollbar">
              {filteredTracks.map((track, index) => {
                const isActive = track.id === activeTrackId;
                const isEditing = editingTrackId === track.id;
                
                return (
                  <React.Fragment key={track.id}>
                    <div
                      className={`grid grid-cols-[48px_1fr_120px_88px] items-center px-4 py-3 hover:bg-white/[0.04] hover:shadow-[inset_0_0_20px_rgba(249,115,22,0.02)] group transition-all duration-300 ease-out select-none ${
                        isActive ? 'bg-white/[0.05] border-l-4 border-orange-500 pl-3' : 'border-l-4 border-transparent hover:border-l-white/10'
                      }`}
                    >
                      {/* Index or Play icon on hover */}
                      <div 
                        onClick={() => onPlayTrack(track)}
                        className="font-mono text-[11px] text-white/30 cursor-pointer group-hover:text-orange-400"
                      >
                        <span className="group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
                        <Play className="hidden group-hover:block w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
                      </div>

                      {/* Meta and metadata names */}
                      <div 
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center gap-3 overflow-hidden cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                          <Music className={`w-4 h-4 ${isActive ? 'text-orange-400 animate-pulse' : 'text-white/30'}`} />
                        </div>
                        <div className="overflow-hidden pr-2">
                          <p className={`font-sans text-sm font-semibold truncate leading-tight ${isActive ? 'text-orange-400' : 'text-white/80'} group-hover:text-orange-400`}>
                            {track.title}
                          </p>
                          <p className="font-sans text-xs text-white/40 truncate mt-1">
                            {track.artist || 'Unknown Artist'} {track.album ? `// ${track.album}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Duration and Genre flag */}
                      <div className="flex flex-col gap-1 items-start justify-center">
                        <span className="font-mono text-xs tabular-nums text-white/40">
                          {formatDurationBySeconds(track.duration)}
                        </span>
                        {track.genre ? (
                          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-orange-400/80 border border-white/5 uppercase font-bold tracking-wider truncate max-w-[100px]">
                            {track.genre}
                          </span>
                        ) : (
                          <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest italic">
                            No genre
                          </span>
                        )}
                      </div>

                      {/* Utility controllers (Edit detail tag toggle, delete action) */}
                      <div className="flex items-center justify-center gap-1.5">
                        {/* TAG MODIFIER */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrackId(isEditing ? null : track.id);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isEditing 
                              ? 'border-orange-500/30 text-orange-400 bg-orange-500/5' 
                              : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                          }`}
                          title="Configure Track Mood & Genre"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrack(track.id);
                          }}
                          className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/5 border border-transparent transition-all"
                          title="Remove track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                    {/* Expandable in-playlist meta configuration form drawer */}
                    {isEditing && (
                      <div className="col-span-full bg-white/[0.01] border-t border-b border-white/10 px-6 py-4 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          {/* Left Option: Change Genre */}
                          <div className="flex-1 flex flex-col gap-1.5">
                            <span className="font-mono text-[9px] text-white/40 font-bold uppercase tracking-widest block">GENRE CLASSIFICATION</span>
                            <input
                              type="text"
                              value={track.genre || ''}
                              onChange={(e) => onUpdateTrack({ ...track, genre: e.target.value })}
                              placeholder="e.g. Synthwave, Lofi, Rock, Electronic, Piano, Cinematic"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/60"
                            />
                          </div>

                          {/* Right Option: Mood Assignment */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <span className="font-mono text-[9px] text-white/40 font-bold uppercase tracking-widest block">SONG MOOD</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {/* Pill selectors */}
                              {(['default', 'chill', 'energetic', 'focus', 'melancholic'] as const).map((moodOption) => {
                                const isMoodSelected = (track.moodTag || 'default') === moodOption;
                                return (
                                  <button
                                    key={moodOption}
                                    onClick={() => onUpdateTrack({ ...track, moodTag: moodOption })}
                                    className={`px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase border transition-all duration-300 ${
                                      isMoodSelected 
                                        ? 'bg-orange-500/15 border-orange-500/50 text-orange-400' 
                                        : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/20'
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] font-mono text-white/30 border-t border-white/5 pt-3 gap-2">
                          <span>STREAM TELEMETRY: {track.playCount || 0} PLAYS REGISTERED</span>
                          <span>LAST SESSION: {track.lastPlayedAt ? new Date(track.lastPlayedAt).toLocaleString() : 'NEVER STREAMED'}</span>
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
