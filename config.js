/**
 * NOCTIS Configuration
 * All scrollytelling thresholds, section heights, frame paths, and component settings.
 */

window.NOCTIS_CONFIG = {
  // Brand details
  brand: {
    name: "NOCTIS",
    tagline: "The city is asleep. It brings its own light.",
    year: "2026"
  },

  // Motion physics & interpolation
  motion: {
    canvasLerp: 0.15,      // Frame interpolation smoothing factor
    cursorLerp: 0.18,      // Custom cursor follow smoothing factor
    initialPreloadCount: 40 // First N hero frames required before revealing page
  },

  // Section 1: Hero
  hero: {
    heightVh: 600,         // Stage scroll wrapper height in vh
    frameCount: 90,        // Real frame count
    desktopPath: "assets/frames/hero/frame_{index}.webp",
    mobilePath: "assets/frames/hero-mobile/frame_{index}.webp",
    fadeStart: 0.95,       // Scroll progress at which canvas fades to black
    fadeEnd: 1.00,
    hud: {
      maxSpeed: 118,       // KM/H
      maxDistance: 4.2      // KM
    },
    chapters: [
      {
        id: "intro",
        range: [0.00, 0.12],
        title: "NOCTIS",
        subtitle: "The city is asleep.",
        hint: "SCROLL TO WAKE IT",
        hudIndex: "01/04"
      },
      {
        id: "absence",
        range: [0.22, 0.40],
        quote: "It doesn't need the city's light.",
        hudIndex: "02/04"
      },
      {
        id: "presence",
        range: [0.50, 0.68],
        quote: "It brings its own.",
        hudIndex: "03/04"
      },
      {
        id: "specs",
        range: [0.80, 1.00],
        model: "GT-E",
        specs: "0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR",
        cta: "Discover the GT-E",
        ctaHref: "#models",
        hudIndex: "04/04"
      }
    ]
  },

  // Section 2: Statement (word-by-word reveal)
  statement: {
    label: "02 — ENGINEERING",
    text: "Every part was designed to disappear into one line of light."
  },

  // Section 3: Dismantle
  dismantle: {
    heightVh: 350,         // Stage scroll wrapper height in vh
    frameCount: 30,        // Real frame count
    desktopPath: "assets/frames/dismantle/frame_{index}.webp",
    mobilePath: "assets/frames/dismantle-mobile/frame_{index}.webp",
    title: "Look closer.",
    calloutsStart: 0.70,   // Scroll progress after which callouts begin appearing
    callouts: [
      {
        id: "body",
        title: "BODY",
        desc: "Carbon composite monocoque",
        x: 36, // percentage of stage width
        y: 32, // percentage of stage height
        startProgress: 0.70
      },
      {
        id: "light",
        title: "LIGHT",
        desc: "Single-line LED signature",
        x: 22,
        y: 46,
        startProgress: 0.77
      },
      {
        id: "battery",
        title: "BATTERY",
        desc: "110 kWh structural pack",
        x: 52,
        y: 64,
        startProgress: 0.84
      },
      {
        id: "drive",
        title: "DRIVE",
        desc: "Dual axial-flux motors, 680 kW",
        x: 74,
        y: 52,
        startProgress: 0.91
      }
    ]
  },

  // Section 4: Lineup Accordion
  lineup: {
    label: "03 — THE LINEUP",
    headline: "Five ways to drive the night.",
    hoverDebounceMs: 80,
    models: [
      {
        id: "gt-e",
        index: "01",
        name: "GT-E",
        subtitle: "The grand tourer.",
        specs: {
          range: "640 KM",
          accel: "3.1 S",
          power: "680 KW"
        },
        image: "assets/cars/gt-e.webp",
        alt: "NOCTIS GT-E matte graphite grand tourer coupe side profile",
        colors: [
          { name: "Matte Graphite", hex: "#17181C" },
          { name: "Obsidian", hex: "#0B0C0E" },
          { name: "Satin Bone", hex: "#EDEAE4" },
          { name: "Crimson Red", hex: "#E1251B" }
        ]
      },
      {
        id: "s",
        index: "02",
        name: "S",
        subtitle: "Four doors, no compromise.",
        specs: {
          range: "600 KM",
          accel: "3.6 S",
          power: "520 KW"
        },
        image: "assets/cars/s.webp",
        alt: "NOCTIS S satin bone white sport sedan side profile",
        colors: [
          { name: "Satin Bone", hex: "#EDEAE4" },
          { name: "Carbon Grey", hex: "#1F2126" },
          { name: "Asphalt Black", hex: "#07080A" },
          { name: "Deep Navy", hex: "#151C28" }
        ]
      },
      {
        id: "x",
        index: "03",
        name: "X",
        subtitle: "Higher, never heavier.",
        specs: {
          range: "560 KM",
          accel: "4.2 S",
          power: "480 KW"
        },
        image: "assets/cars/x.webp",
        alt: "NOCTIS X midnight blue coupe SUV side profile",
        colors: [
          { name: "Midnight Blue", hex: "#0E1524" },
          { name: "Basalt Grey", hex: "#22252B" },
          { name: "Satin Bone", hex: "#EDEAE4" },
          { name: "Nordic Silver", hex: "#8A8F98" }
        ]
      },
      {
        id: "r",
        index: "04",
        name: "R",
        subtitle: "Built for the track.",
        specs: {
          range: "420 KM",
          accel: "2.4 S",
          power: "900 KW"
        },
        image: "assets/cars/r.webp",
        alt: "NOCTIS R satin black track coupe with fixed rear wing and red accents",
        colors: [
          { name: "Satin Black", hex: "#0D0E11" },
          { name: "Taillight Red", hex: "#E1251B" },
          { name: "Raw Carbon", hex: "#1A1A1A" },
          { name: "Stark White", hex: "#F5F5F7" }
        ]
      },
      {
        id: "one",
        index: "05",
        name: "ONE",
        subtitle: "The future, early.",
        specs: {
          range: "CONCEPT",
          accel: "CONCEPT",
          power: "CONCEPT"
        },
        image: "assets/cars/one.webp",
        alt: "NOCTIS ONE liquid silver concept hypercar side profile",
        colors: [
          { name: "Liquid Silver", hex: "#C8CED6" },
          { name: "Void Black", hex: "#040405" },
          { name: "Xenon Blue", hex: "#CFE3FF" },
          { name: "Titanium Matte", hex: "#484D55" }
        ]
      }
    ]
  },

  // Section 5: Reserve
  reserve: {
    headline: "Drive the night.",
    body: "Hand-commissioned allocations for the 2027 production run are now open.",
    buttonText: "RESERVE YOUR NOCTIS"
  }
};

