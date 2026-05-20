import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface EQFeedbackPillProps {
  isVisible: boolean;
  onLike: () => void;
  onDislike: () => void;
  eqBands: number[];
}

export default function EQFeedbackPill({ isVisible, onLike, onDislike, eqBands }: EQFeedbackPillProps) {
  const bandColors = [
    '#f97316', // 60Hz - orange-500
    '#ea580c', // 150Hz
    '#f97316', // 400Hz
    '#f59e0b', // 1kHz - amber-500
    '#d97706', // 2.5kHz
    '#f59e0b', // 4kHz
    '#fb923c', // 6.3kHz - orange-400
    '#f59e0b', // 10kHz
    '#ea580c', // 14kHz
    '#f97316', // 16kHz
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: 80, x: '-50%', opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-[96px] left-1/2 z-30 transform -translate-x-1/2 select-none"
        >
          {/* Main Pill Box */}
          <div className="bg-[#0e0e0e]/95 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 min-w-[360px] md:min-w-[420px] shadow-2xl shadow-orange-500/10 backdrop-blur-md">
            
            {/* Left AI indicators */}
            <div className="flex flex-col gap-1 items-start shrink-0 mr-1">
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
                AI RECOMMENDER
              </span>
              <span className="text-[9px] text-white/40 font-sans tracking-tight">Evaluate current predictive EQ curve</span>
            </div>

            {/* Middle: mini static EQ visualization bars */}
            <div className="flex h-8 items-end gap-[3px] bg-white/5 px-2 py-1.5 border border-white/10 rounded-xl w-24 justify-between overflow-hidden">
              {eqBands.map((band, idx) => {
                // Height ratio from -12dB (0%) to +12dB (100%)
                const heightPercent = Math.max(15, Math.min(100, ((band + 12) / 24) * 100));
                return (
                  <div
                    key={idx}
                    className="w-1 rounded-t-full transition-all duration-300"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: bandColors[idx]
                    }}
                  />
                );
              })}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
              {/* DISLIKE */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onDislike}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-red-500/50 text-white/60 hover:text-red-400 hover:bg-red-500/5 font-sans text-[10px] font-bold uppercase cursor-pointer transition-colors duration-200"
                title="Slightly adjust EQ curve with RL perturbation algorithms"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Adjust</span>
              </motion.button>

              {/* LIKE */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onLike}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl border border-orange-500/30 text-orange-400 hover:text-white hover:bg-orange-500/10 font-sans text-[10px] font-bold uppercase cursor-pointer transition-colors duration-200"
                title="Looks good! Set this as my local target profile"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Save</span>
              </motion.button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
