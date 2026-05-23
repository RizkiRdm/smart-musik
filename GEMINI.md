# Smart EQ Player (Web Version)

Smart EQ Player Web is a browser-based, fully offline music player. It replicates the AI EQ intelligence from the original Android app, providing per-track EQ generation and a reinforcement learning feedback loop (like/dislike) entirely in the browser using the Web Audio API and IndexedDB.

## Project Overview

- **Core Goal:** Smart, AI-driven EQ calibration for local music files on desktop browsers.
- **Tech Stack:** React 19, Vite 6, TypeScript 5, Tailwind CSS 4, Framer Motion 12.
- **Key APIs:** Web Audio API (for playback and EQ), IndexedDB (via `idb` or native) for persistence.
- **Architecture:** Client-side only. Zero backend. All processing (audio & ML) happens in the browser.
- **Design Language:** **Neo-Brutalism Dark**. Hard edges (0px radius), chunky borders, hard offset shadows, and electric chartreuse accent (`#C8FF00`).

## Building and Running

- **Install dependencies:** `bun install`
- **Run development server:** `bun run dev` (defaults to port 3000)
- **Build for production:** `bun run build`
- **Linting:** `bun run lint` (runs `tsc --noEmit`)
- **Cleanup:** `bun run clean`

## Development Conventions

### Audio Processing
- **AudioContext Lifecycle:** The `AudioContext` **MUST** be initialized or resumed only after a user gesture (e.g., clicking a play button).
- **EQ Implementation:** 10-band parametric EQ using `BiquadFilterNode` chain (type: `peaking`).
- **Frequencies:** `[60, 150, 400, 1000, 2500, 4000, 6300, 10000, 14000, 16000]` Hz.
- **Gain Range:** All EQ bands must be clamped between `[-12.0, +12.0]` dB.

### Data & Persistence
- **Storage:** Use IndexedDB for tracks, EQ settings, headphone profiles, and feedback logs.
- **Track Identity:** Identify tracks using a hash of filename and size (SHA-256 preferred) or a unique string combination.
- **Offline First:** Assets (like the ML model or AutoEQ DB) should be cached in IndexedDB after the first load to enable full offline functionality.

### UI & Styling
- **Neo-Brutalism:**
  - **Borders:** 2px or 3px solid borders (default: `--color-border`).
  - **Corners:** `border-radius: 0px` on ALL elements (cards, buttons, inputs).
  - **Shadows:** Hard offset shadows (e.g., `4px 4px 0px var(--color-border)`), no blur.
  - **Colors:** Deep black backgrounds (`#0D0D0D`), chartreuse accent (`#C8FF00`).
- **Typography:**
  - **Monospace:** JetBrains Mono (for titles, data, mono-accented labels).
  - **Sans-serif:** Inter (for body text and metadata).
- **Icons:** Use `lucide-react`.

### State Management
- **Current State:** The project uses local React state and prop drilling in some places (v1).
- **Target State:** Transitioning towards **Zustand** for global state (playback, library, EQ) as per `ARCHITECTURE_WEB.md`.

## Key Files & Directories

- `src/audio.ts`: Core `AudioManager` handling Web Audio API and EQ logic.
- `src/storage.ts`: IndexedDB wrapper for persistence.
- `src/App.tsx`: Main application entry point and layout.
- `src/components/`: UI components (MiniPlayer, NowPlaying, EQFeedbackPill, etc.).
- `docs/`: Comprehensive technical and design documentation (PRD, Architecture, Design).
- `model/`: Contains the TFLite model binary.

## Project Status (v1 vs v2)
The project is currently in transition from a functional v1 (implemented in `src/`) to a more robust v2 (designed in `docs/`). 
- **v1 (Current):** Simple math-based EQ prediction, basic IndexedDB implementation.
- **v2 (Target):** TFLite WASM inference, Essentia.js feature extraction, singleton service layer, Zustand stores.
