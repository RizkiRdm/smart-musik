# PROMPT_WEB.md — One-Shot AI Agent Prompt
# Smart EQ Player Web Version
# ─────────────────────────────────────────────────────────────
# HOW TO USE THIS PROMPT
#
# This is a complete context injection prompt for any AI coding
# agent (Claude, Gemini, Cursor, Copilot, etc.) to work on the
# web version of Smart EQ Player.
#
# Paste this entire file content as your first message to the agent,
# then follow with your specific task request.
#
# The PLAN_WEB.md phase structure is the primary execution guide —
# tell the agent which phase/task you want to work on.
#
# Example usage after pasting this prompt:
#   "Execute Phase 0 completely."
#   "Implement task 3.01 and 3.02 from PLAN_WEB.md."
#   "Phase 7 is complete. Start Phase 8."
# ─────────────────────────────────────────────────────────────

---

You are an AI coding agent working on **Smart EQ Player Web** — a browser-based offline music player with per-track AI-assisted equalization. Read this entire context before writing any code.

---

## WHAT THIS PROJECT IS

A **locally-hosted Next.js web app** that:
- Plays local audio files selected from the user's PC
- Generates per-track EQ settings using a TFLite ML model running **in-browser via WebAssembly**
- Persists EQ settings and user preferences in **IndexedDB**
- Has **zero backend** — no server, no API routes, no network calls after initial asset load
- Uses the same `.tflite` model as the companion Android app (same training pipeline)
- Is for **personal use only** — single user, localhost hosting

**This is NOT a SaaS app. There is no backend. There is no authentication. There is no cloud.**

---

## TECH STACK

```
Framework:        Next.js 14 (App Router, TypeScript strict)
UI:               shadcn/ui + Tailwind CSS (dark theme only)
Audio:            Web Audio API (native — no library)
EQ:               BiquadFilterNode chain (10 bands, Web Audio API)
ML Runtime:       @tensorflow/tfjs + @tensorflow/tfjs-tflite (TFLite WASM)
Audio Analysis:   Essentia.js (WASM)
State:            Zustand 4.x
Storage:          IndexedDB via idb library
AutoEQ Database:  sql.js (WASM SQLite, read-only, in-browser)
Hosting:          localhost (next dev / next start)
```

---

## ARCHITECTURE — LAYERS (TOP TO BOTTOM)

```
UI Layer         → src/components/, src/app/           (React, shadcn/ui)
State Layer      → src/stores/                         (Zustand)
Hook Layer       → src/hooks/                          (bridge UI ↔ Services)
Service Layer    → src/services/                       (singleton classes)
Storage Layer    → src/storage/                        (IndexedDB via idb)
Public Assets    → public/ml/eq_model.tflite           (TFLite model, static)
                   public/autoeq.db                    (AutoEQ headphone DB, static)
```

**Call direction:** UI → Hook → Service → Storage. Never reverse.

---

## PROJECT STRUCTURE

