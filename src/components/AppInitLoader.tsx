import { useUIStore } from '../stores/uiStore';

export function AppInitLoader() {
  const { initProgress, initStatus } = useUIStore();

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] z-[100] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-mono text-3xl font-bold text-[#C8FF00] tracking-tighter uppercase italic">
            Smart EQ Player
          </h1>
          <p className="font-mono text-xs text-[#888888] mt-2 uppercase tracking-widest">
            Initializing v2 Architecture
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end font-mono text-[10px] text-[#F5F5F5] uppercase">
            <span>{initStatus}</span>
            <span>{Math.round(initProgress)}%</span>
          </div>

          <div className="h-4 w-full bg-[#1C1C1C] border-2 border-[#2E2E2E]">
            <div 
              className="h-full bg-[#C8FF00] transition-all duration-300 ease-out"
              style={{ width: `${initProgress}%` }}
            />
          </div>
        </div>

        <div className="pt-8 border-t border-[#2E2E2E] flex justify-between items-center font-mono text-[9px] text-[#555555]">
          <span>DB: INDEXEDDB_V1</span>
          <span>ML: TFLITE_WASM</span>
        </div>
      </div>
    </div>
  );
}
