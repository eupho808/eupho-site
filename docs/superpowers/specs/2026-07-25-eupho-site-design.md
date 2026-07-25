# Eupho Site — Design Specification

## Project Overview

Personal portfolio website for **Eupho** combining:
- A **beats catalog** with preview player, Telegram-based sales, and drag-and-drop upload
- An original **3D Alice: Madness Returns-inspired runner** built with Three.js
- A **visual gallery** linking to social content
- An **about/contact** page

Visual direction: dreamy dark/horror aesthetic inspired by *Alice: Madness Returns*, backrooms liminality, Y2K/webcore frames, soft gradients, VHS/scanline effects, and body-horror Wonderland imagery.

**Copyright note:** The mini-game is an original work inspired by the atmosphere of *Alice: Madness Returns*. No original game assets, code, or trademarks will be used.

---

## Goals

1. Showcase Eupho's beats and visual work in a single immersive site.
2. Make it easy for visitors to preview beats and start a purchase conversation via Telegram.
3. Provide a playable 3D browser mini-game that strengthens the Alice/horror brand vibe.
4. Allow Eupho to upload new beats directly through the browser (local server or Netlify Functions).
5. Keep the site cheap and fast to host on static platforms.

---

## Non-Goals

1. No online payment processing in v1 (sales happen via Telegram negotiation).
2. No full port/emulation of the commercial *Alice: Madness Returns* game.
3. No user accounts or persistent cloud storage in v1.

---

## Architecture

**Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+), Three.js (via CDN), Canvas API, Node.js (local dev server), Netlify Functions (deployment).

```
/
├── index.html              # Landing / entrance page
├── beats.html              # Beats catalog with player + upload
├── game.html               # Alice-inspired 3D runner
├── visuals.html            # Gallery of art/video
├── about.html              # About + contact links
├── css/
│   └── main.css            # Global styles, palette, animations
├── js/
│   ├── main.js             # Shared scripts: nav, ambient effects
│   ├── beats.js            # Catalog player + upload logic
│   └── game.js             # Three.js game logic
├── data/
│   └── beats.json          # Beat metadata
├── netlify/
│   └── functions/
│       └── beats.js        # Netlify Function for beat upload
├── netlify.toml            # Netlify config
├── assets/
│   ├── images/             # Backgrounds, gallery, game art
│   ├── audio/              # Beat previews (mp3/wav)
│   └── fonts/              # Custom fonts (loaded via Google Fonts)
└── README.md
```

**Local server:** Node.js script with multipart upload support at `POST /api/beats`.

**Hosting:** Netlify recommended (static + serverless upload). GitHub Pages also possible if upload feature is disabled.

---

## Visual Style

### Palette

| Role | Hex | Usage |
|---|---|---|
| Dream purple | `#2d1b4e` | Deep background gradients |
| Dream pink | `#8b3a5c` / `#c45b7a` | Accents, borders, glows |
| Blood | `#8B0000` / `#DC143C` | Danger, horror moments |
| Deep black | `#0a0a0f` | Page base |
| Panel bg | `rgba(20, 16, 25, 0.65)` | Cards, frames |
| Panel border | `rgba(196, 91, 122, 0.25)` | Subtle borders |
| Bone | `#f5f0eb` | Primary text |
| Bone dim | `#a89fb0` | Secondary text |
| Gold | `#d4a574` | Coins, highlights |
| Mint | `#6b9a8a` | Calm accents |

### Typography

- **Display font:** *Cormorant Garamond* — elegant, dreamy serif.
- **Pixel/UI font:** *VT323* — Y2K/webcore feel for buttons and labels.
- **Body font:** *Space Mono* — technical, readable.

### Effects

- Animated soft radial gradients breathing in background.
- Subtle scanlines overlay.
- Glitch slice on main headings.
- Glassmorphism panels with pink/purple glows.
- Floating particles (petals, dust, sparkles).
- Y2K-style window frames with dot and title.

---

## Pages

### 1. Home (`index.html`)

- Full-screen hero with large **EUPHO** title.
- Floating badge "now entering wonderland".
- Navigation pill: BEATS | GAME | VISUALS | ABOUT.
- Three CTA buttons leading to internal pages.
- Quote from Cheshire Cat.
- Feature preview cards for Beats / Game / Visuals.

### 2. Beats (`beats.html`)

- Audio player (inline per beat).
- List of beats loaded from `data/beats.json`.
- Each beat card shows: title, BPM/key, tags, price, preview, buy.
- Filters by mood tag (All / dark / melancholic / aggressive / dreamy / uploaded).
- "Buy" links to `https://t.me/euphotg` with pre-filled beat title.
- Upload zone: drag & drop MP3/WAV. On local server the file is saved to `assets/audio/` and `data/beats.json` is updated. On Netlify the file is stored temporarily and the beat appears in the current session.

### 3. Game (`game.html`)

- Full Three.js 3D endless runner.
- Character: stylized Alice in a white dress with blood stains and black hair bow.
- Three zones with different fog/ground/accent colors:
  - Dreamy purple Wonderland
  - Blood-red horror hall
  - Sickly green swamp
- Controls:
  - Left/Right arrows or A/D — switch lane
  - Space/Up/W — jump, double jump
  - Down/S — crouch
- Hazards: spikes, blocks. Collectibles: golden rings (memories).
- 3 lives, score, high score saved in `localStorage`.
- Start / Game Over overlays.

### 4. Visuals (`visuals.html`)

- Responsive grid of visual cards.
- Placeholders ready to be replaced with images/videos.
- Hover overlay with title and social link.
- Links to YouTube and Instagram.

### 5. About (`about.html`)

- Portrait placeholder.
- Short artist bio.
- Social links: YouTube, Telegram, Instagram.
- Quote from Alice.

---

## Game Mechanics

- Auto-run forward through a 3D corridor.
- Lane switching (3 lanes).
- Jump and double jump to avoid low obstacles.
- Crouch to avoid high obstacles.
- Collision detection via distance checks.
- Progressive speed increase.
- Zone transitions every ~400 distance units.

---

## Beats Data Format

```json
[
  {
    "id": "wonderland-dream",
    "title": "Wonderland Dream",
    "bpm": 140,
    "key": "Dm",
    "tags": ["dark", "melancholic"],
    "price": "$30",
    "preview": "assets/audio/wonderland-dream-preview.mp3"
  }
]
```

Uploaded beats get default values: `bpm: "?"`, `key: "?"`, `tags: ["uploaded"]`, `price: "$?"`.

---

## Browser Support

- Modern Chrome, Firefox, Safari, Edge.
- Three.js requires WebGL support.
- Mobile layout supported, but the game is best played with keyboard on desktop.

---

## Future Enhancements

- p5.js generative art pages (like gabriellaturton.com).
- Web Audio API beat visualizer.
- More 3D game environments, enemies, and boss encounters.
- Online payment integration.
- Proper CMS/cloud storage for uploads.
- Custom Alice 3D model.

---

## Open Questions

1. Exact beat files and preview lengths to include.
2. Whether to replace placeholder visuals with actual artwork.
3. Preferred hosting platform (Netlify recommended).