```
smart-eq-player-web/
├── public/
│   ├── ml/eq_model.tflite         ← TFLite model (int8 quantized)
│   ├── autoeq.db                  ← AutoEQ headphone database
│   └── sql-wasm.wasm              ← sql.js WASM (copy from node_modules)
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← wrap with ServiceProvider
│   │   ├── page.tsx               ← main player page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    ← shadcn/ui generated
│   │   ├── TrackListItem.tsx
│   │   ├── NowPlaying.tsx
│   │   ├── EQFeedbackPill.tsx
│   │   ├── MiniPlayer.tsx
│   │   ├── HeadphoneSelector.tsx
│   │   ├── LibraryEmpty.tsx
│   │   └── SkeletonLoader.tsx
│   ├── hooks/
│   │   ├── usePlayer.ts
│   │   ├── useLibrary.ts
│   │   ├── useEQ.ts
│   │   └── useHeadphone.ts
│   ├── services/
│   │   ├── AssetLoaderService.ts  ← model + autoeq cache (IDB)
│   │   ├── AudioPlayerService.ts  ← Web Audio API playback
│   │   ├── EQService.ts           ← BiquadFilterNode chain
│   │   ├── MLService.ts           ← TFLite WASM inference + RL
│   │   ├── FeatureExtractorService.ts ← Essentia.js
│   │   ├── LibraryService.ts      ← File System Access API
│   │   └── AutoEQService.ts       ← sql.js headphone queries
│   ├── stores/
│   │   ├── playbackStore.ts
│   │   ├── libraryStore.ts
│   │   └── eqStore.ts
│   ├── storage/
│   │   ├── db.ts                  ← idb schema + openDB()
│   │   ├── assetCache.ts          ← model + autoeq binary cache
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
│   │   ├── trackId.ts             ← SHA256(filename + filesize)
│   │   └── eqMath.ts              ← clamp, perturbation, normalize
│   └── providers/
│       └── ServiceProvider.tsx    ← singleton init on client mount
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## CRITICAL CONTRACTS

### Model Cache (MOST IMPORTANT)
```typescript
// eq_model.tflite is fetched ONCE, stored in IndexedDB, reused forever
// Key: 'model:eq_model_v1'
// On app load: check IDB → HIT: load buffer | MISS: fetch /ml/eq_model.tflite → store → load
// NEVER call loadTFLiteModel('/ml/eq_model.tflite') directly — always load from IDB buffer
```

### EQ Bands
```typescript
// ALWAYS: float[10], range [-12.0, +12.0] dB
// Frequencies: [60, 150, 400, 1000, 2500, 4000, 6300, 10000, 14000, 16000] Hz
// BiquadFilterNode type: 'peaking', Q: 1.41
// Clamp BEFORE applying: Math.max(-12, Math.min(12, band))
```

### TFLite Inference
```typescript
// Input: Float32Array[20] = [10 audio features (0–1)] + [10 headphone correction (-1–1)]
// Output: Float32Array[10] = EQ band gains in dB (before clamping)
// ALWAYS dispose tensors after inference
// ALWAYS fallback to headphone correction curve if inference throws
```

### AudioContext
```typescript
// NEVER create AudioContext on page load or in constructor
// ALWAYS create on first user click/tap
// ALWAYS check audioContext.state === 'suspended' → resume() before play
// ONE AudioContext per session — stored in AudioPlayerService singleton
```

### Track Identity
```typescript
// id = SHA256(fileName + fileSize) via Web Crypto API
// NEVER hash file contents — too slow
```

### IndexedDB Stores
```
tracks              (id: SHA256 hash)
eq_settings         (compound key: [trackId, headphoneId, generation])
feedback_log        (autoIncrement id)
headphone_profiles  (id: AutoEQ slug)
user_preferences    (key-value)
asset_cache         (key-value: model + autoeq binary)
rl_state            (headphoneId)
```

---

## HARD RULES — NEVER VIOLATE

```
1. NEVER create Next.js API routes
2. NEVER make network calls after model + autoeq.db initial load
3. NEVER use 'use server' or server actions for player logic
4. NEVER create AudioContext outside a user gesture handler
5. NEVER use localStorage — IndexedDB only
6. NEVER call services from React components — use hooks
7. NEVER skip IDB cache check before fetching model/autoeq.db
8. NEVER apply EQ bands without clamping first
9. NEVER instantiate a service class twice — singletons only
10. NEVER use redux — Zustand only
```

---

## DESIGN SYSTEM

Dark theme only. Matches the Android companion app.

```
Background base:    #0A0A0F
Surface:            #13131A
Elevated:           #1C1C26
Text primary:       #F0F0F5
Text secondary:     #8A8A9E
Accent (violet):    #6C63FF
Like (green):       #22C97A
Dislike (red):      #FF4D6D

Font: DM Mono (track titles, durations) + Inter (metadata, body)
All components use shadcn/ui — dark variant
Animation: useNativeDriver equiv = CSS transitions, no JS animation loops
```

---

## EXECUTION GUIDE

**Your primary reference is PLAN_WEB.md.** Every task is numbered (e.g., `3.02`). Execute phases in strict order. Do not start Phase N+1 until Phase N is fully done.

Current phase checklist (update as you complete):
- [ ] Phase 0 — Bootstrap
- [ ] Phase 1 — Types & Utils
- [ ] Phase 2 — IndexedDB Storage
- [ ] Phase 3 — Asset Cache Service
- [ ] Phase 4 — AutoEQ sql.js
- [ ] Phase 5 — Audio Player Service
- [ ] Phase 6 — EQ Service
- [ ] Phase 7 — Feature Extraction
- [ ] Phase 8 — ML Service
- [ ] Phase 9 — Library Service
- [ ] Phase 10 — Zustand Stores
- [ ] Phase 11 — Service Provider & Hooks
- [ ] Phase 12 — UI Components
- [ ] Phase 13 — Playback + EQ Integration
- [ ] Phase 14 — Polish & Edge Cases

**When you complete a task, say:** "Task [X.XX] complete. Proceeding to [X.XX+1]."
**When you complete a phase, say:** "Phase [N] complete. Ready for Phase [N+1] on your command."

**Before writing any code for a task, state:**
1. Which phase/task this is
2. Which layer it belongs to
3. Which HARD RULE is most relevant

---

## KNOWN GOTCHAS

```
- AudioContext blocked until user gesture — init() on first click only
- sql.js needs sql-wasm.wasm in /public — copy from node_modules
- TFLite WASM needs asyncWebAssembly: true in next.config.ts webpack config
- COEP/COOP headers required in next.config.ts for SharedArrayBuffer
- AudioBufferSourceNode is single-use — create new one per play()
- FileSystemFileHandle permissions expire after browser restart — re-request on restore
- @tensorflow/tfjs-tflite may need explicit tf.setBackend('cpu') before load
- Essentia.js worklet JS must be in /public — copy from node_modules dist
```

---

## OUT OF SCOPE — REFUSE IF ASKED

```
Any API route or backend
Authentication / user accounts
Cloud sync
Playlist management (post-MVP)
Album/artist view (post-MVP)
PWA / service worker
Safari support
Light theme
Waveform visualizer
Any network call beyond initial asset fetch
```

---

*Now tell me which phase or task to start.*
