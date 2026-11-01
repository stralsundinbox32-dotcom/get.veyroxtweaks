/* =============================================================
   VEYROX TWEAKS — site interactions
   Vanilla JS, no dependencies. Every continuous effect is gated
   by IntersectionObserver / page visibility and respects
   prefers-reduced-motion.
   ============================================================= */
(() => {
  'use strict';

  const CFG = window.VEYROX_CONFIG || {};
  const REL = CFG.release || {};
  const TWEAKS = window.VEYROX_TWEAKS || [];
  const CATS = window.VEYROX_CATEGORIES || [];

  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  const mqPin = matchMedia('(min-width: 1024px) and (min-height: 600px)');
  const mqMobile = matchMedia('(max-width: 1023px)');
  const motionOK = () => !mqReduce.matches;
  const onMq = (mq, fn) => (mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener(fn));

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const fmtSize = b => (Math.floor((b / 1048576) * 10) / 10).toFixed(1) + ' MB';
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  /* ---------------------------------------------------------
     Config → DOM (release facts, download links, brand)
     --------------------------------------------------------- */
  function applyConfig() {
    const values = {
      version: REL.version,
      fileVersion: REL.fileVersion,
      fileName: REL.fileName,
      size: REL.sizeBytes ? fmtSize(REL.sizeBytes) : null,
      bytes: REL.sizeBytes ? REL.sizeBytes.toLocaleString('en-US') : null,
      sha256: REL.sha256
    };
    $$('[data-config]').forEach(el => {
      const v = values[el.dataset.config];
      if (v) el.textContent = v;
    });
    if (REL.filePath) {
      $$('[data-download]').forEach(a => {
        a.setAttribute('href', REL.filePath);
        if (REL.fileName) a.setAttribute('download', REL.fileName);
      });
    }
    const cmd = $('#verify-cmd');
    if (cmd && REL.fileName) cmd.textContent = `Get-FileHash .\\${REL.fileName} -Algorithm SHA256`;
    const brand = CFG.brand || {};
    $$('[data-brand]').forEach(el => {
      const v = brand[el.dataset.brand];
      if (v) el.textContent = v;
    });
  }

  /* ---------------------------------------------------------
     Community links — only real, configured URLs are rendered
     --------------------------------------------------------- */
  const SOCIAL = {
    discord: ['discord', 'Discord'], tiktok: ['tiktok', 'TikTok'], youtube: ['youtube', 'YouTube'],
    x: ['xlogo', 'X'], github: ['github', 'GitHub'], email: ['mail', 'Email']
  };
  const safeUrl = u => {
    try {
      const url = new URL(u, location.href);
      return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
    } catch (e) { return null; }
  };
  function applyLinks() {
    const L = CFG.links || {};
    const discord = L.discord ? safeUrl(L.discord) : null;
    $$('[data-link="discord"]').forEach(a => {
      if (discord) {
        a.href = discord; a.target = '_blank'; a.rel = 'noopener';
        a.removeAttribute('aria-disabled');
        const label = $('[data-link-label]', a);
        if (label) label.textContent = 'Join the Discord';
      } else {
        a.addEventListener('click', e => { e.preventDefault(); toast('The Discord invite link has not been published yet.', 'info'); });
      }
    });
    $$('[data-socials]').forEach(ul => {
      ul.innerHTML = Object.keys(SOCIAL).filter(k => L[k]).map(k => {
        let u = L[k];
        if (k === 'email' && !/^mailto:/i.test(u)) u = 'mailto:' + u;
        u = safeUrl(u);
        if (!u) return '';
        const [ic, label] = SOCIAL[k];
        const ext = k !== 'email' ? ' target="_blank" rel="noopener"' : '';
        return `<li><a href="${esc(u)}" aria-label="${label}"${ext}>${icon(ic)}</a></li>`;
      }).join('');
    });
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg, kind = 'ok') {
    if (!toastEl) return;
    toastEl.innerHTML = icon(kind === 'info' ? 'info' : 'check') + `<span>${esc(msg)}</span>`;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 3400);
  }

  /* ---------------------------------------------------------
     Loader — the app's login widget growing into the page
     --------------------------------------------------------- */
  function runPreloader() {
    const el = $('#preloader');
    if (!el) return Promise.resolve();
    const seen = store.get('vx-intro') === '1';
    store.set('vx-intro', '1');
    if (seen || !motionOK()) { el.remove(); return Promise.resolve(); }

    const step = $('.preloader__step', el);
    const steps = ((step && step.dataset.steps) || '').split('|').filter(Boolean);
    let i = 0;
    const iv = setInterval(() => { if (step && i < steps.length) step.textContent = steps[i++]; }, 360);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(2200)]) : Promise.resolve();

    return Promise.all([wait(1300), fonts]).then(() => {
      clearInterval(iv);
      const card = $('.preloader__card', el);
      const r = card.getBoundingClientRect();
      const s = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.2;
      card.style.setProperty('--s', s.toFixed(2));
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 1300);
      return wait(380);
    });
  }

  /* ---------------------------------------------------------
     Header: scrolled state, hide on scroll down, nav indicator
     --------------------------------------------------------- */
  const header = $('.site-header');
  const nav = $('.nav');
  const indicator = $('.nav__indicator');
  const navLinks = $$('.nav__link');
  let activeKey = 'home';
  let lastY = scrollY;
  let menuOpen = false;

  function moveIndicator(link) {
    if (!indicator || !nav || !link) return;
    const nr = nav.getBoundingClientRect();
    const lr = link.getBoundingClientRect();
    if (!lr.width) return;
    indicator.style.setProperty('--x', (lr.left - nr.left).toFixed(1) + 'px');
    indicator.style.setProperty('--w', lr.width.toFixed(1) + 'px');
    indicator.classList.add('is-on');
  }
  function setActive(key) {
    activeKey = key;
    navLinks.forEach(a => {
      const on = a.dataset.section === key;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    moveIndicator(navLinks.find(a => a.dataset.section === key));
  }
  function initNav() {
    navLinks.forEach(a => a.addEventListener('pointerenter', () => moveIndicator(a)));
    if (nav) nav.addEventListener('pointerleave', () => moveIndicator(navLinks.find(a => a.dataset.section === activeKey)));
    if (header) header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

    const MAP = {
      home: 'home', proof: 'home', features: 'features', showcase: 'features', tweaks: 'tweaks',
      security: 'security', download: 'download', install: 'download', 'whats-new': 'download', faq: 'faq'
    };
    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) setActive(MAP[en.target.id] || 'home'); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(MAP).forEach(id => { const s = document.getElementById(id); if (s) spy.observe(s); });
    }
    setActive('home');
  }
  function updateHeader(y) {
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 24);
    const dy = y - lastY;
    if (y > 720 && dy > 6 && !menuOpen && !header.contains(document.activeElement)) header.classList.add('is-hidden');
    else if (dy < -6 || y < 720) header.classList.remove('is-hidden');
    lastY = y;
  }

  /* ---------------------------------------------------------
     Mobile menu (clip-path reveal, focus trap, Esc)
     --------------------------------------------------------- */
  function initMenu() {
    const toggle = $('.menu-toggle');
    const menu = $('#mobile-menu');
    if (!toggle || !menu) return;
    let closeTimer;
    const setMenu = open => {
      if (open === menuOpen) return;
      menuOpen = open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      root.classList.toggle('menu-open', open);
      clearTimeout(closeTimer);
      if (open) {
        menu.hidden = false;
        header.classList.remove('is-hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
        setTimeout(() => { const a = $('a', menu); if (a && menuOpen) a.focus({ preventScroll: true }); }, 350);
      } else {
        menu.classList.remove('is-open');
        closeTimer = setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 700);
      }
    };
    toggle.addEventListener('click', () => setMenu(!menuOpen));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => {
      if (!menuOpen) return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
      if (e.key === 'Tab') {
        const f = [toggle, ...$$('a', menu)];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    onMq(mqMobile, e => { if (!e.matches) setMenu(false); });
  }

  /* ---------------------------------------------------------
     Reveal on scroll, counters, install line
     --------------------------------------------------------- */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    root.classList.add('reveal-ready');
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('[data-reveal], [data-steps]').forEach(el => io.observe(el));

    const counters = $$('[data-count]');
    const cio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        const el = en.target;
        const to = parseInt(el.dataset.count, 10);
        if (!motionOK() || !to) { el.textContent = String(to); return; }
        const t0 = performance.now();
        const dur = 1200 + to * 25;
        const tick = now => {
          const t = clamp((now - t0) / dur);
          el.textContent = String(Math.round(easeOut(t) * to));
          if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
      });
    }, { threshold: .6 });
    counters.forEach(el => cio.observe(el));
  }

  /* pause CSS ambience (aurora, rings, glows) while a section is off-screen */
  function initOffscreen() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => en.target.classList.toggle('is-offscreen', !en.isIntersecting));
    }, { rootMargin: '160px 0px' });
    $$('.hero, .features, .showcase, .security, .download').forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Particles (hero only; stops when hidden / off-screen)
     --------------------------------------------------------- */
  function createParticles(canvas) {
    const noop = { resize() {}, setVisible() {}, pointer() {} };
    if (!canvas || !canvas.getContext) return noop;
    const ctx = canvas.getContext('2d');
    if (!ctx) return noop;
    const COLORS = ['125,162,255', '160,130,255', '46,230,200', '230,234,242'];
    let w = 0, h = 0, parts = [], running = false, visible = true, raf = 0;
    const ptr = { x: -1e4, y: -1e4 };

    const spawn = any => ({
      x: Math.random() * w,
      y: any ? Math.random() * h : h + 8,
      r: Math.random() * 1.3 + .35,
      vx: (Math.random() - .5) * .08,
      vy: -(Math.random() * .22 + .04),
      a: Math.random() * .55 + .2,
      ph: Math.random() * Math.PI * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0]
    });
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (running) {
          p.x += p.vx; p.y += p.vy;
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const d = Math.sqrt(d2) + .001, f = (1 - d2 / 16000) * 1.1;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
          if (p.y < -10 || p.x < -10 || p.x > w + 10) Object.assign(p, spawn(false));
        }
        ctx.globalAlpha = p.a * (.55 + .45 * Math.sin(t * .0012 + p.ph));
        ctx.fillStyle = `rgb(${p.c})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    function sync() {
      const should = visible && !document.hidden && motionOK();
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (!should && running) { running = false; cancelAnimationFrame(raf); }
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: Math.min(90, Math.round((w * h) / 17000)) }, () => spawn(true));
      if (!running) draw(0);
      sync();
    }
    document.addEventListener('visibilitychange', sync);
    onMq(mqReduce, sync);
    return {
      resize,
      setVisible(v) { visible = v; sync(); },
      pointer(x, y) { ptr.x = x; ptr.y = y; }
    };
  }

  /* ---------------------------------------------------------
     HERO — pinned scroll scene + pointer parallax
     --------------------------------------------------------- */
  function createHero() {
    const hero = $('[data-hero]');
    if (!hero) return null;
    const copy = $('.hero__copy', hero);
    const visual = $('.hero__visual', hero);
    const scene = $('.hero__scene', hero);
    const cards = $$('.float-card', hero);
    const canvas = $('.particles', hero);
    const particles = createParticles(canvas);
    const W = 1080, H = 640;
    let pinned = false, m = {}, mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0, visible = true;

    // direction each card drifts to as the window settles
    const dirs = cards.map(c => {
      const cx = c.offsetLeft + c.offsetWidth / 2, cy = c.offsetTop + c.offsetHeight / 2;
      return { x: Math.sign(cx - W / 2) || 1, y: Math.sign(cy - H / 2) || 1, d: parseFloat(c.dataset.depth) || 1 };
    });

    function progress() {
      const r = hero.getBoundingClientRect();
      const total = hero.offsetHeight - innerHeight;
      return total > 0 ? clamp(-r.top / total) : 0;
    }

    function layout() {
      pinned = mqPin.matches && motionOK();
      hero.classList.toggle('is-pinned', pinned);
      if (!pinned) {
        scene.style.transform = '';
        copy.style.opacity = ''; copy.style.transform = ''; copy.style.visibility = '';
        visual.style.setProperty('--fit', (visual.clientWidth / W).toFixed(4));
      } else {
        const vw = innerWidth, vh = innerHeight;
        m = {
          s0: clamp((vw * .5) / W, .42, .78),
          x0: vw * .27 + 36,
          y0: vh * .045,
          s1: Math.min((vw * .78) / W, (vh * .66) / H, 1.05),
          y1: vh * .04
        };
      }
      particles.resize();
      update();
    }

    function update() {
      if (!pinned) {
        cards.forEach((c, i) => {
          c.style.setProperty('--px', (mx * 10 * dirs[i].d).toFixed(1) + 'px');
          c.style.setProperty('--py', (my * 8 * dirs[i].d).toFixed(1) + 'px');
        });
        return;
      }
      const p = progress();
      const e = easeInOut(clamp(p / .8));
      const s = lerp(m.s0, m.s1, e);
      const x = lerp(m.x0, 0, e) + mx * 14;
      const y = lerp(m.y0, m.y1, e) + my * 10;
      const ry = lerp(-24, 0, e) + mx * 4;
      const rx = lerp(10, 0, e) - my * 3;
      scene.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

      const co = 1 - clamp(p / .3);
      copy.style.opacity = co.toFixed(3);
      copy.style.transform = `translate3d(0, ${(-p * 160).toFixed(1)}px, 0)`;
      copy.style.visibility = co < .02 ? 'hidden' : '';

      const spread = easeOut(clamp((p - .3) / .55));
      cards.forEach((c, i) => {
        const d = dirs[i];
        c.style.setProperty('--fx', (d.x * spread * 34 * d.d).toFixed(1) + 'px');
        c.style.setProperty('--fy', (d.y * spread * 26 * d.d).toFixed(1) + 'px');
        c.style.setProperty('--px', (mx * 16 * d.d).toFixed(1) + 'px');
        c.style.setProperty('--py', (my * 12 * d.d).toFixed(1) + 'px');
      });
      hero.style.setProperty('--note-o', clamp((p - .55) / .2).toFixed(2));
      hero.style.setProperty('--cue-o', (1 - clamp(p / .06)).toFixed(2));
    }

    function step() {
      raf = 0;
      mx += (tmx - mx) * .08;
      my += (tmy - my) * .08;
      update();
      if (Math.abs(tmx - mx) > .002 || Math.abs(tmy - my) > .002) raf = requestAnimationFrame(step);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    hero.addEventListener('pointermove', e => {
      if (!mqFine.matches || !motionOK()) return;
      tmx = (e.clientX / innerWidth) * 2 - 1;
      tmy = (e.clientY / innerHeight) * 2 - 1;
      const r = canvas.getBoundingClientRect();
      particles.pointer(e.clientX - r.left, e.clientY - r.top);
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tmx = 0; tmy = 0; particles.pointer(-1e4, -1e4); kick(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; particles.setVisible(visible); }).observe(hero);
    }

    return { layout, update, get visible() { return visible; } };
  }

  /* ---------------------------------------------------------
     SECURITY — pinned four-step story
     --------------------------------------------------------- */
  function createStory() {
    const story = $('[data-story]');
    if (!story) return null;
    const steps = $$('.story__step', story);
    const scenes = $$('.story__scene', story);
    const bgs = $$('.story__bg i', story);
    const bar = $('.story__progress i', story);
    let pinned = false, idx = -1, visible = false;

    const setIdx = i => {
      if (i === idx) return;
      idx = i;
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      scenes.forEach((s, k) => s.classList.toggle('is-active', k === i));
      bgs.forEach((b, k) => b.classList.toggle('is-on', k === i));
    };
    function update() {
      if (!pinned) return;
      const r = story.getBoundingClientRect();
      const total = story.offsetHeight - innerHeight;
      const p = total > 0 ? clamp(-r.top / total) : 0;
      setIdx(Math.min(steps.length - 1, Math.floor(p * steps.length)));
      if (bar) bar.style.setProperty('--sp', p.toFixed(3));
    }
    function layout() {
      pinned = mqPin.matches && motionOK();
      story.classList.toggle('is-pinned', pinned);
      idx = -1;
      if (pinned) { update(); }
      else {
        steps.forEach(s => s.classList.add('is-active'));
        scenes.forEach(s => s.classList.add('is-active'));
        bgs.forEach((b, k) => b.classList.toggle('is-on', k === 0));
      }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) update(); }).observe(story);
    }
    return { layout, update, get visible() { return visible; } };
  }

  /* ---------------------------------------------------------
     Pointer effects: cursor light, magnetic buttons, tilt, card spotlight
     --------------------------------------------------------- */
  function initPointerFX() {
    if (!mqFine.matches || !motionOK()) return;

    const spot = $('.spotlight');
    if (spot) {
      let sx = 0, sy = 0, sraf = 0;
      addEventListener('pointermove', e => {
        sx = e.clientX; sy = e.clientY;
        if (!sraf) sraf = requestAnimationFrame(() => {
          sraf = 0;
          spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
          spot.classList.add('is-on');
        });
      }, { passive: true });
      root.addEventListener('mouseleave', () => spot.classList.remove('is-on'));
    }

    $$('.magnetic').forEach(el => {
      let r = null;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); el.classList.add('is-magnet'); });
      el.addEventListener('pointermove', e => {
        if (!r) r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.setProperty('--tx', (x * .26).toFixed(1) + 'px');
        el.style.setProperty('--ty', (y * .36).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => {
        r = null;
        el.classList.remove('is-magnet');
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    });

    $$('[data-tilt]').forEach(el => {
      const amp = el.dataset.tilt === 'soft' ? 2.2 : 4.5;
      let r = null;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); el.classList.add('is-tilting'); });
      el.addEventListener('pointermove', e => {
        if (!r) r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - .5) * amp * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * amp * 1.6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => {
        r = null;
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    $$('[data-spot]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });
  }

  /* accent swatches on the "Make it yours" tile */
  function initSwatches() {
    const tile = $('.tile--personal');
    if (!tile) return;
    const sws = $$('.swatch', tile);
    const rgb = hex => { const n = parseInt(hex.replace('#', ''), 16); return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`; };
    const pick = s => {
      sws.forEach(x => { const on = x === s; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
      const a = s.style.getPropertyValue('--a').trim(), b = s.style.getPropertyValue('--b').trim();
      tile.style.setProperty('--sw-a', a);
      tile.style.setProperty('--sw-b', b);
      tile.style.setProperty('--accent', rgb(a));
    };
    sws.forEach(s => {
      s.addEventListener('click', () => pick(s));
      s.addEventListener('pointerenter', () => pick(s));
      s.addEventListener('focus', () => pick(s));
    });
  }

  /* ---------------------------------------------------------
     SHOWCASE — app tour tabs (+ auto-advance until first interaction)
     --------------------------------------------------------- */
  function initTour() {
    const tour = $('[data-showcase]');
    if (!tour) return;
    const tabs = $$('[role="tab"]', tour);
    const panel = $('#panel-tour');
    const pages = $$('.page', tour);
    const navs = $$('.aw-nav[data-nav]', tour);
    const order = tabs.map(t => t.dataset.page);
    let current = order[0];
    let auto = motionOK();

    const pagesHost = $('.aw-pages', tour);
    const wtoast = document.createElement('div');
    wtoast.className = 'ui-toast';
    wtoast.setAttribute('aria-hidden', 'true');
    pagesHost.appendChild(wtoast);
    let wt;
    const winToast = msg => {
      wtoast.innerHTML = icon('check') + `<span>${esc(msg)}</span>`;
      wtoast.classList.add('is-show');
      clearTimeout(wt);
      wt = setTimeout(() => wtoast.classList.remove('is-show'), 2200);
    };

    function show(page, focus) {
      if (!order.includes(page)) return;
      current = page;
      tabs.forEach(t => {
        const on = t.dataset.page === page;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) {
          panel.setAttribute('aria-labelledby', t.id);
          if (focus) t.focus();
          if (mqMobile.matches) t.parentElement.scrollTo({ left: t.offsetLeft - 16, behavior: motionOK() ? 'smooth' : 'auto' });
        }
      });
      pages.forEach(p => p.classList.toggle('is-active', p.dataset.page === page));
      navs.forEach(n => n.classList.toggle('is-active', n.dataset.nav === page));
      if (auto) { tour.classList.remove('is-auto'); void tour.offsetWidth; tour.classList.add('is-auto'); }
    }
    const stopAuto = () => { if (!auto) return; auto = false; tour.classList.remove('is-auto'); };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { stopAuto(); show(t.dataset.page); });
      t.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); stopAuto(); show(tabs[j].dataset.page, true); }
      });
      const prog = $('.tour__progress', t);
      if (prog) prog.addEventListener('animationend', () => {
        if (auto && t.getAttribute('aria-selected') === 'true') show(order[(order.indexOf(current) + 1) % order.length]);
      });
    });
    navs.forEach(n => n.addEventListener('click', () => { stopAuto(); show(n.dataset.nav); }));

    const pause = on => tour.classList.toggle('is-paused', on);
    tour.addEventListener('pointerenter', () => pause(true));
    tour.addEventListener('pointerleave', () => pause(false));
    tour.addEventListener('focusin', () => pause(true));
    tour.addEventListener('focusout', () => pause(false));

    // Tweaks page: switches answer like the app ("{0} enabled", "{0} reset")
    $$('.ui-tw', tour).forEach(b => {
      b.setAttribute('aria-pressed', String(b.classList.contains('is-on')));
      b.addEventListener('click', () => {
        stopAuto();
        const on = b.classList.toggle('is-on');
        b.setAttribute('aria-pressed', String(on));
        const name = $('b', b).textContent;
        const restart = !!$('.badge--restart', b);
        winToast(on ? (restart ? `${name} enabled – takes effect after a restart` : `${name} enabled`) : `${name} reset`);
      });
    });

    // Game Booster page: selection updates "Close {0} apps ({1})"
    const apps = $$('.ui-app', tour);
    const label = $('[data-booster-label]', tour);
    const mb = s => (/GB/.test(s) ? parseFloat(s) * 1024 : parseFloat(s));
    const updBooster = () => {
      const sel = apps.filter(a => a.classList.contains('is-on'));
      const total = sel.reduce((t, a) => t + mb($('em', a).textContent), 0);
      const size = total >= 1024 ? (total / 1024).toFixed(1) + ' GB' : Math.round(total) + ' MB';
      if (label) label.textContent = sel.length ? `Close ${sel.length} app${sel.length > 1 ? 's' : ''} (${size})` : 'Select apps to close';
    };
    apps.forEach(a => {
      a.setAttribute('aria-pressed', String(a.classList.contains('is-on')));
      a.addEventListener('click', () => {
        stopAuto();
        const on = a.classList.toggle('is-on');
        a.setAttribute('aria-pressed', String(on));
        updBooster();
      });
    });
    updBooster();

    show(current);
  }

  /* ---------------------------------------------------------
     TWEAK EXPLORER
     --------------------------------------------------------- */
  function initExplorer() {
    const list = $('#tweak-list');
    const detail = $('#tweak-detail');
    const count = $('#tweak-count');
    const search = $('#tweak-search');
    const catsEl = $('#tweak-cats');
    const body = $('.xp__body');
    if (!list || !detail || !TWEAKS.length) return;

    const RANK = { high: 0, medium: 1, low: 2 };
    const IMPACT = { high: 'High impact', medium: 'Medium impact', low: 'Low impact' };
    const BADGE = { high: 'badge--high', medium: 'badge--mid', low: 'badge--low' };
    const catLabel = id => (CATS.find(c => c.id === id) || {}).label || id;
    const sorted = TWEAKS.map((t, i) => Object.assign({ _i: i }, t))
      .sort((a, b) => RANK[a.impact] - RANK[b.impact] || (b.recommended - a.recommended) || a._i - b._i);
    const state = { q: '', cat: 'all', turbo: false, restart: false, admin: false, sel: sorted[0].id, open: !mqMobile.matches };
    let inlineLi = null;

    catsEl.insertAdjacentHTML('beforeend', CATS.map(c =>
      `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="false">${esc(c.label)} <span>${TWEAKS.filter(t => t.category === c.id).length}</span></button>`
    ).join(''));
    const chips = $$('.chip', catsEl);
    const allChip = chips.find(c => c.dataset.cat === 'all');
    if (allChip) $('span', allChip).textContent = String(TWEAKS.length);

    const meter = l => `<span class="meter" data-l="${l}" aria-hidden="true"><i></i><i></i><i></i></span>`;

    function matches(t) {
      if (state.cat !== 'all' && t.category !== state.cat) return false;
      if (state.turbo && !t.recommended) return false;
      if (state.restart && !t.restart) return false;
      if (state.admin && !t.admin) return false;
      if (!state.q) return true;
      const hay = [t.name, t.desc, t.id, catLabel(t.category), t.scope, IMPACT[t.impact]].concat(t.changes).join(' ').toLowerCase();
      return state.q.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
    }

    function rowHTML(t, n) {
      const pressed = t.id === state.sel && state.open;
      return `<li style="--n:${n}"><button type="button" class="xp-row" data-id="${t.id}" aria-pressed="${pressed}" aria-controls="tweak-detail">` +
        `<span class="xp-row__ic">${icon(t.icon)}</span>` +
        `<span class="xp-row__t"><b>${esc(t.name)}</b><small>${esc(catLabel(t.category))}, ${IMPACT[t.impact].toLowerCase()}</small></span>` +
        `<span class="xp-row__side">` +
          (t.recommended ? `<span class="is-turbo" title="Part of Turbo Boost">${icon('bolt')}<span class="sr-only">Part of Turbo Boost.</span></span>` : '') +
          (t.restart ? `<span class="is-restart" title="Restart recommended">${icon('power')}<span class="sr-only">Restart recommended.</span></span>` : '') +
          meter(t.impact) +
        `</span></button></li>`;
    }

    function detailHTML(t) {
      const facts = [
        ['Impact', `${meter(t.impact)} ${IMPACT[t.impact]}`],
        ['Restart', t.restart ? 'Recommended after enabling' : 'Not needed'],
        ['Admin rights', t.admin ? 'Required, system-wide setting' : 'Not needed for this setting'],
        ['Turbo Boost', t.recommended ? 'Included' : 'Not included, enable it on its own'],
        ['Scope', esc(t.scope)],
        ['Undo', 'Original value saved in backup.json']
      ];
      const changes = t.changes.map(c => {
        const [path, val] = c.split(' · ');
        const isKey = /^HK(CU|LM)\\/.test(path);
        return `<li>${isKey ? `<code>${esc(path)}</code>` : esc(path)}${val ? `<span class="v">${esc(val)}</span>` : ''}</li>`;
      }).join('');
      return `<div class="xd">` +
        `<div class="xd__top"><span class="xd__ic">${icon(t.icon)}</span><div><p class="xd__cat">${esc(catLabel(t.category))}</p><h3>${esc(t.name)}</h3></div></div>` +
        `<p class="xd__badges"><span class="badge ${BADGE[t.impact]}">${IMPACT[t.impact]}</span>` +
          (t.recommended ? '<span class="badge badge--rec">Recommended</span>' : '') +
          (t.restart ? '<span class="badge badge--restart">Restart</span>' : '') +
          (t.admin ? '<span class="badge badge--admin">System-wide</span>' : '') + `</p>` +
        `<p class="xd__desc">${esc(t.desc)}</p>` +
        `<dl class="xd__facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` +
        `<p class="xd__k">What it changes</p><ul class="xd__changes">${changes}</ul>` +
        `<p class="xd__undo">${icon('reset')}<span>To undo, click the circular arrow on this tweak in the app, or use “Reset all tweaks”.</span></p>` +
      `</div>`;
    }

    function placeDetail() {
      if (mqMobile.matches) {
        const btn = state.open ? list.querySelector(`.xp-row[data-id="${state.sel}"]`) : null;
        if (!btn) {
          if (detail.parentElement !== body) body.appendChild(detail);
          if (inlineLi) inlineLi.remove();
          return;
        }
        if (!inlineLi) { inlineLi = document.createElement('li'); inlineLi.className = 'xp__inline'; }
        btn.parentElement.after(inlineLi);
        inlineLi.appendChild(detail);
      } else {
        if (detail.parentElement !== body) body.appendChild(detail);
        if (inlineLi) inlineLi.remove();
      }
    }

    function showDetail() {
      const t = TWEAKS.find(x => x.id === state.sel);
      if (t) detail.innerHTML = detailHTML(t);
      $$('.xp-row', list).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === state.sel && state.open)));
      placeDetail();
    }

    function render() {
      if (detail.parentElement !== body) body.appendChild(detail);
      const res = sorted.filter(matches);
      count.textContent = res.length === TWEAKS.length
        ? `Showing all ${TWEAKS.length} tweaks`
        : `Showing ${res.length} of ${TWEAKS.length} tweaks`;
      if (!res.length) {
        list.innerHTML = `<li class="xp__empty"><p>No tweak matches ${state.q ? `“${esc(state.q)}”` : 'these filters'}.</p>` +
          `<button type="button" class="btn btn--ghost btn--sm" data-clear>Clear search and filters</button></li>`;
        detail.innerHTML = `<p class="xp__empty">Clear the filters to see tweak details.</p>`;
        return;
      }
      if (!res.some(t => t.id === state.sel)) state.sel = res[0].id;
      list.innerHTML = res.map(rowHTML).join('');
      showDetail();
    }

    function resetFilters() {
      state.q = ''; state.cat = 'all'; state.turbo = state.restart = state.admin = false;
      search.value = '';
      ['f-turbo', 'f-restart', 'f-admin'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
      chips.forEach(c => { const on = c.dataset.cat === 'all'; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      render();
      search.focus();
    }

    chips.forEach(ch => ch.addEventListener('click', () => {
      state.cat = ch.dataset.cat;
      chips.forEach(c => { const on = c === ch; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      render();
    }));
    let qt;
    search.addEventListener('input', () => {
      clearTimeout(qt);
      qt = setTimeout(() => { state.q = search.value.trim().toLowerCase(); render(); }, 110);
    });
    search.addEventListener('keydown', e => { if (e.key === 'Escape' && search.value) { search.value = ''; state.q = ''; render(); } });
    [['f-turbo', 'turbo'], ['f-restart', 'restart'], ['f-admin', 'admin']].forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => { state[key] = el.checked; render(); });
    });

    list.addEventListener('click', e => {
      if (e.target.closest('[data-clear]')) { resetFilters(); return; }
      const b = e.target.closest('.xp-row');
      if (!b) return;
      if (mqMobile.matches && state.sel === b.dataset.id && state.open) state.open = false;
      else { state.sel = b.dataset.id; state.open = true; }
      showDetail();
    });

    document.addEventListener('keydown', e => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const a = document.activeElement;
      if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      e.preventDefault();
      search.scrollIntoView({ block: 'center', behavior: motionOK() ? 'smooth' : 'auto' });
      search.focus({ preventScroll: true });
    });

    onMq(mqMobile, e => { state.open = !e.matches; render(); });
    render();
  }

  /* ---------------------------------------------------------
     Download feedback, checksum copy
     --------------------------------------------------------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e2) { return false; }
    }
  }
  function selectText(el) {
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function initDownload() {
    const card = $('#dl-started');
    $$('[data-download]').forEach(a => a.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.hasAttribute('data-silent')) return;
      // The browser downloads the file natively from the link; this is feedback only.
      toast(`Download started: ${REL.fileName || 'VeyroxTweaks.exe'} (${REL.sizeBytes ? fmtSize(REL.sizeBytes) : 'Windows app'})`);
      if (card) card.hidden = false;
      if (a.id === 'download-btn') { a.classList.remove('is-fired'); void a.offsetWidth; a.classList.add('is-fired'); }
    }));
    const x = $('.dl-started__x');
    if (x && card) x.addEventListener('click', () => { card.hidden = true; });

    $$('[data-copy-from]').forEach(btn => btn.addEventListener('click', async () => {
      const key = btn.dataset.copyFrom;
      const src = document.getElementById(key) || $(`[data-config="${key}"]`);
      const text = src ? src.textContent.trim() : '';
      const ok = text ? await copyText(text) : false;
      const lab = $('span', btn);
      const prev = lab.textContent;
      btn.classList.toggle('is-done', ok);
      lab.textContent = ok ? 'Copied' : 'Select';
      if (!ok) selectText(src);
      toast(ok ? (key === 'sha256' ? 'SHA-256 checksum copied' : 'Command copied') : 'Couldn’t copy. The text is selected, press Ctrl+C.', ok ? 'ok' : 'info');
      setTimeout(() => { btn.classList.remove('is-done'); lab.textContent = prev; }, 1800);
    }));
  }

  /* ---------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------- */
  function initAccordion() {
    const accs = $$('[data-accordion] .acc');
    accs.forEach(acc => {
      const btn = $('button', acc);
      btn.addEventListener('click', () => {
        const open = !acc.classList.contains('is-open');
        accs.forEach(a => {
          if (a !== acc && a.classList.contains('is-open')) {
            a.classList.remove('is-open');
            $('button', a).setAttribute('aria-expanded', 'false');
          }
        });
        acc.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ---------------------------------------------------------
     Page transitions to the legal pages
     --------------------------------------------------------- */
  function initPageTransitions() {
    $$('a[data-transition]').forEach(a => a.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      if (!motionOK()) return;
      e.preventDefault();
      store.set('vx-wipe', '1');
      root.classList.add('is-leaving');
      setTimeout(() => { location.href = a.href; }, 460);
    }));
    addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('is-leaving'); });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  applyConfig();
  applyLinks();
  initNav();
  initMenu();
  initReveal();
  initOffscreen();
  initPointerFX();
  initSwatches();
  initTour();
  initExplorer();
  initDownload();
  initAccordion();
  initPageTransitions();

  const hero = createHero();
  const story = createStory();
  const relayout = () => {
    if (hero) hero.layout();
    if (story) story.layout();
    moveIndicator(navLinks.find(a => a.dataset.section === activeKey));
  };
  relayout();

  let ticking = false;
  const frame = () => {
    ticking = false;
    updateHeader(scrollY);
    if (hero && hero.visible) hero.update();
    if (story && story.visible) story.update();
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 140); });
  onMq(mqPin, relayout);
  onMq(mqReduce, relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(navLinks.find(a => a.dataset.section === activeKey)));

  runPreloader().then(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
})();
