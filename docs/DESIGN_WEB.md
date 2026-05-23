# DESIGN_WEB.md — Smart EQ Player (Web Version)
**Version:** 2.0.0
**Platform:** Web (React + Vite, desktop browser)
**Design Language:** Neo-Brutalism Dark — Raw, Bold, Unapologetic

---

## ⚠️ AGENT READING INSTRUCTIONS

This document defines every visual decision for the web app.
- Do NOT invent design decisions not listed here
- Do NOT use gradients where flat color is specified
- Do NOT round corners beyond the values defined here
- Every banned pattern has a reason — read it before asking why

---

## Visual Theme & Atmosphere

**Identity:** A music tool that doesn't pretend to be friendly. Hard edges, harsh borders, visible structure. Feels like a dev tool that grew up listening to loud music. Not polished like a streaming app. Not dark mode for the sake of it — dark mode because it means business.

**Design Language:** Neo-Brutalism Dark
- Thick visible borders on almost every interactive element
- No soft shadows — hard offset box-shadows only (4px, 6px, 8px)
- Flat colors, no gradients, no glassmorphism
- Bold typographic contrast between data and metadata
- Intentional visual "weight" — elements look like they were stamped onto the screen

**Density:** High. Desktop app. Every pixel earns its place. No padding wasteland.

**Variance:** Medium-low. Components are consistent but not boring. Different element types have different border/shadow weights.

**Motion:** Purposeful and fast. No ambient animations. Interactions snap. Framer Motion used for exactly 4 things: EQ pill enter/exit, feedback reaction (like/dislike snap), track item selection state, and app init loader. Nothing else.

**What makes it memorable:** The hard-bordered EQ feedback pill with a chunky like/dislike button that physically presses in with a 2px offset box-shadow shift. Everything else is secondary.

---

## Color Palette & Roles

```css
/* Base Backgrounds */
--color-bg:             #0D0D0D;  /* true near-black — page background */
--color-surface:        #141414;  /* cards, panels, sidebars */
--color-elevated:       #1C1C1C;  /* hover states, active items, input backgrounds */
--color-border:         #2E2E2E;  /* default border color — used everywhere */
--color-border-strong:  #4A4A4A;  /* pressed states, focused inputs */

/* Text */
--color-text-primary:   #F5F5F5;  /* primary content, headings */
--color-text-secondary: #888888;  /* metadata: artist, duration, secondary labels */
--color-text-muted:     #555555;  /* disabled, placeholder */
--color-text-inverse:   #0D0D0D;  /* text on accent backgrounds */

/* Accent — Single accent, no confusion */
--color-accent:         #C8FF00;  /* electric chartreuse — primary interactive */
--color-accent-text:    #0D0D0D;  /* text on accent background */
--color-accent-hover:   #D4FF33;  /* accent on hover */

/* Semantic */
--color-like:           #00FF88;  /* like feedback */
--color-dislike:        #FF3D3D;  /* dislike feedback */
--color-warning:        #FFB800;  /* stale EQ or warning state */

/* EQ Visualizer (10 bands, used for mini bar chart) */
--eq-band-0:  #FF3D3D;   /* 60Hz   — sub-bass */
--eq-band-1:  #FF6B00;   /* 150Hz  — bass */
--eq-band-2:  #FFB800;   /* 400Hz  — low-mid */
--eq-band-3:  #FFE500;   /* 1kHz   — mid */
--eq-band-4:  #C8FF00;   /* 2.5kHz — upper-mid (matches accent) */
--eq-band-5:  #00FF88;   /* 4kHz   — presence */
--eq-band-6:  #00FFCC;   /* 6.3kHz — upper presence */
--eq-band-7:  #00C8FF;   /* 10kHz  — treble */
--eq-band-8:  #3D88FF;   /* 14kHz  — air */
--eq-band-9:  #AA3DFF;   /* 16kHz  — ultra-air */
```

**Accessibility Constraints:**
- Text contrast ratio MUST be ≥ 4.5:1 for body text (WCAG AA)
- Like (green) and Dislike (red) MUST use icon + color — never color alone
- Accent (`#C8FF00`) on dark background (`#0D0D0D`) passes contrast at large sizes (decorative use)
- Accent on text (`--color-text-inverse` on `--color-accent`): ≥ 7:1 — passes AAA

---

## Typography Rules

