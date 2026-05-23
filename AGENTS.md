# AGENTS_WEB.md — Smart EQ Player (Web Version)
**Document Type:** AI Agent Operational Contract
**Stack Version:** 2.0.0 (Vite + React 19, NOT Next.js)
**Applies To:** ALL AI coding agents working on the web version

---

## WHO YOU ARE

You are implementing **Smart EQ Player Web** — a browser-based, fully offline music player.
- Zero backend. No API routes. No server. No network calls after first asset load.
- All ML inference runs in-browser via TFLite WASM.
- Model cached in IndexedDB after first fetch — never re-downloaded.
- Built with React 19 + Vite 6, NOT Next.js.

---

## CRITICAL STACK (EXACT VERSIONS — NO DEVIATION)

```
react:                  19.x
react-dom:              19.x
typescript:             5.x
vite:                   6.x
tailwindcss:            4.x
@tailwindcss/vite:      4.x
framer-motion:          12.x
zustand:                5.x
idb:                    8.x
sql.js:                 1.12.x
@tensorflow/tfjs:       4.x
@tensorflow/tfjs-tflite: latest
essentia.js:            0.1.3+
music-metadata-browser: 6.x
lucide-react:           latest
clsx:                   2.x
class-variance-authority: 0.7.x
eslint:                 9.x (flat config)
vitest:                 3.x
@vitest/coverage-v8:    3.x
@testing-library/react: 16.x
@fontsource/inter:      latest
@fontsource/jetbrains-mono: latest
```

**Before installing any library not listed above: STOP and ask the user.**

---

## HARD RULES — ZERO TOLERANCE

```
HARD-01: NEVER create a backend server, Express app, or API handler of any kind
HARD-02: NEVER make network calls after model + autoeq.db initial asset load
HARD-03: NEVER use Next.js — this is Vite + React, not Next.js
HARD-04: NEVER create AudioContext outside of a user gesture handler (click/keydown)
HARD-05: NEVER access IndexedDB from outside Service layer or src/storage/ modules
HARD-06: NEVER call Service classes from React components — use Hooks
HARD-07: NEVER skip IndexedDB cache check before fetching model or autoeq.db
HARD-08: NEVER use localStorage — IndexedDB only
HARD-09: NEVER apply EQ bands without clamping to [-12, +12] first
HARD-10: NEVER instantiate a service class more than once — singletons only
HARD-11: NEVER use redux — Zustand only
HARD-12: NEVER start Phase N+1 while Phase N has incomplete tasks
HARD-13: NEVER use type 'any' — use 'unknown' with type guards
HARD-14: NEVER commit code that fails eslint or tsc --noEmit
HARD-15: NEVER use Framer Motion outside the 5 specified animation cases in DESIGN_WEB.md
HARD-16: NEVER add border-radius to cards, panels, or buttons — 0px everywhere
HARD-17: NEVER use gradient backgrounds
HARD-18: NEVER use AudioBufferSourceNode twice — create a new one per play() call
```

---

## LAYER RESPONSIBILITY MAP

| What you're building | Layer | Location |
|---|---|---|
| Any screen, page, visual component | UI Layer | `src/components/` or `src/pages/` |
| App state (playback, library, EQ, UI flags) | State Layer | `src/stores/` |
| Bridge between UI and services | Hook Layer | `src/hooks/` |
| Audio playback lifecycle | Service Layer | `src/services/AudioPlayerService.ts` |
| BiquadFilter EQ chain | Service Layer | `src/services/EQService.ts` |
| TFLite inference + RL feedback | Service Layer | `src/services/MLService.ts` |
| Essentia.js audio features | Service Layer | `src/services/FeatureExtractorService.ts` |
| File indexing + File System Access | Service Layer | `src/services/LibraryService.ts` |
| sql.js AutoEQ queries | Service Layer | `src/services/AutoEQService.ts` |
| Model + AutoEQ DB cache management | Service Layer | `src/services/AssetLoaderService.ts` |
| IndexedDB schema + operations | Storage Layer | `src/storage/` |
| Static ML model | Public Asset | `public/ml/eq_model.tflite` |
| Static AutoEQ database | Public Asset | `public/autoeq.db` |
| sql.js WASM binary | Public Asset | `public/sql-wasm.wasm` |

---

## PROJECT STRUCTURE

