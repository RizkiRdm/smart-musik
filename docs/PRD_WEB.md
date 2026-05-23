# PRD_WEB.md — Smart EQ Player (Web Version)
**Version:** 2.0.0
**Platform:** Web (React 19 + Vite 6, desktop browser — Chrome/Edge)
**Scope:** Personal use — single user, localhost hosting
**Relation:** Companion to Android app — same ML model, same EQ logic, different runtime

---

## Project Summary

Smart EQ Player Web is a **browser-based, fully offline music player** running on a locally hosted Vite + React app. It replicates the AI EQ intelligence from the Android app — per-track EQ generation, like/dislike feedback loop — entirely in the browser via WebAssembly. No backend. No cloud. No data leaves the machine.

**Primary Objective:**
Same smart EQ experience on desktop PC, without building a native Electron app.

**Value Proposition:**
Same `.tflite` model from the Python training pipeline runs in-browser via TFLite WASM. User selects local audio files. EQ settings persist across sessions via IndexedDB. Model cached after first load — never re-downloaded.

---

## Target User

Single user: the developer/owner. Personal tool, not a SaaS product.

- **Device:** Desktop PC or laptop
- **Browser:** Chrome 111+ or Edge 111+ (stable WebAssembly SIMD support required)
- **Music source:** Local audio files (MP3, FLAC, AAC, OGG, WAV)
- **Hosting:** `localhost` via `npm run dev` or `npm run preview`

---

## Problem Statement

The Android app is Android-only. The owner also listens to music on PC. Running the same smart EQ logic on PC requires either a native desktop app (high complexity) or a web app (lightweight, no installation). A locally hosted Vite + React app with WASM ML provides the same experience without Electron overhead.

---

## Success Metrics

All metrics are measurable.

| Metric | Target |
|---|---|
| Model load time — first visit (uncached) | < 5s on localhost |
| Model load time — cached (IndexedDB) | < 500ms |
| EQ generation per track | < 2s |
| Audio playback start latency | < 300ms after file selection |
| EQ applied to playback | Before 5s mark of track |
| Like/Dislike → new EQ generated | < 3s |
| EQ settings persist after browser close | 100% (IndexedDB) |
| App fully functional offline after first load | 100% |
| No network requests after initial asset load | 100% |
| Build succeeds with 0 lint errors | 100% |
| All Vitest tests pass | 100% |

---

## Core Capabilities (MVP)

### 1. Local File Library
- User selects audio files via File System Access API or `<input type="file" multiple>`
- Files indexed in-browser + metadata cached in IndexedDB
- Library persists across sessions via stored FileSystemFileHandles
- Supported formats: MP3, FLAC, AAC, OGG, WAV

### 2. Audio Playback Engine (Web Audio API)
- Play, pause, resume, skip next/prev
- Seek via progress bar
- Queue management
- Shuffle and repeat modes (off / one / all)
- Volume control

### 3. Real-Time EQ Processing (Web Audio API BiquadFilterNode)
- 10-band parametric EQ via chained BiquadFilterNode instances
- EQ applied to audio output stream in real-time
- Per-track EQ loaded at track start
- EQ changes applied without playback interruption

### 4. Headphone Profile Selection
- AutoEQ dataset loaded from local SQLite via sql.js (WASM)
- Searchable headphone list
- Selection persisted in IndexedDB

### 5. AI EQ Generation (TFLite WASM — in-browser)
- Same `eq_model.tflite` model as Android app, bundled in `/public/ml/`
- Model loaded via `@tensorflow/tfjs-tflite`, cached in IndexedDB after first fetch
- Audio feature extraction via Essentia.js WASM
- Inference: float32[20] → float32[10] EQ bands

### 6. User Feedback & RL Loop
- Like / Dislike buttons during playback (EQ Feedback Pill)
- Dislike → generate alternative EQ (epsilon-greedy perturbation)
- Like → save as track default in IndexedDB
- Feedback and RL state persisted in IndexedDB

### 7. Persistent Storage (IndexedDB via idb)
- EQ settings per track
- Headphone selection
- Feedback history
- RL policy weights
- Library metadata
- Model binary cache (one-time download)

---

## Non-MVP Features

- Multi-user support
- Cloud sync with Android app
- Playlist management (post-MVP)
- Album / artist view (post-MVP)
- Waveform visualizer
- Drag-and-drop file import
- PWA / installable app
- Export EQ profiles
- Safari / Firefox support
- Light theme
- Mobile layout

---

## User Flow

### First Visit
```
Open localhost:5173
  → App init loader appears
  → Model fetch: /public/ml/eq_model.tflite → cached in IndexedDB
  → AutoEQ DB fetch: /public/autoeq.db → loaded via sql.js
  → "Select your earphone" modal (if no selection stored)
  → Library empty state → user clicks "Add Music"
  → File picker → files indexed → library populated
```

### Subsequent Visits
```
Open localhost:5173
  → Model loaded from IndexedDB cache (<500ms)
  → AutoEQ DB loaded from IndexedDB cache
  → Library restored from IndexedDB metadata
  → Ready
```

### Play Track (First Time)
```
User clicks track
  → Playback starts
  → Audio feature extraction (Essentia.js)
  → TFLite WASM inference → EQ bands
  → BiquadFilterNode chain updated
  → EQ feedback pill appears after 5s
```

### EQ Feedback
```
Dislike → alternative EQ generated → applied → pill resets timer
Like → saved to IndexedDB as default → pill dismisses
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Build Tool | Vite | 6.x |
| UI Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Animation | Framer Motion | 12.x |
| State Management | Zustand | 5.x |
| Audio Playback | Web Audio API | native |
| EQ Processing | BiquadFilterNode | native |
| ML Runtime | @tensorflow/tfjs-tflite | latest |
| Audio Analysis | Essentia.js | 0.1.3+ |
| Persistent Storage | IndexedDB via idb | 8.x |
| SQLite (AutoEQ) | sql.js | 1.12.x |
| Icons | lucide-react | latest |
| Fonts | @fontsource/inter, @fontsource/jetbrains-mono | latest |
| Linting | eslint | 9.x |
| Testing | vitest + @testing-library/react | 3.x / 16.x |
| Hosting | localhost (npm run dev / preview) | — |

---

## Technical Notes & Assumptions

- **No backend.** Vite used as frontend build tool only. No API routes, no server.
- **All code is client-side.** No SSR. All components run in browser context.
- **File System Access API** preferred for re-opening files across sessions. Fallback: `<input type="file">`.
- **AudioWorklet** used for Essentia.js feature extraction to avoid blocking main thread.
- **Model cache:** Fetch `/public/ml/eq_model.tflite` once, store ArrayBuffer in IndexedDB key `model:eq_model_v1`. Subsequent loads read from IDB — skip network entirely.
- **AutoEQ DB cache:** Same strategy. Loaded once, stored as Uint8Array in IDB.
- **Track identity:** SHA256(fileName + fileSize) via Web Crypto API. No content hash (too slow).
- **Browser target:** Chrome 111+ / Edge 111+ — required for File System Access API and WASM SIMD.
- **Design system:** Neo-brutalism dark. Hard borders, no rounded corners, no gradients, electric chartreuse accent (#C8FF00). Defined in DESIGN_WEB.md.
- **COOP/COEP headers required** in vite.config.ts for SharedArrayBuffer (needed by some WASM modules).
- **Self-hosted fonts required** — CDN fonts blocked by COEP headers. Use @fontsource packages.
- **eslint 9.x flat config** format — no legacy .eslintrc files.
