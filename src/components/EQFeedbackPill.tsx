import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface EQFeedbackPillProps {
  isVisible: boolean;
  onLike: () => void;
  onDislike: () => void;
  eqBands: number[];
}

export default function EQFeedbackPill({ isVisible, onLike, onDislike, eqBands }: EQFeedbackPillProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: 100, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="fixed bottom-[112px] left-1/2 z-30 transform -translate-x-1/2 select-none"
        >
          {/* Main Pill Box */}
          <div className="bg-accent brutal-border p-6 flex flex-col md:flex-row items-center gap-6 min-w-[400px] md:min-w-[500px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            
            {/* Left AI indicators */}
            <div className="flex flex-col gap-1 items-start shrink-0">
              <span className="flex items-center gap-2 font-black text-xs text-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-black fill-current" />
                AI RECOMMENDATION
              </span>
              <span className="text-[10px] text-black/60 font-mono font-bold uppercase">Evaluate predictive curve</span>
            </div>

            {/* Middle: mini static EQ visualization bars */}
            <div className="flex h-12 items-end gap-[4px] bg-black px-3 py-2 brutal-border w-32 justify-between overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {eqBands.map((band, idx) => {
                const heightPercent = Math.max(15, Math.min(100, ((band + 12) / 24) * 100));
                return (
                  <div
                    key={idx}
                    className="w-1.5 bg-accent transition-all duration-300"
                    style={{
                      height: `${heightPercent}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              {/* DISLIKE */}
              <button
                onClick={onDislike}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 brutal-border bg-white text-black font-black text-[11px] uppercase cursor-pointer hover:bg-zinc-100 transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>ADJUST</span>
              </button>

              {/* LIKE */}
              <button
                onClick={onLike}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 brutal-border bg-black text-accent font-black text-[11px] uppercase cursor-pointer hover:bg-zinc-900 transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>SAVE</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