```css
/* Font Stack */
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;   /* track titles, durations, EQ values */
--font-sans:    'Inter', system-ui, sans-serif;              /* body, metadata, UI labels */

/* Size Scale (rem, browser default 16px) */
--text-xs:    0.6875rem;   /* 11px — format badges, tiny metadata */
--text-sm:    0.8125rem;   /* 13px — artist, album in list items */
--text-base:  0.9375rem;   /* 15px — primary list text, track title */
--text-lg:    1.125rem;    /* 18px — section headings, now-playing track */
--text-xl:    1.375rem;    /* 22px — artist name in now-playing */
--text-2xl:   1.75rem;     /* 28px — app title, currently unused in MVP */

/* Weights */
Regular:  400   (body, metadata)
Medium:   500   (primary list text, labels)
Bold:     700   (section headers, active track title — MONO ONLY)
Black:    900   (PROHIBITED in body — headline only if used)

/* Rules */
- Track titles: --font-mono, weight 700, --text-base
- Artist/album metadata: --font-sans, weight 400, --text-sm, --color-text-secondary
- Durations/EQ values: --font-mono, weight 400, --text-xs
- Section labels: --font-sans, weight 500, --text-sm, ALL CAPS, letter-spacing: 0.08em
- ALL CAPS is ONLY allowed for section labels — never for user-content
- Track title truncation: single line, text-overflow: ellipsis — NEVER marquee
- Line height body: 1.5
- Line height mono/headings: 1.2
```

---

## Neo-Brutalism Component Rules

### Core Visual Signature
Every interactive element follows this pattern:
```css
/* Default state */
border: 2px solid var(--color-border);
background: var(--color-surface);
box-shadow: 4px 4px 0px var(--color-border);

/* Hover state */
border-color: var(--color-border-strong);
box-shadow: 6px 6px 0px var(--color-border-strong);
transform: translate(-1px, -1px);

/* Active/pressed state */
box-shadow: 1px 1px 0px var(--color-border-strong);
transform: translate(3px, 3px);

/* Focus state */
outline: 2px solid var(--color-accent);
outline-offset: 2px;
```

---

## Component Specifications

### Track List Item
```
Height:         56px
Layout:         [AlbumArt 40px] [12px] [Title + Artist stack] [flex-1] [Duration] [EQ dot]
Border:         1px solid var(--color-border) — bottom border only (no full box)
Background:     transparent default / var(--color-elevated) on hover
Active border:  3px solid var(--color-accent) — left side only
Active bg:      var(--color-elevated)
AlbumArt:       40x40px, border: 1px solid var(--color-border), border-radius: 0 (square)
Title:          --font-mono, 700, --text-base, --color-text-primary, truncate
Artist:         --font-sans, 400, --text-sm, --color-text-secondary, truncate
Duration:       --font-mono, 400, --text-xs, --color-text-muted, tabular-nums
EQ dot:         8px circle — var(--color-accent) fill if has liked EQ, transparent otherwise
               border: 1px solid var(--color-border-strong) always
Transition:     background 100ms ease, border-color 100ms ease (no transform on list items)
```

### Now Playing Panel
```
Layout:         Right sidebar (desktop) — 320px fixed width
Background:     var(--color-surface)
Border:         2px solid var(--color-border) — left border only
AlbumArt:       Full width (272px), square (no radius), border: 2px solid var(--color-border)
Track Title:    --font-mono, 700, --text-lg, single line truncate
Artist Name:    --font-sans, 400, --text-xl, --color-text-secondary, truncate
Progress Bar:
  Track:        4px height, background var(--color-elevated), border: 1px solid var(--color-border)
  Fill:         var(--color-accent)
  NO border-radius on progress bar (neo-brutalism = square)
  Thumb:        12px square (not circle), var(--color-accent), visible always
Controls:       Icon buttons — see Button spec
                Play/Pause: 40x40px, filled var(--color-accent) background, icon var(--color-accent-text)
                Prev/Next: 32x32px, border 2px solid var(--color-border)
EQ Status Row:  10-band mini bar chart, height 28px, below controls
                Each bar: 4px wide, var(--eq-band-N) color, square top
Volume:         Horizontal slider, same style as progress bar, label "VOL" in --font-mono --text-xs
```

