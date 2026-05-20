import { useState } from 'react';
import { Settings, RefreshCw, Trash2, Sliders, ThumbsUp, ThumbsDown, Info, Shield } from 'lucide-react';
import { HeadphoneProfile, FeedbackLog } from '../types';

interface SettingsPageProps {
  activeProfile: HeadphoneProfile | null;
  onClearAllData: () => void;
  feedbackLogs: FeedbackLog[];
  onRefreshData: () => void;
}

export default function SettingsPage({
  activeProfile,
  onClearAllData,
  feedbackLogs,
  onRefreshData
}: SettingsPageProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // Compute stats
  const totalFeedback = feedbackLogs.length;
  const likes = feedbackLogs.filter(f => f.signal === 'like').length;
  const dislikes = feedbackLogs.filter(f => f.signal === 'dislike').length;
  const matchRate = totalFeedback > 0 ? ((likes / totalFeedback) * 100).toFixed(0) : '100';

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#050505] p-6 select-none overflow-y-auto custom-scrollbar">
      
      {/* Title */}
      <div className="mb-6 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="font-serif italic text-2xl text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Calibration Center
          </h2>
          <p className="font-sans text-xs text-white/40 mt-1">Configure ML audio model presets and diagnostic metrics</p>
        </div>

        <button
          onClick={onRefreshData}
          className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-orange-400 hover:border-orange-500/50 transition-all duration-300 bg-white/5 shadow-lg shadow-black/40"
          title="Force update logs cache"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: System Information & Calibrations */}
        <div className="space-y-6">
          {/* Active profile card */}
          <div className="border border-white/10 bg-white/[0.01] p-5 rounded-2xl relative shadow-2xl shadow-orange-500/5">
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#050505] px-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono text-[10px] text-orange-400 font-bold uppercase tracking-wider">ACTIVE PROFILE</span>
            </div>

            {activeProfile ? (
              <div className="mt-2 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-xs text-white/40 uppercase font-semibold">Hardware Target</span>
                  <span className="font-sans text-sm text-orange-400 font-bold uppercase">{activeProfile.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-xs text-white/40 uppercase font-semibold">Product Name</span>
                  <span className="font-sans text-sm text-white font-bold">{activeProfile.name}</span>
                </div>
                
                {/* Visual grid curve */}
                <div className="border border-white/5 rounded-xl p-3.5 bg-white/[0.02]">
                  <p className="font-mono text-[9px] text-white/30 uppercase font-bold tracking-wider mb-2">RAW COMPENSATION COEFFICIENTS (AUTOEQ)</p>
                  <div className="flex justify-between items-end h-16 pt-2 select-none">
                    {activeProfile.correctionCurve.map((coeff, index) => {
                      // Normalize coefficient height for UI display [-12, +12]
                      const heightPercent = Math.max(10, Math.min(100, ((coeff + 12) / 24) * 100));
                      const isPositive = coeff >= 0;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1" title={`Band ${index + 1}: ${coeff}dB`}>
                          <div className="h-full w-2 bg-white/10 rounded-full flex items-end relative overflow-hidden">
                            <div 
                              className={`w-full ${isPositive ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-red-500/80'}`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[8px] text-white/30 mt-1">{coeff > 0 ? `+${coeff}` : coeff}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center mt-2 flex flex-col items-center">
                <Sliders className="w-8 h-8 text-white/10 mb-2 animate-pulse" />
                <p className="font-sans text-xs text-white/40 uppercase font-bold">NO HARDWARE PROFILE COMMITTED</p>
                <p className="font-sans text-[11px] text-white/30 mt-1 max-w-[240px]">Go to the dashboard or search sidebars to select a correction preset.</p>
              </div>
            )}
          </div>

          {/* Model Statistics Metrics board */}
          <div className="border border-white/10 bg-white/[0.01] p-5 rounded-2xl relative shadow-2xl shadow-orange-500/5">
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#050505] px-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono text-[10px] text-orange-400 font-bold uppercase tracking-wider">NEURAL MODEL STATISTICS</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/5 p-3.5 border border-white/5 rounded-xl">
                <span className="font-sans text-[10px] text-white/40 font-semibold uppercase block">Total Feedbacks</span>
                <span className="font-mono text-2xl font-extrabold text-white mt-1 block tabular-nums">{totalFeedback}</span>
              </div>
              <div className="bg-white/5 p-3.5 border border-white/5 rounded-xl">
                <span className="font-sans text-[10px] text-white/40 font-semibold uppercase block">Satisfaction Model Rate</span>
                <span className="font-mono text-2xl font-extrabold text-orange-400 mt-1 block tabular-nums">{matchRate}%</span>
              </div>
              <div className="bg-white/5 p-3 border border-white/5 rounded-xl flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="font-sans text-[9px] text-white/40 font-semibold uppercase block">Likes</span>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">{likes}</span>
                </div>
              </div>
              <div className="bg-white/5 p-3 border border-white/5 rounded-xl flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-500/70" />
                <div>
                  <span className="font-sans text-[9px] text-white/40 font-semibold uppercase block">Dislikes</span>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">{dislikes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purge Module */}
          <div className="border border-red-500/20 bg-red-950/5 p-5 rounded-2xl relative">
            <h3 className="font-sans text-xs font-bold text-red-400 uppercase tracking-wide">Danger Zone Calibration Purge</h3>
            <p className="font-sans text-xs text-white/40 mt-1.5 leading-relaxed">
              Clears all cached local files, reset user preferences, saved reinforcement feedback logs, and active EQ settings.
            </p>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="mt-4 flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black hover:border-transparent px-4 py-2.5 border border-red-500/20 rounded-xl font-sans text-xs uppercase transition-all duration-300 font-bold active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hard Reset System
              </button>
            ) : (
              <div className="mt-4 border border-red-500/35 p-3.5 rounded-xl bg-black/80 space-y-3">
                <p className="font-mono text-[10px] text-red-400 uppercase font-bold">⚠️ Warning: This delete action is irreversible.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowConfirm(false);
                    }}
                    className="bg-red-600 hover:bg-red-500 hover:text-black rounded-xl text-white font-sans text-[10px] px-3.5 py-2 uppercase font-bold transition-colors"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="bg-white/5 text-white/60 hover:text-white rounded-xl font-sans text-[10px] px-3.5 py-2 uppercase border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: RL Feedback Diagnostic Logs */}
        <div className="border border-white/10 bg-white/[0.01] p-5 rounded-2xl relative shadow-2xl shadow-orange-500/5 h-full flex flex-col">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#050505] px-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-mono text-[10px] text-orange-400 font-bold uppercase tracking-wider">FEEDBACK DIAGNOSTICS LOG</span>
          </div>

          <p className="font-sans text-xs text-white/40 mt-2 mb-4 leading-relaxed">
            Every user action on the AI recommendation generates a feedback tuple recorded locally to adjust reinforcement learning weights.
          </p>

          <div className="flex-1 max-h-[420px] overflow-y-auto custom-scrollbar border border-white/10 rounded-xl bg-black/40">
            {feedbackLogs.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center">
                <Info className="w-6 h-6 text-white/10 mb-2" />
                <span className="font-sans text-[10px] text-white/40 uppercase font-semibold">LOG RECORD IS ENTIRELY EMPTY</span>
                <p className="text-[9px] text-white/30 font-sans mt-1 max-w-[200px]">Perform Like or Dislike judgments during audio stream to register telemetry.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {feedbackLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-white/[0.005] hover:bg-white/[0.02] flex items-start justify-between gap-3 text-xs transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[9px] text-orange-400 font-semibold uppercase">HP: {log.headphoneId}</span>
                      </div>
                      <p className="text-[10px] text-white/40 font-mono">
                        Time: {formatTime(log.createdAt)}
                      </p>
                      <p className="text-[10px] text-white/40 font-mono">
                        Listen time: {((log.listenDurationMs || 0) / 1000).toFixed(1)}s // Gen {log.generation}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {log.signal === 'like' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400 font-mono text-[9px] font-bold uppercase">
                          <ThumbsUp className="w-2.5 h-2.5" />
                          LIKE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 font-mono text-[9px] font-bold uppercase">
                          <ThumbsDown className="w-2.5 h-2.5" />
                          ADJUST
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
