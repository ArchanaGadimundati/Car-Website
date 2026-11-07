/**
 * NOCTIS — Scrollytelling Engine & Interactions
 * Vanilla JavaScript, zero libraries, zero npm dependencies.
 */

(function () {
  'use strict';

  const cfg = window.NOCTIS_CONFIG;
  if (!cfg) {
    console.error('NOCTIS_CONFIG not found.');
    return;
  }

  // Feature detection
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  // Global state
  const state = {
    isMobile: window.innerWidth < 768,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    heroLoadedCount: 0,
    dismantleLoadedCount: 0,
    isInitialPreloaded: false,
    heroFrames: [],
    dismantleFrames: [],
    heroProgress: 0,
    dismantleProgress: 0,
    heroCurrentFrame: 0,
    dismantleCurrentFrame: 0,
    lastHeroDrawn: -1,
    lastDismantleDrawn: -1,
    activeLineupIndex: 0
  };

  /* ==========================================================================
     1. PRELOADER & IMAGE CACHE
     ========================================================================== */

  const preloaderEl = document.getElementById('preloader');
  const preloaderLine = document.getElementById('preloader-line');
  const preloaderCounter = document.getElementById('preloader-counter');

  function getFrameUrl(type, index) {
    const isMob = state.isMobile;
    const padIndex = String(index).padStart(4, '0');
    if (type === 'hero') {
      const template = isMob ? cfg.hero.mobilePath : cfg.hero.desktopPath;
      return template.replace('{index}', padIndex);
    } else {
      const template = isMob ? cfg.dismantle.mobilePath : cfg.dismantle.desktopPath;
      return template.replace('{index}', padIndex);
    }
  }

  function preloadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      if (img.decode) {
        img.decode()
          .then(() => resolve(img))
          .catch(() => {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
          });
      } else {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      }
    });
  }

  function startPreloading() {
    const initialTarget = cfg.motion.initialPreloadCount;
    let loadedInitial = 0;

    // 1. Preload first N hero frames for initial page reveal
    const initialPromises = [];
    for (let i = 1; i <= initialTarget; i++) {
      const p = preloadImage(getFrameUrl('hero', i)).then((img) => {
        state.heroFrames[i - 1] = img;
        loadedInitial++;
        const pct = Math.min(100, Math.round((loadedInitial / initialTarget) * 100));
        updatePreloaderUI(pct);
      });
      initialPromises.push(p);
    }

    Promise.all(initialPromises).then(() => {
      // Reveal page
      finishPreloader();

      // 2. Background-load remaining hero frames (41..90)
      loadRemainingHero();
    });
  }

  function updatePreloaderUI(percent) {
    if (preloaderLine) {
      preloaderLine.style.transform = `scaleX(${percent / 100})`;
    }
    if (preloaderCounter) {
      preloaderCounter.textContent = String(percent).padStart(3, '0');
    }
  }

  function finishPreloader() {
    state.isInitialPreloaded = true;
    if (preloaderLine) {
      preloaderLine.classList.add('is-bright');
    }

    setTimeout(() => {
      if (preloaderEl) {
        preloaderEl.classList.add('is-hidden');
      }
      document.body.classList.remove('is-loading');

      // Trigger initial draws
      requestAnimationFrame(() => {
        renderHeroCanvas(true);
        renderDismantleCanvas(true);
      });
    }, 150);
  }

  async function loadRemainingHero() {
    for (let i = cfg.motion.initialPreloadCount + 1; i <= cfg.hero.frameCount; i++) {
      const img = await preloadImage(getFrameUrl('hero', i));
      state.heroFrames[i - 1] = img;
    }
    // 3. Background-load dismantle sequence (1..30)
    loadDismantleFrames();
  }

  async function loadDismantleFrames() {
    for (let i = 1; i <= cfg.dismantle.frameCount; i++) {
      const img = await preloadImage(getFrameUrl('dismantle', i));
      state.dismantleFrames[i - 1] = img;
    }
  }

  function getNearestLoadedFrame(frames, targetIdx, maxCount) {
    if (frames[targetIdx]) return frames[targetIdx];
    // Search outwards
    for (let offset = 1; offset < maxCount; offset++) {
      if (targetIdx - offset >= 0 && frames[targetIdx - offset]) {
        return frames[targetIdx - offset];
      }
      if (targetIdx + offset < maxCount && frames[targetIdx + offset]) {
        return frames[targetIdx + offset];
      }
    }
    return null;
  }

  /* ==========================================================================
     2. FILM-GRAIN OVERLAY (Offscreen noise tile shifted ~8 times/sec)
     ========================================================================== */

  const grainCanvas = document.getElementById('grain-canvas');
  let grainCtx = null;
  let noisePattern = null;

  function initFilmGrain() {
    if (!grainCanvas) return;
    grainCtx = grainCanvas.getContext('2d');

    // Create 128x128 noise pattern tile
    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tileCtx = tile.getContext('2d');
    const imgData = tileCtx.createImageData(128, 128);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const val = (Math.random() * 255) | 0;
      data[i] = val;     // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = (Math.random() * 60) | 0; // Alpha noise
    }
    tileCtx.putImageData(imgData, 0, 0);
    noisePattern = grainCtx.createPattern(tile, 'repeat');

    resizeGrain();
    window.addEventListener('resize', resizeGrain, { passive: true });

    // Shift ~8 times per second (every 125ms)
    setInterval(renderGrain, 125);
  }

  function resizeGrain() {
    if (!grainCanvas || !grainCtx) return;
    grainCanvas.width = window.innerWidth;
    grainCanvas.height = window.innerHeight;
    renderGrain();
  }

  function renderGrain() {
    if (!grainCanvas || !grainCtx || !noisePattern) return;
    grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
    grainCtx.fillStyle = noisePattern;
    const shiftX = (Math.random() * 128) | 0;
    const shiftY = (Math.random() * 128) | 0;
    grainCtx.save();
    grainCtx.translate(shiftX, shiftY);
    grainCtx.fillRect(-shiftX, -shiftY, grainCanvas.width + 128, grainCanvas.height + 128);
    grainCtx.restore();
  }

  /* ==========================================================================
     3. CUSTOM CURSOR ("The Headlight", Desktop Fine Pointers Only)
     ========================================================================== */

  const cursorEl = document.getElementById('cursor');
  const cursorLabel = cursorEl ? cursorEl.querySelector('.cursor-label') : null;
  let mouseX = -100, mouseY = -100;
  let cursorX = -100, cursorY = -100;
  let isCursorHovering = false;

  function initCustomCursor() {
    if (!cursorEl || !isFinePointer || prefersReducedMotion) return;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursorEl.classList.contains('visible')) {
        cursorEl.classList.add('visible');
      }
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      cursorEl.classList.add('is-down');
      setTimeout(() => cursorEl.classList.remove('is-down'), 120);
    });

    document.addEventListener('mouseleave', () => {
      cursorEl.classList.remove('visible');
    });

    // Delegated hover detection for morphing
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (!target) {
        if (isCursorHovering) {
          isCursorHovering = false;
          cursorEl.classList.remove('is-morphed');
          if (cursorLabel) cursorLabel.textContent = '';
        }
        return;
      }

      isCursorHovering = true;
      cursorEl.classList.add('is-morphed');

      let labelText = target.getAttribute('data-cursor') || 'VIEW';
      if (target.classList.contains('lineup-slide')) {
        labelText = target.classList.contains('is-open') ? 'CONFIGURE' : 'OPEN';
      }
      if (cursorLabel) cursorLabel.textContent = labelText;
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target && !e.relatedTarget?.closest('[data-cursor], a, button, .lineup-slide')) {
        isCursorHovering = false;
        cursorEl.classList.remove('is-morphed');
        if (cursorLabel) cursorLabel.textContent = '';
      }
    });

    // Start cursor lerp loop
    requestAnimationFrame(updateCursorLoop);
  }

  function updateCursorLoop() {
    if (cursorEl && isFinePointer && !prefersReducedMotion) {
      cursorX += (mouseX - cursorX) * cfg.motion.cursorLerp;
      cursorY += (mouseY - cursorY) * cfg.motion.cursorLerp;
      cursorEl.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    }
    requestAnimationFrame(updateCursorLoop);
  }

  /* ==========================================================================
     4. HEADER NAV SCROLL HIDE/SHOW
     ========================================================================== */

  const headerEl = document.getElementById('site-header');
  let lastScrollY = 0;

  function initHeaderScroll() {
    if (!headerEl) return;
    window.addEventListener('scroll', () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 100) {
        headerEl.classList.add('is-hidden');
      } else {
        headerEl.classList.remove('is-hidden');
      }
      lastScrollY = currentY;
    }, { passive: true });
  }

  /* ==========================================================================
     5. HERO CANVAS SCROLLYTELLING
     ========================================================================== */

  const heroWrapper = document.getElementById('hero');
  const heroCanvas = document.getElementById('hero-canvas');
  let heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
  const heroProgressLine = document.getElementById('hero-progress-line');
  const hudChapterEl = document.getElementById('hud-chapter');
  const hudSpeedEl = document.getElementById('hud-speed');
  const hudDistEl = document.getElementById('hud-dist');
  const chapterElements = document.querySelectorAll('.hero-chapter');

  function resizeCanvas(canvas, ctx) {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * state.dpr);
    canvas.height = Math.round(rect.height * state.dpr);
  }

  function initHeroCanvas() {
    if (heroWrapper && cfg.hero.heightVh) {
      heroWrapper.style.height = `${cfg.hero.heightVh}vh`;
    }
    if (!heroCanvas || !heroCtx) return;
    resizeCanvas(heroCanvas, heroCtx);
  }

  function updateHeroScroll() {
    if (!heroWrapper) return;
    const rect = heroWrapper.getBoundingClientRect();
    const scrollDist = heroWrapper.offsetHeight - window.innerHeight;
    const rawProgress = scrollDist > 0 ? -rect.top / scrollDist : 0;
    state.heroProgress = Math.max(0, Math.min(1, rawProgress));

    // Update bottom progress bar
    if (heroProgressLine) {
      heroProgressLine.style.transform = `scaleX(${state.heroProgress})`;
    }

    // Update HUD Speed and Distance
    if (hudSpeedEl) {
      const speed = Math.round(state.heroProgress * cfg.hero.hud.maxSpeed);
      hudSpeedEl.textContent = `${String(speed).padStart(3, '0')} KM/H`;
    }
    if (hudDistEl) {
      const dist = (state.heroProgress * cfg.hero.hud.maxDistance).toFixed(1);
      hudDistEl.textContent = `${dist} KM`;
    }

    // Update Chapters & HUD active indicator
    cfg.hero.chapters.forEach((ch, idx) => {
      const inRange = state.heroProgress >= ch.range[0] && state.heroProgress <= ch.range[1];
      const el = chapterElements[idx];
      if (el) {
        if (inRange) {
          el.classList.add('active');
          if (hudChapterEl) hudChapterEl.textContent = ch.hudIndex;
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  function renderHeroCanvas(forceRedraw = false) {
    if (!heroCanvas || !heroCtx) return;

    const targetFrameIdx = Math.round(state.heroProgress * (cfg.hero.frameCount - 1));
    state.heroCurrentFrame += (targetFrameIdx - state.heroCurrentFrame) * cfg.motion.canvasLerp;

    const roundedFrame = Math.round(state.heroCurrentFrame);
    if (!forceRedraw && roundedFrame === state.lastHeroDrawn) return;

    state.lastHeroDrawn = roundedFrame;
    const img = getNearestLoadedFrame(state.heroFrames, roundedFrame, cfg.hero.frameCount);

    const cw = heroCanvas.width;
    const ch = heroCanvas.height;

    heroCtx.fillStyle = '#07080A';
    heroCtx.fillRect(0, 0, cw, ch);

    if (img) {
      drawImageFitted(heroCtx, img, cw, ch);
    }

    // Fade to solid black over last 5% of scroll (0.95 -> 1.00)
    if (state.heroProgress >= cfg.hero.fadeStart) {
      const fadeProgress = (state.heroProgress - cfg.hero.fadeStart) / (cfg.hero.fadeEnd - cfg.hero.fadeStart);
      const alpha = Math.min(1, Math.max(0, fadeProgress));
      heroCtx.fillStyle = `rgba(7, 8, 10, ${alpha})`;
      heroCtx.fillRect(0, 0, cw, ch);
    }
  }

  function drawImageFitted(ctx, img, cw, ch) {
    const isPortrait = ch > cw;
    let scale, dw, dh, dx, dy;

    if (isPortrait) {
      // Contain-fit vertically centered on asphalt
      scale = Math.min(cw / img.width, ch / img.height);
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (cw - dw) / 2;
      dy = (ch - dh) / 2;
    } else {
      // Cover-fit on landscape
      scale = Math.max(cw / img.width, ch / img.height);
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (cw - dw) / 2;
      dy = (ch - dh) / 2;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ==========================================================================
     6. SECTION 2 — STATEMENT WORD-BY-WORD REVEAL
     ========================================================================== */

  const statementSection = document.getElementById('engineering');
  const statementTextEl = document.getElementById('statement-text');
  let statementWords = [];

  function initStatementSection() {
    if (!statementTextEl) return;
    const words = cfg.statement.text.split(' ');
    statementTextEl.innerHTML = words.map(w => `<span class="statement-word">${w}</span>`).join(' ');
    statementWords = statementTextEl.querySelectorAll('.statement-word');
  }

  function updateStatementScroll() {
    if (!statementSection || statementWords.length === 0) return;
    const rect = statementSection.getBoundingClientRect();
    const vh = window.innerHeight;

    // Progress from entering viewport to leaving
    const start = vh * 0.8;
    const end = vh * 0.2;
    const current = rect.top;
    const progress = Math.max(0, Math.min(1, (start - current) / (start - end)));

    const count = statementWords.length;
    statementWords.forEach((wordEl, idx) => {
      const wordThreshold = idx / (count - 1);
      if (progress >= wordThreshold) {
        wordEl.style.opacity = '1';
      } else {
        wordEl.style.opacity = '0.15';
      }
    });
  }

  /* ==========================================================================
     7. SECTION 3 — DISMANTLE CANVAS & CALLOUTS
     ========================================================================== */

  const dismantleWrapper = document.getElementById('dismantle');
  const dismantleCanvas = document.getElementById('dismantle-canvas');
  let dismantleCtx = dismantleCanvas ? dismantleCanvas.getContext('2d') : null;
  const dismantleProgressLine = document.getElementById('dismantle-progress-line');
  const calloutsContainer = document.getElementById('dismantle-callouts');
  let calloutEls = [];

  function initDismantleCallouts() {
    if (!calloutsContainer) return;
    calloutsContainer.innerHTML = '';

    cfg.dismantle.callouts.forEach(c => {
      const div = document.createElement('div');
      div.className = 'dismantle-callout';
      div.id = `callout-${c.id}`;
      div.style.left = `${c.x}%`;
      div.style.top = `${c.y}%`;
      div.innerHTML = `
        <span class="callout-dot"></span>
        <span class="callout-line"></span>
        <div class="callout-content">
          <div class="callout-title">${c.title}</div>
          <p class="callout-desc">${c.desc}</p>
        </div>
      `;
      calloutsContainer.appendChild(div);
      calloutEls.push({ el: div, start: c.startProgress });
    });
  }

  function initDismantleCanvas() {
    if (dismantleWrapper && cfg.dismantle.heightVh) {
      dismantleWrapper.style.height = `${cfg.dismantle.heightVh}vh`;
    }
    if (!dismantleCanvas || !dismantleCtx) return;
    resizeCanvas(dismantleCanvas, dismantleCtx);
  }

  function updateDismantleScroll() {
    if (!dismantleWrapper) return;
    const rect = dismantleWrapper.getBoundingClientRect();
    const scrollDist = dismantleWrapper.offsetHeight - window.innerHeight;
    const rawProgress = scrollDist > 0 ? -rect.top / scrollDist : 0;
    state.dismantleProgress = Math.max(0, Math.min(1, rawProgress));

    // Update bottom progress line
    if (dismantleProgressLine) {
      dismantleProgressLine.style.transform = `scaleX(${state.dismantleProgress})`;
    }

    // Update callouts visibility after 70%
    calloutEls.forEach(item => {
      if (state.dismantleProgress >= item.start) {
        item.el.classList.add('active');
      } else {
        item.el.classList.remove('active');
      }
    });
  }

  function renderDismantleCanvas(forceRedraw = false) {
    if (!dismantleCanvas || !dismantleCtx) return;

    const targetFrameIdx = Math.round(state.dismantleProgress * (cfg.dismantle.frameCount - 1));
    state.dismantleCurrentFrame += (targetFrameIdx - state.dismantleCurrentFrame) * cfg.motion.canvasLerp;

    const roundedFrame = Math.round(state.dismantleCurrentFrame);
    if (!forceRedraw && roundedFrame === state.lastDismantleDrawn) return;

    state.lastDismantleDrawn = roundedFrame;
    const img = getNearestLoadedFrame(state.dismantleFrames, roundedFrame, cfg.dismantle.frameCount);

    const cw = dismantleCanvas.width;
    const ch = dismantleCanvas.height;

    dismantleCtx.fillStyle = '#07080A';
    dismantleCtx.fillRect(0, 0, cw, ch);

    if (img) {
      drawImageFitted(dismantleCtx, img, cw, ch);
    }
  }

  /* ==========================================================================
     8. SECTION 4 — LINEUP ACCORDION
     ========================================================================== */

  const lineupSection = document.getElementById('models');
  const lineupContainer = document.getElementById('lineup-accordion');
  let lineupSlides = [];
  let hoverDebounceTimer = null;

  function initLineupAccordion() {
    if (!lineupContainer) return;
    lineupContainer.innerHTML = '';

    cfg.lineup.models.forEach((m, idx) => {
      const isOpen = idx === 0;
      const slide = document.createElement('article');
      slide.className = `lineup-slide ${isOpen ? 'is-open' : ''}`;
      slide.setAttribute('role', 'button');
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      slide.setAttribute('aria-label', `${m.name} — ${m.subtitle}`);
      slide.dataset.index = idx;

      // Swatches HTML
      const swatchesHtml = m.colors.map((c, cIdx) => `
        <button type="button" class="color-swatch ${cIdx === 0 ? 'active' : ''}"
          style="background-color: ${c.hex};"
          aria-label="${c.name}"
          data-color="${c.name}"
          data-model="${m.id}"></button>
      `).join('');

      slide.innerHTML = `
        <!-- Closed View -->
        <div class="slide-closed-view" aria-hidden="${isOpen ? 'true' : 'false'}">
          <span class="slide-num">${m.index}</span>
          <span class="slide-vertical-name">${m.name}</span>
          <img src="${m.image}" alt="" class="slide-closed-crop-img" loading="lazy">
        </div>

        <!-- Open View -->
        <div class="slide-open-view" aria-hidden="${isOpen ? 'false' : 'true'}">
          <div class="slide-open-header">
            <span class="slide-num">${m.index}</span>
            <div class="line-mask"><h3 class="slide-open-title">${m.name}</h3></div>
          </div>

          <div class="slide-car-stage">
            <img src="${m.image}" alt="${m.alt}" class="slide-full-car-img" loading="lazy">
          </div>

          <div class="slide-open-footer">
            <div class="line-mask"><p class="slide-tagline">${m.subtitle}</p></div>
            <div class="line-mask">
              <div class="slide-specs-row">
                <div class="spec-col">
                  <span class="spec-col-label">RANGE</span>
                  <span>${m.specs.range}</span>
                </div>
                <div class="spec-col">
                  <span class="spec-col-label">0–100 KM/H</span>
                  <span>${m.specs.accel}</span>
                </div>
                <div class="spec-col">
                  <span class="spec-col-label">POWER</span>
                  <span>${m.specs.power}</span>
                </div>
              </div>
            </div>
            <div class="line-mask">
              <div class="slide-swatches-row" role="group" aria-label="Available Finishes">
                ${swatchesHtml}
              </div>
            </div>
            <div class="line-mask">
              <a href="#reserve" class="slide-configure-link" data-cursor="RESERVE">Configure ${m.name} →</a>
            </div>
          </div>
        </div>
      `;

      // Swatch click handlers
      const swatches = slide.querySelectorAll('.color-swatch');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.stopPropagation();
          swatches.forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
        });
      });

      // Desktop Hover with 80ms debounce
      slide.addEventListener('mouseenter', () => {
        if (state.isMobile) return;
        clearTimeout(hoverDebounceTimer);
        hoverDebounceTimer = setTimeout(() => {
          setActiveSlide(idx);
        }, cfg.lineup.hoverDebounceMs);
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(hoverDebounceTimer);
      });

      // Click / Tap
      slide.addEventListener('click', () => {
        setActiveSlide(idx);
      });

      // Keyboard support
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveSlide(idx);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (idx + 1) % cfg.lineup.models.length;
          setActiveSlide(next);
          lineupSlides[next]?.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (idx - 1 + cfg.lineup.models.length) % cfg.lineup.models.length;
          setActiveSlide(prev);
          lineupSlides[prev]?.focus();
        }
      });

      lineupContainer.appendChild(slide);
      lineupSlides.push(slide);
    });

    // Observer for staggered entrance animation
    if (lineupSection) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            lineupSection.classList.add('in-view');
            obs.unobserve(lineupSection);
          }
        });
      }, { threshold: 0.15 });
      obs.observe(lineupSection);
    }
  }

  function setActiveSlide(targetIdx) {
    if (state.activeLineupIndex === targetIdx) return;
    state.activeLineupIndex = targetIdx;

    lineupSlides.forEach((slide, idx) => {
      const isOpen = idx === targetIdx;
      slide.classList.toggle('is-open', isOpen);
      slide.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      const closedView = slide.querySelector('.slide-closed-view');
      const openView = slide.querySelector('.slide-open-view');
      if (closedView) closedView.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
      if (openView) openView.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });

    // Update cursor label if mouse is over slide
    if (cursorLabel && isCursorHovering) {
      cursorLabel.textContent = 'CONFIGURE';
    }
  }

  /* ==========================================================================
     9. ANIMATION LOOP
     ========================================================================== */

  function mainRenderLoop() {
    if (state.isInitialPreloaded) {
      renderHeroCanvas();
      renderDismantleCanvas();
    }
    requestAnimationFrame(mainRenderLoop);
  }

  /* ==========================================================================
     10. WINDOW EVENTS & INITIALIZATION
     ========================================================================== */

  function handleScroll() {
    updateHeroScroll();
    updateStatementScroll();
    updateDismantleScroll();
  }

  function handleResize() {
    state.isMobile = window.innerWidth < 768;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (heroCanvas && heroCtx) resizeCanvas(heroCanvas, heroCtx);
    if (dismantleCanvas && dismantleCtx) resizeCanvas(dismantleCanvas, dismantleCtx);

    handleScroll();
    renderHeroCanvas(true);
    renderDismantleCanvas(true);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initFilmGrain();
    initCustomCursor();
    initHeaderScroll();
    initHeroCanvas();
    initStatementSection();
    initDismantleCanvas();
    initDismantleCallouts();
    initLineupAccordion();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initial positioning
    handleScroll();

    // Start image preloading sequence
    startPreloading();

    // Launch RAF loop
    requestAnimationFrame(mainRenderLoop);
  });

})();