### EQ Feedback Pill
```
Position:       Fixed, bottom 80px, centered horizontally (left: 50%, transform: translateX(-50%))
Background:     var(--color-surface)
Border:         3px solid var(--color-border-strong)
Box-shadow:     6px 6px 0px var(--color-border-strong)
Border-radius:  0px (completely square — neo-brutalism)
Padding:        12px 16px
Layout:         [EQ bars 80px] [16px] [DISLIKE btn] [8px] [LIKE btn]

DISLIKE Button:
  Size:         36x36px
  Border:       2px solid var(--color-dislike)
  Color:        var(--color-dislike)
  Box-shadow:   3px 3px 0px var(--color-dislike)
  Hover:        box-shadow 5px 5px — moves up-left 1px
  Press:        box-shadow 1px 1px — moves down-right 2px (Framer Motion)
  Icon:         ThumbsDown (lucide-react)

LIKE Button:
  Size:         36x36px
  Border:       2px solid var(--color-like)
  Color:        var(--color-like)
  Box-shadow:   3px 3px 0px var(--color-like)
  Hover:        box-shadow 5px 5px
  Press:        box-shadow 1px 1px (Framer Motion)
  Icon:         ThumbsUp (lucide-react)

EQ Mini Bars:
  10 vertical bars, each 6px wide, 2px gap
  Height proportional to band gain: 0dB = 14px height, ±12dB = 4px to 24px
  Color: var(--eq-band-N) per band index
  Background bar (always): 4px height var(--color-elevated), centered
  No animation on bars — static snapshot of current EQ

Framer Motion:
  Enter: y: 80 → y: 0, opacity: 0 → 1, duration: 0.2s, ease: "easeOut"
  Exit:  y: 0 → 80, opacity: 1 → 0, duration: 0.15s, ease: "easeIn"
  Like press: scale 0.94 → 1, duration: 0.1s (spring)
  Dislike press: x: 0 → -4 → 4 → 0 (shake), duration: 0.2s
```

### Mini Player (Bottom Bar)
```
Height:         64px
Position:       Fixed bottom, full width
Background:     var(--color-bg)
Border:         2px solid var(--color-border) — top border only
Box-shadow:     0 -4px 0px var(--color-border)
Layout:         [AlbumArt 48px] [12px] [Title + Artist] [flex-1] [Prev/Play/Next] [Progress mini]
AlbumArt:       48x48px, square, border: 1px solid var(--color-border)
Progress mini:  Full width bar, 2px height, absolute positioned at very bottom of bar
                var(--color-accent) fill — updates without animation (just position)
```

### Button Variants
```
PRIMARY:
  Background:   var(--color-accent)
  Text:         var(--color-accent-text), --font-mono, 700
  Border:       2px solid var(--color-accent)
  Box-shadow:   4px 4px 0px rgba(200,255,0,0.4)
  Hover:        box-shadow 6px 6px, transform translate(-1px, -1px)
  Press:        box-shadow 1px 1px, transform translate(3px, 3px)
  Height:       36px

SECONDARY (ghost):
  Background:   transparent
  Text:         var(--color-text-primary), --font-sans, 500
  Border:       2px solid var(--color-border)
  Box-shadow:   3px 3px 0px var(--color-border)
  Hover:        border-color var(--color-border-strong), box-shadow 5px 5px
  Height:       36px

ICON BUTTON:
  Size:         32x32px or 40x40px
  Background:   transparent
  Border:       2px solid var(--color-border)
  Box-shadow:   2px 2px 0px var(--color-border)
  Hover:        border-color var(--color-border-strong), translate(-1px, -1px)
  Press:        translate(1px, 1px), box-shadow 0px 0px

DESTRUCTIVE:
  Same as SECONDARY but border + text: var(--color-dislike)
  Box-shadow: 3px 3px 0px var(--color-dislike)
```

### Input / Search Bar
```
Height:         36px
Background:     var(--color-elevated)
Border:         2px solid var(--color-border)
Box-shadow:     none (inputs are recessed, not raised)
Border-radius:  0px
Focus:          border-color var(--color-accent), outline: none
Text:           --font-sans, --text-base, --color-text-primary
Placeholder:    --color-text-muted
Padding:        0 12px
Clear button:   X icon 16px, right-aligned inside input, --color-text-muted
```

