# NOCTIS — Pure Electric Performance

A premium, minimal, single-page scrollytelling website for **NOCTIS**, a fictional electric car brand.

> **Mood**: A city in total blackout at night where the car's light is the only light in the world. Everything feels quiet, expensive, and precise: huge empty space, few words, perfect motion.

---

## ⚡ Tech Stack & Architecture

- **Vanilla HTML5, CSS3, & Modern ES6 JavaScript** (Zero frameworks, zero build tools, zero npm packages, zero libraries).
- **Canvas Scrollytelling Engine**: Scroll-scrubbed image sequences drawn on `<canvas>` with devicePixelRatio scaling (capped at 2), automatic nearest-frame fallback, and cover/contain fitting.
- **Design Tokens**:
  - `--asphalt`: `#07080A` (Background)
  - `--bone`: `#EDEAE4` (Primary text)
  - `--xenon`: `#CFE3FF` (Light accent)
  - `--taillight`: `#E1251B` (Micro-accents)
  - `--hairline`: `rgba(237, 234, 228, 0.12)`
- **Typography**: Google Fonts variable `Archivo` (125% width axis), `Inter`, and `JetBrains Mono`.
- **Strict Aesthetics**: Zero gradients, zero glassmorphism, zero drop shadows/glows, and flat geometric cards.

---

## 🌐 Site Sections

1. **Preloader Screen**: Black canvas, centered wordmark, thin xenon line growing outward with mono counter (`000–100`).
2. **Hero Scrollytelling (600vh)**:
   - Fullscreen sticky canvas scrubbing 90 joined continuous WebP frames.
   - Text chapters positioned in the empty night sky.
   - Live telemetry HUD (000 → 118 KM/H, 0.0 → 4.2 KM, chapter indicator with red tick).
   - Bottom 1px xenon scroll progress line.
   - Smooth fade to black over the last 5% of scroll.
3. **Engineering Statement (100vh)**:
   - Scroll-driven word-by-word reveal (15% → 100% opacity) of the core philosophy.
4. **Dismantle Scrollytelling (350vh)**:
   - Sticky canvas taking the car apart and reassembling on reverse scroll.
   - 4 interactive callouts fading in after 70% progress with 1px hairlines and mono labels.
5. **Vehicle Lineup (100vh)**:
   - 5 full-height interactive accordion slides (`GT-E`, `S`, `X`, `R`, `ONE`).
   - Closed state: 12vw with vertical mono text and cropped preview.
   - Open state: 52vw with full-color car driving in, specs, finish swatches, and configure link.
   - Debounced hover (80ms), keyboard accessibility, and responsive mobile stacking.
6. **Reserve & Atelier (100vh)**:
   - Minimal reservation interface with reactive button states and taillight accent.
7. **Global Headlight Cursor**:
   - 6px xenon dot inside a 28px ring with lerp smoothing (`0.18`), morphing into a 44×2px light bar with contextual mono tags (`VIEW`, `RESERVE`, `OPEN`, `CONFIGURE`).
8. **Film Grain**:
   - Offscreen noise canvas shifted ~8 times per second at 3.5% opacity with no vignette.

---

## 🚀 Running Locally

Serve the directory with any local static HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve . -l 8000
```

Then visit:
```
http://localhost:8000/
```
