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

  // Goup of brands
  const brands = Array.from(new Set(filteredHeadphones.map((hp) => hp.brand)));

  return (
    <div>
      {/* Selector Launcher Button */}
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        className="w-full flex items-center justify-between bg-white/[0.03] border border-white/15 px-4 py-3 rounded-xl font-sans text-xs text-white/80 hover:border-orange-500/60 hover:text-white transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-500" />
          <span className="uppercase tracking-wider font-semibold">
            {activeProfileId 
              ? `${DEFAULT_HEADPHONE_PROFILES.find(h => h.id === activeProfileId)?.name}` 
              : 'CHOOSE HARDWARE'}
          </span>
        </div>
        <span className="text-[10px] text-white/40 tracking-wider">CHANGE ↵</span>
      </button>

      {/* Side Slide-in Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.8)]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="font-serif italic text-xl text-white">Select Profile</h2>
                  <p className="text-white/40 font-sans text-xs mt-1">Calibrate target autoEQ compensation curves</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 text-white/60 hover:text-orange-400 hover:border-orange-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Field */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search headphones (e.g. Sony, Sennheiser...)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 font-sans text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Profiles List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {brands.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
                  <Search className="w-8 h-8 text-white/20 mb-2" />
                  <p className="font-mono text-white/40 text-xs uppercase">No profiles matched</p>
                  <p className="text-white/30 text-xs mt-1">Try other key queries</p>
                </div>
              ) : (
                brands.map((brandName) => {
                  const brandHeadphones = filteredHeadphones.filter(hp => hp.brand === brandName);
                  return (
                    <div key={brandName} className="border border-white/5 bg-white/[0.01] rounded-xl overflow-hidden mb-3">
                      {/* Brand Label */}
                      <div className="bg-white/[0.03] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                        <span className="font-sans text-[10px] text-orange-400 font-bold uppercase tracking-widest">{brandName}</span>
                        <span className="text-[9px] text-white/40 font-mono">{brandHeadphones.length} MODELS</span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-white/5">
                        {brandHeadphones.map((hp) => {
                          const isSelected = activeProfileId === hp.id;
                          return (
                            <div
                              key={hp.id}
                              onClick={() => {
                                onSelectProfile(hp);
                                setIsOpen(false);
                              }}
                              className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-all hover:bg-white/[0.04] group ${
                                isSelected ? 'border-l-4 border-orange-500 bg-white/[0.03]' : ''
                              }`}
                            >
                              <div className="overflow-hidden pr-2">
                                <p className={`font-sans text-sm leading-none font-semibold ${isSelected ? 'text-orange-400' : 'text-white/80'} group-hover:text-orange-400`}>
                                  {hp.name}
                                </p>
                                <p className="text-white/40 text-xs mt-1.5 truncate font-mono">
                                  Curve: {hp.correctionCurve.map(n => (n > 0 ? `+${n}` : n)).join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center">
                                {isSelected ? (
                                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                                ) : (
                                  <span className="text-[10px] font-sans text-orange-400/80 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">SELECT</span>
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
            <div className="p-4 border-t border-white/10 bg-black/40">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-white/[0.03] border border-white/10 hover:border-orange-500/50 hover:bg-white/[0.08] text-white/80 hover:text-white rounded-xl font-sans text-xs uppercase tracking-wider py-3 text-center transition-all duration-300"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