### Cards & Panels
```
Background:   var(--color-surface)
Border:       2px solid var(--color-border)
Box-shadow:   4px 4px 0px var(--color-border)
Border-radius: 0px (all panels, all cards — square edges everywhere)
Padding:      16px
```

### Navigation (Sidebar or Tab Bar)
```
Desktop: left sidebar, 200px wide, fixed
Background: var(--color-bg)
Border: 2px solid var(--color-border) — right border only
Nav items:
  Height:     40px
  Font:       --font-sans, 500, --text-sm
  Default:    --color-text-secondary, no background, no border
  Hover:      --color-text-primary, background var(--color-elevated)
  Active:     background var(--color-elevated), 3px left border var(--color-accent),
              --color-text-primary, --font-mono
  Icon:       16px lucide-react, left-aligned
  No box-shadow on nav items — only background/border change
```

### Headphone Selector (Sheet/Drawer)
```
Type:         shadcn Sheet — right side slide-in (NOT bottom sheet on desktop)
Width:        360px
Background:   var(--color-surface)
Border:       2px solid var(--color-border) — left border only
No box-shadow on sheet itself

Search input: top of sheet, always visible, autofocus on open
List:         brand-grouped, alphabetical within brand
Item height:  48px
Item layout:  [Name --text-base --color-text-primary] [↵] [Brand --text-sm --color-text-secondary]
Selected:     checkmark right, 3px left border var(--color-accent), background var(--color-elevated)
Confirm btn:  PRIMARY button, bottom of sheet, full width
```

### Empty States
```
Layout:       centered vertically + horizontally in content area
Icon:         32px lucide-react, --color-text-muted, stroke-only
Title:        --font-mono, 700, --text-lg, --color-text-primary
Subtitle:     --font-sans, 400, --text-sm, --color-text-muted, max 2 lines
CTA button:   PRIMARY variant
              Centered below subtitle, 12px gap

Examples:
  No library: "NO MUSIC" / "Drop files here or click to add." / [ADD MUSIC] button
  No headphone: "NO EARPHONE SELECTED" / "Select your device to enable Smart EQ." / [SELECT] button
  No search results: "NOTHING FOUND" / "Try a different search term." / no CTA
```

### Skeleton Loaders
```
Component:    Same dimensions as real component
Background:   var(--color-elevated)
Animation:    CSS keyframe shimmer — background position shift, 1.5s infinite
              @keyframes shimmer { from { opacity: 0.4 } to { opacity: 0.8 } }
              NOT gradient shimmer — just opacity pulse (simpler, fits neo-brutalism)
Border:       1px solid var(--color-border)
Max duration: Show for max 5s — switch to error state after
```

### App Init Loader
```
Full screen, var(--color-bg) background
Center layout, vertical stack, 24px gap
Logo/App name: --font-mono, 700, --text-2xl, --color-accent
Status line:   --font-mono, 400, --text-sm, --color-text-secondary
               Updates: "LOADING MODEL..." → "LOADING HEADPHONE DB..." → "READY"
Progress bar:  Full-width (max 400px), height 4px, square, var(--color-accent) fill
               Framer Motion animate: width from 0% to 100% as steps complete
No spinner — progress bar only
```

---

## Layout Principles

```
Grid System:
  Sidebar width (desktop):    200px, fixed
  Now Playing panel (desktop): 320px, fixed
  Content area:               flex-1, min-width 0 (prevents overflow)
  Page horizontal padding:    24px

Spacing Rhythm (4px base):
  4px   — icon-text gap, tiny metadata spacing
  8px   — component internal spacing, badge padding
  12px  — list item internal gaps, input padding
  16px  — card padding, section internal spacing
  24px  — page padding, major gaps
  32px  — section separators
  48px  — hero/large area spacing

Desktop Layout (>1024px):
  [Sidebar 200px] [Content flex-1] [Now Playing 320px]
  Bottom bar: MiniPlayer 64px fixed, z-index 20

Narrow Desktop (768px–1024px):
  [Sidebar hidden — icon only 56px] [Content flex-1] [Now Playing 320px]

Mobile (< 768px):
  NOT a target — designed for desktop first
  Minimum supported: 768px width
  At < 768px: show "use desktop browser" message, no responsive layout

Z-Index Contract:
  0:    Page content, track list
  10:   Sidebar, Now Playing panel
  20:   Mini player bottom bar
  30:   EQ Feedback Pill (fixed)
  40:   Sheet / Drawer overlays
  50:   Dialog / Modal
  100:  Toast notifications (shadcn/ui Sonner if added)
```