```
smart-eq-player-web/
├── public/
│   ├── ml/eq_model.tflite
│   ├── autoeq.db
│   └── sql-wasm.wasm
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── ui/                     ← shadcn/ui (CLI-generated, do not edit)
│   │   ├── TrackListItem.tsx
│   │   ├── NowPlayingPanel.tsx
│   │   ├── EQFeedbackPill.tsx
│   │   ├── MiniPlayer.tsx
│   │   ├── HeadphoneSelector.tsx
│   │   ├── LibraryEmpty.tsx
│   │   ├── SkeletonTrack.tsx
│   │   └── AppInitLoader.tsx
│   ├── pages/
│   │   ├── LibraryPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/
│   │   ├── usePlayer.ts
│   │   ├── useLibrary.ts
│   │   ├── useEQ.ts
│   │   └── useHeadphone.ts
│   ├── services/
│   │   ├── AssetLoaderService.ts
│   │   ├── AudioPlayerService.ts
│   │   ├── EQService.ts
│   │   ├── MLService.ts
│   │   ├── FeatureExtractorService.ts
│   │   ├── LibraryService.ts
│   │   └── AutoEQService.ts
│   ├── stores/
│   │   ├── playbackStore.ts
│   │   ├── libraryStore.ts
│   │   ├── eqStore.ts
│   │   └── uiStore.ts
│   ├── storage/
│   │   ├── db.ts
│   │   ├── assetCache.ts
│   │   ├── trackStorage.ts
│   │   ├── eqStorage.ts
│   │   ├── feedbackStorage.ts
│   │   ├── preferenceStorage.ts
│   │   └── rlStorage.ts
│   ├── types/
│   │   ├── Track.ts
│   │   ├── EQSetting.ts
│   │   └── HeadphoneProfile.ts
│   ├── utils/
│   │   ├── trackId.ts
│   │   └── eqMath.ts
│   └── providers/
│       └── ServiceProvider.tsx
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.ts
├── vitest.config.ts
└── package.json
```

---

## KEY COMMANDS

```bash
# Development
bun run dev           # Start Vite dev server (localhost:5173)

# Type checking (MUST pass — zero errors)
npx tsc --noEmit

# Linting (MUST pass — zero errors)
bun run lint

# Tests (MUST pass before any phase is marked complete)
bun run test          # vitest run
bun run test:coverage # coverage report

# Production build
bun run build         # output to dist/
bun run preview       # preview production build

# shadcn/ui component install
npx shadcn@latest add [component-name]
```

---

## CODING CONVENTIONS

### TypeScript
```typescript
// Strict mode — no 'any'
// Use 'unknown' + type guards instead of 'any'
function processResponse(data: unknown): MyType {
  if (!isMyType(data)) throw new Error('Invalid shape')
  return data
}

// Service result type — ALL service public methods MUST use this
type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// EQ bands — always annotate explicitly
type EQBands = number[] // length 10, range [-12, +12]

// Zustand store pattern (Zustand 5.x)
import { create } from 'zustand'
interface MyStore { value: string; setValue: (v: string) => void }
export const useMyStore = create<MyStore>()((set) => ({
  value: '',
  setValue: (v) => set({ value: v }),
}))

// No default exports from hooks, stores, or utils — named exports only
// Default export ONLY for React components and service classes

// File naming:
// Components:  PascalCase.tsx
// Hooks:       useXxx.ts
// Services:    XxxService.ts
// Stores:      xxxStore.ts
// Utils:       camelCase.ts
// Types:       PascalCase.ts
```

### React Components
```tsx
// 'use client' directive NOT needed — this is Vite, not Next.js
// All components run in browser context

// Functional components only — no class components
// Props interface above the component
interface TrackListItemProps {
  track: Track
  isActive: boolean
  onPlay: () => void
}

export function TrackListItem({ track, isActive, onPlay }: TrackListItemProps) {
  // ...
}

// NEVER call service classes from components — use hooks
// BAD:
const result = audioPlayerService.play(track)  // ❌

// GOOD:
const { play } = usePlayer()
play(track)  // ✅

// CSS classes: use clsx() for conditional class merging
import { clsx } from 'clsx'
className={clsx('base-class', isActive && 'active-class', condition && 'other')}
```

### Framer Motion (5 cases only)
```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Case 1: EQ Feedback Pill enter/exit
<AnimatePresence>
  {showPill && (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />
  )}
</AnimatePresence>

// Case 2: Like button press
whileTap={{ scale: 0.94 }}
transition={{ type: 'spring', stiffness: 500, damping: 30 }}

// Case 3: Dislike shake
// Use useAnimation() hook to trigger shake sequence programmatically

// Case 4: Init loader progress
animate={{ width: `${progress}%` }}
transition={{ duration: 0.3, ease: 'easeOut' }}

// Case 5: Track selection border
// scaleX: 0 → 1 on left border element via CSS transform-origin: left
```

