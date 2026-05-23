import { useUIStore } from '../stores/uiStore';

export function AppInitLoader() {
  const { initProgress, initStatus } = useUIStore();

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg bg-white brutal-border p-12 shadow-[12px_12px_0px_0px_#C8FF00]">
        <div className="text-center mb-10">
          <h1 className="font-black text-4xl text-black tracking-tighter uppercase leading-none">
            SMART_EQ_v2
          </h1>
          <p className="font-mono text-xs text-black/40 mt-3 font-black uppercase tracking-[0.2em]">
            INITIALIZING_NEURAL_MATRIX
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end font-mono text-[11px] text-black font-black uppercase tracking-widest">
            <span>{initStatus}</span>
            <span className="bg-black text-accent px-2 py-0.5">{Math.round(initProgress)}%</span>
          </div>

          <div className="h-8 w-full brutal-border bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div 
              className="h-full bg-accent border-r-4 border-black transition-all duration-300 ease-out"
              style={{ width: `${initProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-4 border-black flex justify-between items-center font-mono text-[10px] text-black/30 font-black uppercase">
          <span>INDEXEDDB_V2_STORAGE</span>
          <span>TFLITE_CORE_ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
