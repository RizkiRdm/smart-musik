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
    return new Date(ts).toLocaleString().toUpperCase();
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#111] p-8 select-none overflow-y-auto custom-scrollbar">
      
      {/* Title */}
      <div className="mb-8 shrink-0 flex justify-between items-center">
        <div className="bg-white brutal-border p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-black text-2xl text-black flex items-center gap-3 uppercase tracking-tighter">
            <Settings className="w-6 h-6 text-black" />
            Control_Panel
          </h2>
          <p className="font-mono text-[10px] text-black/50 mt-1 font-bold uppercase tracking-widest">SYSTEM_DIAGNOSTICS_V2</p>
        </div>

        <button
          onClick={onRefreshData}
          className="brutal-button-secondary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          title="REFRESH_CACHE"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: System Information & Calibrations */}
        <div className="space-y-8">
          {/* Active profile card */}
          <div className="bg-white brutal-border p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-black" />
              <span className="font-black text-xs text-black uppercase tracking-widest">ACTIVE_HARDWARE_TARGET</span>
            </div>

            {activeProfile ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-2 border-black/5 pb-2">
                  <span className="font-black text-[10px] text-black/40 uppercase tracking-widest">BRAND</span>
                  <span className="font-black text-sm text-black uppercase">{activeProfile.brand}</span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-black/5 pb-2">
                  <span className="font-black text-[10px] text-black/40 uppercase tracking-widest">MODEL</span>
                  <span className="font-black text-sm text-black uppercase">{activeProfile.name}</span>
                </div>
                
                {/* Visual grid curve */}
                <div className="brutal-border bg-black p-4 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-black text-[9px] text-accent uppercase tracking-[0.2em] mb-4">COMPENSATION_MATRIX</p>
                  <div className="flex justify-between items-end h-20 select-none">
                    {activeProfile.correctionCurve.map((coeff, index) => {
                      const heightPercent = Math.max(10, Math.min(100, ((coeff + 12) / 24) * 100));
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className="h-full w-2.5 bg-accent/20 flex items-end relative border-x border-black/20">
                            <div 
                              className="w-full bg-accent border-t border-black shadow-[0_0_10px_rgba(200,255,0,0.3)]"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[8px] text-accent font-black mt-2">{coeff > 0 ? `+${coeff}` : coeff}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center brutal-border border-dashed bg-zinc-50 flex flex-col items-center">
                <Sliders className="w-10 h-10 text-black/10 mb-4" />
                <p className="font-black text-[11px] text-black/30 uppercase tracking-widest">NO_PROFILE_LOADED</p>
              </div>
            )}
          </div>

          {/* Model Statistics Metrics board */}
          <div className="bg-white brutal-border p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-black" />
              <span className="font-black text-xs text-black uppercase tracking-widest">ML_CORE_METRICS</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-100 brutal-border p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black text-[9px] text-black/40 uppercase tracking-widest block">TOTAL_FEEDBACK</span>
                <span className="font-black text-3xl text-black mt-2 block tabular-nums">{totalFeedback}</span>
              </div>
              <div className="bg-accent brutal-border p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black text-[9px] text-black/40 uppercase tracking-widest block">SATISFACTION_RATE</span>
                <span className="font-black text-3xl text-black mt-2 block tabular-nums">{matchRate}%</span>
              </div>
              <div className="bg-white brutal-border p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                <ThumbsUp className="w-6 h-6 text-black" />
                <div>
                  <span className="font-black text-[9px] text-black/40 uppercase tracking-widest block">LIKES</span>
                  <span className="font-black text-xl text-black tabular-nums">{likes}</span>
                </div>
              </div>
              <div className="bg-white brutal-border p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                <ThumbsDown className="w-6 h-6 text-black" />
                <div>
                  <span className="font-black text-[9px] text-black/40 uppercase tracking-widest block">ADJUSTS</span>
                  <span className="font-black text-xl text-black tabular-nums">{dislikes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purge Module */}
          <div className="bg-red-500 brutal-border p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-sm text-black uppercase tracking-widest">DANGER_ZONE</h3>
            <p className="font-black text-[10px] text-black/60 mt-2 leading-relaxed uppercase">
              WIPE ALL DATA: TRACKS, PRESETS, LOGS, AND AI WEIGHTS. ACTION_IRREVERSIBLE.
            </p>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="mt-6 brutal-button-secondary bg-white w-full py-4 text-xs"
              >
                HARD_SYSTEM_RESET
              </button>
            ) : (
              <div className="mt-6 brutal-border bg-black p-5 space-y-4 shadow-[4px_4px_0px_0px_#C8FF00]">
                <p className="font-black text-[11px] text-accent uppercase leading-tight">PERMANENT_DELETION_CONFIRMATION_REQUIRED</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowConfirm(false);
                    }}
                    className="brutal-button bg-red-600 hover:bg-red-700 text-white flex-1 py-3"
                  >
                    CONFIRM_WIPE
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="brutal-button-secondary bg-white flex-1 py-3"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: RL Feedback Diagnostic Logs */}
        <div className="bg-white brutal-border p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-[600px]">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-6 h-6 text-black" />
            <span className="font-black text-xs text-black uppercase tracking-widest">FEEDBACK_TELEMETRY_LOG</span>
          </div>

          <p className="font-mono text-[11px] text-black/50 font-black mb-6 uppercase leading-relaxed">
            REAL-TIME REINFORCEMENT LEARNING LOGS RECORDED FROM USER_JUDGMENTS.
          </p>

          <div className="flex-1 overflow-y-auto custom-scrollbar brutal-border bg-zinc-50">
            {feedbackLogs.length === 0 ? (
              <div className="py-40 text-center flex flex-col items-center justify-center p-8">
                <Info className="w-12 h-12 text-black/10 mb-6" />
                <span className="font-black text-xs text-black/30 uppercase tracking-[0.2em]">LOG_STREAM_EMPTY</span>
                <p className="font-mono text-[10px] text-black/20 mt-3 font-black uppercase">AWAITING_USER_SIGNAL</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10">
                {feedbackLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-accent/5 flex items-start justify-between gap-4 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[10px] bg-black text-accent px-2 py-0.5 uppercase tracking-widest">HP_ID: {log.headphoneId}</span>
                      </div>
                      <p className="text-[10px] text-black/40 font-black uppercase font-mono">
                        TS: {formatTime(log.createdAt)}
                      </p>
                      <p className="text-[10px] text-black/40 font-black uppercase font-mono">
                        DURATION: {((log.listenDurationMs || 0) / 1000).toFixed(1)}S // GEN: {log.generation}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {log.signal === 'like' ? (
                        <span className="brutal-border bg-accent px-3 py-1.5 font-black text-[10px] text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          LIKE
                        </span>
                      ) : (
                        <span className="brutal-border bg-black px-3 py-1.5 font-black text-[10px] text-accent uppercase shadow-[2px_2px_0px_0px_#C8FF00] flex items-center gap-2">
                          <ThumbsDown className="w-3.5 h-3.5" />
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