---

## API CONVENTIONS

There are no API routes. No server. No REST endpoints.
All "API" means: Service class public method signatures.

```typescript
// Service method contract
class ExampleService {
  // Public methods MUST return ServiceResult<T> for operations that can fail
  async doThing(input: string): Promise<ServiceResult<MyData>> {
    try {
      const data = await someOperation(input)
      return { ok: true, data }
    } catch (err) {
      console.error('[ExampleService] doThing failed:', err)
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  // Void methods (state updates, fire-and-forget) can throw — caller handles
  applySettings(settings: Settings): void {
    // ...
  }
}
```

---

## STORAGE CONVENTIONS

```typescript
// All IndexedDB ops via idb library — NEVER raw indexedDB API
import { getDB } from '@/storage/db'

// Pattern for all storage modules:
export async function getTrack(id: string): Promise<Track | null> {
  const db = await getDB()
  return await db.get('tracks', id) ?? null
}

export async function saveTrack(track: Track): Promise<void> {
  const db = await getDB()
  await db.put('tracks', track)
}

// getDB() is singleton — defined once in db.ts, imported everywhere
// openDB() MUST only be called in db.ts — never elsewhere
```

---

## AUDIO CONTEXT RULES

```typescript
// ✅ CORRECT — create on user gesture
class AudioPlayerService {
  private ctx: AudioContext | null = null

  async init(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }
}

// ❌ WRONG — create in constructor or on module load
class AudioPlayerService {
  private ctx = new AudioContext()  // BLOCKED BY BROWSER
}

// BiquadFilter chain — REQUIRED structure
// source → filter[0] → filter[1] → ... → filter[9] → gainNode → destination
// 10 filters, type: 'peaking', Q: 1.41
// Frequencies: [60, 150, 400, 1000, 2500, 4000, 6300, 10000, 14000, 16000]

// AudioBufferSourceNode is single-use:
// Create NEW source node for EVERY play() call
// Reuse the AudioBuffer (decoded data) — do NOT re-decode
```

---

## TFLITE WASM RULES

```typescript
// ✅ CORRECT — load from IDB cache
import { loadTFLiteModel } from '@tensorflow/tfjs-tflite'
import { assetLoaderService } from '@/services/AssetLoaderService'

const buffer = await assetLoaderService.loadModel()  // IDB → fetch if miss
const model = await loadTFLiteModel(buffer)

// ❌ WRONG — bypasses cache
const model = await loadTFLiteModel('/ml/eq_model.tflite')

// REQUIRED: dispose tensors after EVERY inference
import * as tf from '@tensorflow/tfjs'
const input = tf.tensor2d([inputArray], [1, 20])
const output = model.predict(input) as tf.Tensor
const bands = Array.from(await output.data())
input.dispose()   // REQUIRED
output.dispose()  // REQUIRED

// REQUIRED: clamp before use
const clamped = bands.map(b => Math.max(-12, Math.min(12, b)))
```

---

## EQ BAND CONTRACT

```typescript
// ALWAYS: number[] length 10, range [-12.0, +12.0] dB
type EQBands = number[]

// Band index → frequency:
// 0:60Hz  1:150Hz  2:400Hz  3:1kHz  4:2.5kHz
// 5:4kHz  6:6.3kHz  7:10kHz  8:14kHz  9:16kHz

// ALWAYS validate and clamp before applying to BiquadFilterNode:
function validateAndClampBands(bands: number[]): EQBands {
  if (bands.length !== 10) throw new Error('EQ bands must have exactly 10 elements')
  return bands.map(b => Math.max(-12, Math.min(12, b)))
}
```

---

## TESTING CONVENTIONS

```typescript
// vitest.config.ts setup
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      threshold: { branches: 80, functions: 80 },
    },
  },
})

// Test file naming: ComponentName.test.tsx or utilName.test.ts
// Co-locate test files with source files OR put in __tests__/ folder

// Test pattern for utils (eqMath, trackId, etc.)
import { describe, it, expect } from 'vitest'
import { clampBands, perturbBands } from '@/utils/eqMath'

describe('clampBands', () => {
  it('clamps values exceeding +12 to 12', () => {
    const result = clampBands([15, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(result[0]).toBe(12)
  })

  it('clamps values below -12 to -12', () => {
    const result = clampBands([-20, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(result[0]).toBe(-12)
  })

  it('rejects arrays with wrong length', () => {
    expect(() => clampBands([1, 2, 3])).toThrow()
  })
})

// Test pattern for storage layer (uses fake-indexeddb)
// Install: npm install -D fake-indexeddb
import 'fake-indexeddb/auto'
import { saveTrack, getTrack } from '@/storage/trackStorage'

// Test pattern for components
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrackListItem } from '@/components/TrackListItem'

// EVERY phase MUST have passing tests before it's marked complete
```