---

## Motion & Interaction Rules

```
Framer Motion usage (EXACTLY these 5 cases):
  1. EQ Feedback Pill — enter/exit animation (y translate + opacity)
  2. Like button press — scale spring
  3. Dislike button press — horizontal shake
  4. App init loader progress bar — width animation
  5. Track list item selection — border-left slide (scaleX from 0 to 1)
  NO OTHER Framer Motion usage in MVP

CSS Transitions (allowed everywhere for micro-interactions):
  Default: background-color 100ms ease, border-color 100ms ease, opacity 100ms ease
  Hover lifts: transform 100ms ease, box-shadow 100ms ease
  NO transitions on: position, width, height, padding (causes layout thrash)

Prohibited Animations:
  Looping ambient animations at rest (absolute ban)
  Parallax of any kind
  Crossfade between tracks (audio only — no UI transition)
  Rotation on any UI element
  Transition duration > 300ms (except init loader progress bar)
  JS-driven animation loops (requestAnimationFrame for UI) — Framer Motion only

Hover states (desktop):
  All interactive elements MUST have visible hover state (background or border change)
  Cursor: pointer on all clickable elements — enforced via global CSS
  No hover states on disabled elements
```

---

## Anti-Patterns (Banned)

```
BANNED-01: border-radius on cards, panels, buttons — 0px everywhere
           REASON: neo-brutalism uses hard corners as a visual statement

BANNED-02: Gradient backgrounds of any kind (CSS gradient, SVG gradient)
           REASON: flat colors are the point

BANNED-03: box-shadow with blur (e.g. box-shadow: 0 4px 12px rgba...)
           REASON: use hard offset shadows only (0 blur, X Y offset, solid color)

BANNED-04: Glassmorphism (backdrop-filter: blur)
           REASON: incompatible with design language

BANNED-05: Light theme
           REASON: dark only in this version

BANNED-06: Framer Motion on any component not listed in Motion rules above
           REASON: performance and design consistency

BANNED-07: More than 1 accent color in interactive elements
           REASON: --color-accent (#C8FF00) is the only accent

BANNED-08: Auto-playing UI sounds or haptics
           REASON: obviously

BANNED-09: Spinner/loading indicators — use progress bar or skeleton only
           REASON: spinners are uncertain; progress bars are honest

BANNED-10: Tooltip on every icon — only on non-obvious icons
           REASON: clutters the interface

BANNED-11: Emoji in UI text labels
           REASON: inconsistent rendering, not on-brand

BANNED-12: Sidebar collapsing animation — just show/hide instantly
           REASON: saves complexity, fast is better than smooth here

BANNED-13: Drag-and-drop with animated preview (ghost element)
           REASON: MVP scope — use file input only

BANNED-14: Google Fonts loaded from CDN
           REASON: COEP headers break external font loading
           FIX: self-host JetBrains Mono + Inter via npm packages or local files

BANNED-15: shadcn/ui default rounded corners — override in globals.css:
           --radius: 0px
           REASON: must match neo-brutalism spec everywhere
```

---

## CSS Setup Requirements

```css
/* globals.css — REQUIRED overrides */

/* Override shadcn/ui radius to 0 globally */
:root {
  --radius: 0px;
}

/* Neo-brutalism cursor */
* { cursor: default; }
[role="button"], button, a, input[type="checkbox"], input[type="radio"],
select, [tabindex]:not([tabindex="-1"]) {
  cursor: pointer;
}

/* Scrollbar styling — matches design */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border: 2px solid var(--color-bg);
}
::-webkit-scrollbar-thumb:hover { background: #6A6A6A; }

/* Selection color */
::selection {
  background: var(--color-accent);
  color: var(--color-accent-text);
}

/* Remove default button styles globally */
button { all: unset; cursor: pointer; box-sizing: border-box; }
```

---

## Font Loading (Self-Hosted, Required)

```bash
# Install font packages — NOT Google Fonts CDN (blocked by COEP headers)
npm install @fontsource/jetbrains-mono @fontsource/inter
```

```typescript
// src/main.tsx — import fonts before App
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
```

```css
/* tailwind.config.ts — extend fontFamily */
fontFamily: {
  mono: ['JetBrains Mono', 'monospace'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```
