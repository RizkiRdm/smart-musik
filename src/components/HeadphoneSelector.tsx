import { useState } from 'react';
import { Search, X, Sliders } from 'lucide-react';
import { HeadphoneProfile } from '../types';
import { DEFAULT_HEADPHONE_PROFILES } from '../storage';

interface HeadphoneSelectorProps {
  activeProfileId: string | null;
  onSelectProfile: (profile: HeadphoneProfile) => void;
}

export default function HeadphoneSelector({ activeProfileId, onSelectProfile }: HeadphoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHeadphones = DEFAULT_HEADPHONE_PROFILES.filter((hp) => {
    const term = searchQuery.toLowerCase();
    return (
      hp.name.toLowerCase().includes(term) ||
      hp.brand.toLowerCase().includes(term)
    );
  });

  const brands = Array.from(new Set(filteredHeadphones.map((hp) => hp.brand)));

  return (
    <div>
      {/* Selector Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between brutal-border bg-white px-4 py-3 text-black hover:bg-accent transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-black" />
          <span className="font-black text-[11px] uppercase tracking-tighter">
            {activeProfileId 
              ? `${DEFAULT_HEADPHONE_PROFILES.find(h => h.id === activeProfileId)?.name}` 
              : 'CHOOSE HARDWARE'}
          </span>
        </div>
        <span className="font-mono text-[9px] text-black font-black uppercase">CHANGE</span>
      </button>

      {/* Side Slide-in Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 transition-opacity" 
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md h-full bg-[#111] border-l-8 border-black flex flex-col z-10">
            
            {/* Header */}
            <div className="p-8 border-b-4 border-black bg-accent flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="font-black text-2xl text-black uppercase tracking-tighter leading-none">SELECT_HARDWARE</h2>
                  <p className="text-black/60 font-mono text-[10px] mt-1.5 font-bold uppercase tracking-widest">CALIBRATION_TARGET_V2</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center brutal-border bg-black text-accent hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Field */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH BRAND OR MODEL..."
                  className="w-full bg-white brutal-border px-12 py-4 font-black text-xs text-black placeholder:text-black/20 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
              </div>
            </div>

            {/* Profiles List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {brands.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center brutal-border border-dashed bg-white/5">
                  <Search className="w-10 h-10 text-white/20 mb-4" />
                  <p className="font-black text-xs text-white uppercase tracking-widest">NO_MATCH_FOUND</p>
                  <p className="font-mono text-[10px] text-white/30 mt-2 font-bold uppercase">REFINE_SIGNAL_QUERY</p>
                </div>
              ) : (
                brands.map((brandName) => {
                  const brandHeadphones = filteredHeadphones.filter(hp => hp.brand === brandName);
                  return (
                    <div key={brandName} className="brutal-border bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {/* Brand Label */}
                      <div className="bg-black px-4 py-2 border-b-2 border-black flex justify-between items-center">
                        <span className="font-black text-[10px] text-accent uppercase tracking-[0.2em]">{brandName}</span>
                        <span className="font-mono text-[9px] text-accent/50 font-black uppercase">{brandHeadphones.length} UNITS</span>
                      </div>

                      {/* Items */}
                      <div className="divide-y-2 divide-black/10">
                        {brandHeadphones.map((hp) => {
                          const isSelected = activeProfileId === hp.id;
                          return (
                            <div
                              key={hp.id}
                              onClick={() => {
                                onSelectProfile(hp);
                                setIsOpen(false);
                              }}
                              className={`px-4 py-4 flex justify-between items-center cursor-pointer transition-all hover:bg-accent/5 group ${
                                isSelected ? 'bg-accent/10 border-l-8 border-l-black' : 'border-l-8 border-l-transparent'
                              }`}
                            >
                              <div className="overflow-hidden pr-4">
                                <p className={`font-black text-sm uppercase tracking-tighter leading-none ${isSelected ? 'text-black' : 'text-black/80'}`}>
                                  {hp.name}
                                </p>
                                <p className="font-mono text-[9px] text-black/40 mt-1.5 font-black truncate">
                                  CORE: {hp.correctionCurve.map(n => (n > 0 ? `+${n}` : n)).join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center">
                                {isSelected ? (
                                  <div className="w-4 h-4 brutal-border bg-black shadow-[2px_2px_0px_0px_#C8FF00]" />
                                ) : (
                                  <span className="font-black text-[9px] text-black/40 group-hover:text-black transition-colors uppercase">SELECT</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-8 border-t-4 border-black bg-black">
              <button
                onClick={() => setIsOpen(false)}
                className="brutal-button-secondary w-full py-4 text-xs font-black uppercase tracking-widest"
              >
                CLOSE_CONSOLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