---

## LINTING SETUP (eslint 9.x flat config)

```typescript
// eslint.config.ts
import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
```

---

## GIT CONVENTIONS

```
Branch naming:
  feature/phase-N-description    (e.g. feature/phase-2-storage-layer)
  fix/short-description
  chore/short-description

Commit message format:
  [Phase N.NN] Short description of what changed
  Examples:
    [Phase 2.01] Add IndexedDB schema and openDB singleton
    [Phase 6.04] Wire BiquadFilter chain to AudioPlayerService
    [Fix] Clamp EQ bands before BiquadFilter update

One logical change per commit.
NEVER commit failing tests or failing lint.
```

---

## CONTEXT HINTS (for AI agents resuming work)

```
- docs/memory.md — current phase status and last action
- PLAN_WEB.md    — authoritative task checklist (source of truth for what to build next)
- src/storage/db.ts — IDB schema definition (check here for store/key names)
- src/types/     — all shared TypeScript types (check before defining new ones)
- src/utils/eqMath.ts — EQ math utilities (reuse, don't duplicate)
- src/providers/ServiceProvider.tsx — service singleton init order

If you're unsure which layer something belongs to: check LAYER RESPONSIBILITY MAP above.
If you're unsure what to build next: check PLAN_WEB.md current phase.
If something is not defined anywhere: ask the user — do NOT invent behavior.
```

---

## KNOWN GOTCHAS

```
GOTCHA-01: AudioContext must be created on user gesture — NEVER on mount or module load.

GOTCHA-02: sql.js needs sql-wasm.wasm in /public.
  Copy: cp node_modules/sql.js/dist/sql-wasm.wasm public/
  In AutoEQService: initSqlJs({ locateFile: (file) => `/${file}` })

GOTCHA-03: TFLite WASM needs asyncWebAssembly: true in vite.config.ts.
  Also needs COOP/COEP headers — set in vite.config.ts server.headers.

GOTCHA-04: AudioBufferSourceNode is single-use.
  Create a NEW source node per play(). Reuse the AudioBuffer (decoded data only).

GOTCHA-05: FileSystemFileHandle permissions expire after browser restart.
  Always call fileHandle.queryPermission() before fileHandle.getFile().
  If result is 'prompt': call fileHandle.requestPermission() — requires user gesture.

GOTCHA-06: @fontsource fonts must be self-hosted (CDN blocked by COEP headers).
  npm install @fontsource/inter @fontsource/jetbrains-mono
  Import in main.tsx before App.

GOTCHA-07: sql.js must NOT be pre-bundled by Vite.
  Add to vite.config.ts: optimizeDeps: { exclude: ['sql.js'] }

GOTCHA-08: @tensorflow/tfjs-tflite may log verbose WASM warnings.
  Suppress with: import '@tensorflow/tfjs-backend-cpu' before model load if needed.

GOTCHA-09: Zustand 5.x requires () after create<T>():
  create<MyStore>()(...)  — double parentheses is correct.

GOTCHA-10: Tailwind 4.x uses @tailwindcss/vite plugin, NOT postcss.
  Remove postcss.config if it exists. Add plugin to vite.config.ts only.

GOTCHA-11: idb 8.x has slightly different type signatures than 7.x.
  Use IDBPDatabase<Schema> type. Check docs before using.

GOTCHA-12: music-metadata-browser is async and may fail on some files.
  Always wrap in try/catch and fall back to filename parsing.
```

---

## OUT OF SCOPE — REFUSE IF ASKED

```
Any backend, server, API route, or server-side logic
Authentication or user accounts
Cloud sync (with mobile app or otherwise)
Playlist management (post-MVP — parking lot only)
Album / artist view (post-MVP)
PWA / service worker
Safari or Firefox support (Chrome/Edge only for MVP)
Light theme
Waveform visualizer / spectrum analyzer
Drag-and-drop file import
Export EQ profiles
Any network request beyond initial model + autoeq.db fetch
Mobile / responsive layout below 768px
```
