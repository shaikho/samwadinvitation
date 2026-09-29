(function () {
  const { animate, inView, scroll, stagger, frame } = window.Motion;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 640px)').matches;
  const EASE = [0.22, 1, 0.36, 1];
  const SMOOTH = [0.16, 1, 0.3, 1]; // long, soft ease-out for scroll reveals
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // tiny requestAnimationFrame tween (used for the envelope flap's 3D hinge)
  function cubicBezier(x1, y1, x2, y2) {
    const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return (x) => {
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (bez(t, x1, x2) < x) lo = t; else hi = t; }
      return bez(t, y1, y2);
    };
  }
  function tween(ms, ease, onUpdate) {
    let t0 = null;
    const step = (now) => {
      if (t0 === null) t0 = now; // anchor to the frame clock
      const p = Math.min(1, Math.max(0, (now - t0) / ms));
      onUpdate(ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const WEDDING = new Date('2026-10-20T20:00:00+03:00'); // 8:00 PM Cairo
  const VENUE = { lat: 29.9310476, lng: 30.9494757, name: 'One View Hall, Mountain Rose Hotel, 6th of October City, Giza, Egypt' };

  document.documentElement.classList.add('js');

  // ---------------------------------------------------------------- i18n
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };
  const qsLang = new URLSearchParams(location.search).get('lang');
  let lang = qsLang === 'en' || qsLang === 'ar' ? qsLang : store.get('lang') || 'ar';

  const t = (key) => (I18N[lang] && I18N[lang][key]) ?? '';

  function applyLang() {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('meta.title');
    $$('[data-i18n]').forEach((el) => {
      const v = t(el.dataset.i18n);
      el.textContent = v;
      el.hidden = v === '';
    });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    updateCalendarLinks();
    renderCountdown(true);
    if (typeof centerAll === 'function') fontsReady.then(centerAll);
  }

  $('#langToggle').addEventListener('click', async () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    store.set('lang', lang);
    const main = $('main');
    animate(main, { opacity: [1, 0] }, { duration: 0.25 });
    await wait(260);
    applyLang();
    animate(main, { opacity: [0, 1] }, { duration: 0.45 });
  });

  // ---------------------------------------------------------------- artwork
  $$('[data-art]').forEach((el) => { el.innerHTML = Art[el.dataset.art](); });
  $$('[data-icon]').forEach((el) => { el.innerHTML = Art.icons[el.dataset.icon]; });

  // ---------------------------------------------------------------- 3D background layers
  const MOTIF = (c) => `<svg viewBox="0 0 40 40"><g fill="${c}"><circle cx="20" cy="11" r="6"/><circle cx="29" cy="18" r="6"/><circle cx="25" cy="28" r="6"/><circle cx="15" cy="28" r="6"/><circle cx="11" cy="18" r="6"/></g><circle cx="20" cy="20" r="3.5" fill="#d9bf86"/></svg>`;
  function fillLayers() {
    const rand = (a, b) => a + Math.random() * (b - a);
    const far = $('.layer-far'), mid = $('.layer-mid'), near = $('.layer-near');
    const bokehColors = ['#e8b9c0', '#cdbfe4', '#e7d3a6', '#b9cdb0', '#f3d6cf'];
    for (let i = 0; i < 9; i++) {
      const s = rand(120, 320);
      far.insertAdjacentHTML('beforeend', `<span class="bokeh" style="width:${s}px;height:${s}px;left:${rand(0, 100)}%;top:${rand(0, 100)}%;--c:${bokehColors[i % 5]};--blur:${rand(18, 34)}px;--o:${rand(.25, .45)}"></span>`);
    }
    const motifColors = ['#d9a3ac', '#bda9dc', '#f5ede0', '#a9bb9b'];
    for (let i = 0; i < (isSmall ? 9 : 16); i++) {
      const s = rand(14, 34);
      mid.insertAdjacentHTML('beforeend', `<span class="motif" style="width:${s}px;height:${s}px;left:${rand(2, 98)}%;top:${rand(2, 98)}%;--o:${rand(.18, .35)};transform:rotate(${rand(0, 90)}deg)">${MOTIF(motifColors[i % 4])}</span>`);
    }
    for (let i = 0; i < (isSmall ? 8 : 14); i++) {
      const s = rand(5, 12);
      near.insertAdjacentHTML('beforeend', `<span class="bokeh" style="width:${s}px;height:${s}px;left:${rand(0, 100)}%;top:${rand(0, 100)}%;--c:#ffffff;--blur:${rand(0, 2)}px;--o:${rand(.5, .85)}"></span>`);
    }
  }
  fillLayers();

  // ---------------------------------------------------------------- gyro / pointer tilt
  const tilt = { x: 0, y: 0, tx: 0, ty: 0, baseBeta: null, hasGyro: false };
  const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));

  function onOrientation(e) {
    if (e.gamma == null || e.beta == null) return;
    tilt.hasGyro = true;
    if (tilt.baseBeta === null) tilt.baseBeta = e.beta;
    tilt.baseBeta += (e.beta - tilt.baseBeta) * 0.004; // slowly re-centre on how the phone is held
    let gx = e.gamma, by = e.beta - tilt.baseBeta;
    if (Math.abs(window.orientation) === 90) [gx, by] = [by * Math.sign(window.orientation), -gx * Math.sign(window.orientation)];
    tilt.tx = clamp(gx / 22);
    tilt.ty = clamp(by / 22);
  }
  function enableGyro() {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) return;
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then((s) => { if (s === 'granted') addEventListener('deviceorientation', onOrientation); }).catch(() => {});
    } else {
      addEventListener('deviceorientation', onOrientation);
    }
  }
  addEventListener('pointermove', (e) => {
    if (tilt.hasGyro || e.pointerType === 'touch') return;
    tilt.tx = (e.clientX / innerWidth) * 2 - 1;
    tilt.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  const layers = $$('.layer[data-depth]').map((el) => ({ el, d: parseFloat(el.dataset.depth) }));
  const tilters = $$('.tilt');
  const sky = $('.sky');

  let maxScroll = 1;
  const measureScroll = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  measureScroll();
  addEventListener('resize', measureScroll);
  if (window.ResizeObserver) new ResizeObserver(measureScroll).observe(document.body);

  function tiltLoop(now) {
    const idle = tilt.hasGyro ? 0 : 0.12;
    const tx = tilt.tx + Math.sin(now / 3100) * idle;
    const ty = tilt.ty + Math.cos(now / 3700) * idle;
    tilt.x += (tx - tilt.x) * 0.06;
    tilt.y += (ty - tilt.y) * 0.06;
    const sy = scrollY / maxScroll;

    for (const { el, d } of layers) {
      el.style.transform = `translate3d(${(-tilt.x * 34 * d).toFixed(2)}px, ${(-tilt.y * 34 * d - sy * 120 * d).toFixed(2)}px, 0) rotateX(${(tilt.y * 4).toFixed(2)}deg) rotateY(${(-tilt.x * 4).toFixed(2)}deg)`;
    }
    for (const el of tilters) {
      el.style.transform = `perspective(1100px) rotateY(${(tilt.x * 7).toFixed(2)}deg) rotateX(${(-tilt.y * 7).toFixed(2)}deg)`;
    }
    // clouds shift a little with the phone's tilt (3D depth)
    sky.style.transform = `translate3d(${(-tilt.x * 18).toFixed(2)}px, ${(-tilt.y * 10).toFixed(2)}px, 0)`;
    requestAnimationFrame(tiltLoop);
  }
  if (!reduced) requestAnimationFrame(tiltLoop);

  // ---------------------------------------------------------------- bakhoor smoke (Jertig theme)
  // Each tile is painted once into a canvas (soft radial puffs along rising, swaying paths),
  // wrapped top-to-bottom and side-to-side so it tiles seamlessly, then used as a background image.
  function paintSmoke(w, h, seed, tint) {
    let a = seed >>> 0;
    const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const c = document.createElement('canvas');
    c.width = w / 2; c.height = h / 2;
    const g = c.getContext('2d');
    g.scale(.5, .5); // painted at half resolution: invisible on soft smoke, 4× less work
    const puff = (x, y, r, alpha) => {
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
        const px = x + dx, py = y + dy;
        if (px + r < 0 || px - r > w || py + r < 0 || py - r > h) continue;
        const grad = g.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, `rgba(${tint}, ${alpha})`);
        grad.addColorStop(1, `rgba(${tint}, 0)`);
        g.fillStyle = grad;
        g.fillRect(px - r, py - r, r * 2, r * 2);
      }
    };
    // a faint haze first
    for (let i = 0; i < 7; i++) puff(rnd() * w, rnd() * h, 110 + rnd() * 110, 0.008 + rnd() * 0.008);
    // incense ribbons: thin and bright where they rise, then swaying wider, curling and fading
    const wisps = 4;
    for (let k = 0; k < wisps; k++) {
      const x0 = rnd() * w, phase = rnd() * 6.28, base = 30 + rnd() * 45, freq = .8 + rnd() * 1.2, tw = 20 + rnd() * 14;
      const steps = 150;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const y = h * (1 - t);
        const amp = base * (0.25 + 1.5 * t);
        const curl = Math.sin(t * tw + phase) * 14 * t;
        const x = x0 + Math.sin(t * Math.PI * 2 * freq + phase) * amp + curl;
        const r = 5 + 40 * Math.pow(t, 1.3) + rnd() * 4;
        const alpha = 0.05 * Math.pow(1 - t, 0.8) + 0.005;
        puff(x, y, r, alpha);
      }
    }
    return new Promise((resolve) => c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : c.toDataURL()), 'image/png'));
  }
  // paint during idle time, but no later than 3s after load so it's ready long before the Jertig
  const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1200));
  if (!reduced) whenIdle(async () => {
    const layers = [['.jertig-smoke.s1', 520, 1040, 11, '255, 236, 214'], ['.jertig-smoke.s2', 680, 1360, 23, '255, 214, 170'], ['.jertig-smoke.s3', 440, 880, 37, '255, 246, 230']];
    for (const [sel, w, h, seed, tint] of layers) {
      const url = await paintSmoke(w, h, seed, tint);
      const el = $(sel);
      if (el) el.style.backgroundImage = `url("${url}")`;
    }
  });

  // ---------------------------------------------------------------- petals canvas
  const Petals = (function () {
    const cv = $('.petals');
    const ctx = cv.getContext('2d');
    const palettes = {
      garden: ['#eab7be', '#f3d2d0', '#d99aa5', '#f7e4dc', '#cdbfe4', '#f0c9c4'],
      jertig: ['#c8161f', '#e03a2f', '#f2c14e', '#f7d77f', '#a3161d', '#ffb347'],
    };
    let colors = palettes.garden;
    const list = [];
    let W = 0, H = 0, dpr = 1, lastY = scrollY, last = performance.now();
    const ambient = isSmall ? 9 : 16;

    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(opts = {}) {
      const s = 5 + Math.random() * 7;
      list.push({
        x: opts.x ?? Math.random() * W,
        y: opts.y ?? -20,
        vx: opts.vx ?? (Math.random() - .5) * .4,
        vy: opts.vy ?? .35 + Math.random() * .5,
        s, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .04,
        flip: Math.random() * 6.28, vf: .02 + Math.random() * .04,
        c: colors[(Math.random() * colors.length) | 0],
        a: opts.a ?? 0, life: opts.life ?? Infinity,
        kind: opts.kind || 'petal', boom: !!opts.boom, r: 0,
      });
      if (opts.c) list[list.length - 1].c = opts.c;
    }
    // a joyful explosion: a ring shockwave, then hearts, petals and gold sparks under gravity
    function celebrate(x, y) {
      const n = isSmall ? 55 : 85;
      const hearts = ['#c9566b', '#e38a9b', '#b86f7e', '#f0b3bd'];
      const golds = ['#f3d38a', '#e8c36e', '#fff1c7'];
      list.push({ x, y, vx: 0, vy: 0, s: 0, rot: 0, vr: 0, flip: 0, vf: 0, c: '#d8b46a', a: 1, life: 70, kind: 'ring', boom: true, r: 6 });
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
        const roll = Math.random();
        const kind = roll < .38 ? 'heart' : roll < .7 ? 'petal' : 'spark';
        spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 3, a: 1, life: 150 + Math.random() * 110, boom: true, kind,
          c: kind === 'heart' ? hearts[(Math.random() * hearts.length) | 0] : kind === 'spark' ? golds[(Math.random() * golds.length) | 0] : undefined,
        });
      }
    }
    function burst(n, x, y) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3.5;
        spawn({ x: x ?? W / 2, y: y ?? H / 2, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5, a: 1, life: 260 + Math.random() * 200 });
      }
    }
    function draw(p) {
      if (p.kind === 'ring') {
        ctx.save();
        ctx.globalAlpha = p.a * .8;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        return;
      }
      if (p.kind === 'spark') {
        ctx.save();
        ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(p.flip * 3));
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .32, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha *= .25;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .75, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        return;
      }
      if (p.kind === 'heart') {
        const s = p.s * .75;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * .4);
        ctx.scale(Math.cos(p.flip) * .5 + .7, 1);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, s * .9);
        ctx.bezierCurveTo(-s * 1.4, 0, -s * .8, -s * 1.1, 0, -s * .45);
        ctx.bezierCurveTo(s * .8, -s * 1.1, s * 1.4, 0, 0, s * .9);
        ctx.fill();
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.flip) * .8 + .2, 1);
      ctx.globalAlpha = p.a * .9;
      ctx.fillStyle = p.c;
      const s = p.s;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * .95, -s * .55, s * .7, s * .75, 0, s);
      ctx.bezierCurveTo(-s * .7, s * .75, -s * .95, -s * .55, 0, -s);
      ctx.fill();
      ctx.globalAlpha = p.a * .35;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(0, -s * .6); ctx.lineTo(0, s * .6); ctx.stroke();
      ctx.restore();
    }
    function frame(now) {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      const dy = clamp(scrollY - lastY, -40, 40); // ignore jumps (anchor links, restores)
      lastY = scrollY;
      // page movement stirs the petals
      if (Math.abs(dy) > 5 && list.length < 60 && Math.random() < .5) {
        const n = Math.min(2, Math.floor(Math.abs(dy) / 20) + 1);
        for (let i = 0; i < n; i++) spawn({ y: dy > 0 ? H + 10 : -10, vy: dy > 0 ? -2 - Math.random() * 2 : 2, a: 0, life: 320 });
      }
      let alive = 0;
      const wind = tilt.x * .9;
      ctx.clearRect(0, 0, W, H);
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        if (p.kind === 'ring') {
          p.r += 9 * dt;
        } else if (p.boom) {
          // explosion particles: air drag + gravity, then they settle into a gentle fall
          p.vx *= Math.pow(.97, dt);
          p.vy = p.vy * Math.pow(.97, dt) + .09 * dt;
          if (p.vy > 2.2) p.vy = 2.2;
        } else {
          p.vy -= dy * .012;
          p.vx += (wind + Math.sin(now / 1400 + p.flip) * .25 - p.vx) * .015 * dt;
          p.vy += (.55 - p.vy) * .012 * dt;
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt; p.flip += p.vf * dt;
        p.life -= dt;
        p.a = p.life < 40 ? Math.max(0, p.a - .03 * dt) : Math.min(1, p.a + .02 * dt);
        if (p.y > H + 40 || p.y < -80 || p.x < -60 || p.x > W + 60 || (p.life <= 0 && p.a <= 0)) { list.splice(i, 1); continue; }
        if (p.life === Infinity) alive++;
        draw(p);
      }
      if (alive < ambient && Math.random() < .05 * dt) spawn({ a: 0 });
      if (!document.hidden) requestAnimationFrame(frame);
    }
    function start() {
      if (reduced) return;
      resize();
      addEventListener('resize', resize);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); } });
      for (let i = 0; i < ambient; i++) spawn({ y: Math.random() * H, a: 0 });
      requestAnimationFrame(frame);
    }
    // fully visible petals spread over the screen (used for the link-preview capture)
    function scatter(n) {
      for (let i = 0; i < n; i++) spawn({ y: Math.random() * H, a: 1, vy: .05, vx: 0 });
    }
    // switch palette; drifting petals change colour as they are replaced
    function setPalette(name) {
      colors = palettes[name] || palettes.garden;
      for (const p of list) if (p.kind === 'petal' && Math.random() < .6) p.c = colors[(Math.random() * colors.length) | 0];
    }
    return { start, scatter, setPalette, burst: reduced ? () => {} : burst, celebrate: reduced ? () => {} : celebrate };
  })();

  // ---------------------------------------------------------------- little blue birds
  const BIRD = `<svg viewBox="0 0 40 34">
    <path class="wing-back" d="M17 17C19 8 25 4 30 3c-3 6-5 11-8 15z" fill="#7cbcea"/>
    <path d="M8 19 1 14l2 6-3 4 9-2z" fill="#3f8fcf"/>
    <path d="M6 19c2-7 12-9 20-7 1-4 7-5 9-1l4 2-4 2c-1 7-9 13-18 12-6-1-10-4-11-8z" fill="#4aa3df"/>
    <path d="M12 23c4 3 11 3 16-1-2 4-8 7-13 5z" fill="#a9d5f4"/>
    <circle cx="32" cy="11.5" r="1" fill="#fff"/>
    <path class="wing" d="M14 17C17 6 24 2 29 1c-3 7-5 12-9 17z" fill="#3a8fd0"/>
  </svg>`;

  function flyBird(opts = {}) {
    if (reduced) return;
    const el = document.createElement('div');
    el.className = 'bird';
    el.innerHTML = BIRD;
    $('.birds').appendChild(el);
    const W = innerWidth, H = innerHeight;
    const ltr = opts.ltr ?? Math.random() < .5;
    const size = opts.scale ?? (.55 + Math.random() * .6);
    const bw = 34 * size;
    // start and finish fully outside the screen so every bird crosses the whole width
    const from = ltr ? -bw - 40 : W + 40, to = ltr ? W + 40 : -bw - 40;
    const y0 = opts.y ?? H * (.08 + Math.random() * .45);
    const phase = Math.random() * 6;
    const sx = ltr ? size : -size;
    const steps = 10;
    const keyframes = [];
    for (let i = 0; i <= steps; i++) {
      const x = from + (to - from) * (i / steps);
      const y = y0 + Math.sin(i * .8 + phase) * 22 - i * (opts.rise ?? 4);
      keyframes.push({ transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${size.toFixed(3)})` });
    }
    const seconds = opts.duration ?? Math.min(20, Math.max(7, W / 150 + 5 + Math.random() * 3));
    // Web Animations API: runs on the compositor, so the flight never stalls while scrolling
    const anim = el.animate(keyframes, { duration: seconds * 1000, delay: (opts.delay ?? 0) * 1000, easing: 'linear', fill: 'both' });
    anim.onfinish = () => el.remove();
    anim.oncancel = () => el.remove();
  }
  function flock(n = 3, atY) {
    const ltr = Math.random() < .5;
    const y = atY ?? innerHeight * (.12 + Math.random() * .3);
    const duration = Math.min(22, Math.max(8, innerWidth / 130 + 6));
    for (let i = 0; i < n; i++) flyBird({ ltr, y: y + (i % 2 ? 22 : -10) * i, delay: i * .35, scale: .5 + Math.random() * .35, duration });
  }
  function birdLoop() {
    // when a cloud bank is on screen, send the birds through (behind) the clouds
    const band = Clouds.bandY();
    if (band !== null) flock(2 + ((Math.random() * 2) | 0), band);
    else Math.random() < .3 ? flock(2 + ((Math.random() * 2) | 0)) : flyBird();
    setTimeout(birdLoop, 6000 + Math.random() * 7000);
  }

  // ---------------------------------------------------------------- clouds
  // Soft, slightly see-through clouds drifting across the top of the countdown and
  // timeline sections. They live in a fixed layer above the birds, so birds fly behind
  // them; each bank is moved to follow its section as the page scrolls.
  const Clouds = (function () {
    let seedN = 1;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function cloudSVG() {
      const id = `cl${seedN++}`;
      const puffs = 5 + ((Math.random() * 3) | 0);
      let circles = '';
      for (let i = 0; i < puffs; i++) {
        const t = i / (puffs - 1);
        const x = 50 + t * 200 + rnd(-8, 8);
        const r = 26 + Math.sin(t * Math.PI) * rnd(18, 30);
        circles += `<circle cx="${x.toFixed(1)}" cy="${(98 - r * .62).toFixed(1)}" r="${r.toFixed(1)}"/>`;
      }
      return `<svg viewBox="0 0 300 130" aria-hidden="true">
        <defs>
          <linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="126">
            <stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#f8f7f4"/><stop offset="1" stop-color="#dde5ee"/>
          </linearGradient>
          <filter id="${id}f" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
        </defs>
        <g filter="url(#${id}f)" fill="url(#${id}g)">${circles}<ellipse cx="150" cy="100" rx="122" ry="24"/></g>
      </svg>`;
    }

    const banks = [];
    function build(sectionSel, count, yFrom, yTo) {
      const section = $(sectionSel);
      const bank = document.createElement('div');
      bank.className = 'cloudbank';
      for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'cloud';
        const w = isSmall ? rnd(140, 230) : rnd(200, 360);
        const dur = rnd(70, 130); // slow drift across the screen
        c.style.cssText = `--w:${w.toFixed(0)}px;--y:${rnd(yFrom, yTo).toFixed(0)}px;--o:${rnd(.72, .88).toFixed(2)};--dur:${dur.toFixed(0)}s;--delay:-${(Math.random() * dur).toFixed(1)}s;--bob:${rnd(5, 9).toFixed(1)}s`;
        c.innerHTML = cloudSVG();
        bank.appendChild(c);
      }
      $('.sky').appendChild(bank);
      const entry = { section, bank, height: section.offsetHeight, top: Infinity, yFrom, yTo };
      banks.push(entry);
      return entry;
    }

    function place(entry, p) {
      const top = innerHeight - p * (entry.height + innerHeight); // section top in the viewport
      entry.top = top;
      entry.bank.style.transform = `translate3d(0, ${top.toFixed(1)}px, 0)`;
      entry.bank.classList.toggle('is-off', p <= 0 || p >= 1);
    }

    function init() {
      const vh = innerHeight;
      build('#countdown', isSmall ? 4 : 6, -20, Math.max(40, vh * .2 - 50));
      build('#timeline', isSmall ? 4 : 6, -40, isSmall ? 70 : 110);
      addEventListener('resize', () => banks.forEach((b) => { b.height = b.section.offsetHeight; }));
      banks.forEach((entry) => {
        place(entry, 0);
        scroll((p) => place(entry, p), { target: entry.section, offset: ['start end', 'end start'] });
      });
    }

    // viewport y of a cloud band that is currently on screen (for bird flights), or null
    function bandY() {
      for (const b of banks) {
        const mid = b.top + (b.yFrom + b.yTo) / 2 + 30;
        if (mid > 20 && mid < innerHeight * .8) return mid;
      }
      return null;
    }
    return { init, bandY, svg: cloudSVG };
  })();

  // very faint clouds drifting through the middle of each countdown circle
  $$('.hoop').forEach((hoop) => {
    hoop.insertAdjacentHTML('afterbegin', `<div class="hoop-cloud" aria-hidden="true">${Clouds.svg()}</div><div class="hoop-cloud b" aria-hidden="true">${Clouds.svg()}</div>`);
  });

  // ---------------------------------------------------------------- countdown
  const nums = Object.fromEntries($$('.num').map((el) => [el.dataset.unit, el]));
  let prev = {};
  function fmt(n) {
    return n.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumIntegerDigits: 2, useGrouping: false });
  }
  function renderCountdown(force = false) {
    let diff = Math.max(0, WEDDING - Date.now());
    const parts = {
      days: Math.floor(diff / 864e5),
      hours: Math.floor((diff % 864e5) / 36e5),
      minutes: Math.floor((diff % 36e5) / 6e4),
    };
    for (const k in parts) {
      if (!force && prev[k] === parts[k]) continue;
      nums[k].textContent = fmt(parts[k]);
      centerInk(nums[k]);
      if (!force && !reduced && prev[k] !== undefined) {
        animate(nums[k], { y: [-12, 0], opacity: [0, 1], scale: [1.15, 1] }, { duration: .45, ease: EASE });
      }
    }
    prev = parts;
    if (diff === 0) $('.count-date').textContent = t('count.done');
  }
  setInterval(renderCountdown, 1000);

  // ---------------------------------------------------------------- optical centring
  // Script fonts and Arabic digits carry uneven side bearings and vertical metrics, so
  // CSS centring of the text *box* leaves the visible glyphs off-centre. These helpers
  // measure the actual ink with canvas and correct for it.
  const mctx = document.createElement('canvas').getContext('2d');
  function inkMetrics(el, text) {
    const cs = getComputedStyle(el);
    mctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = mctx.measureText(text);
    const size = parseFloat(cs.fontSize);
    const fa = m.fontBoundingBoxAscent ?? size * .8;
    const fd = m.fontBoundingBoxDescent ?? size * .2;
    return {
      size, adv: m.width,
      l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight,
      t: -m.actualBoundingBoxAscent, b: m.actualBoundingBoxDescent,
      base: (size - (fa + fd)) / 2 + fa, // baseline inside a line-height:1 box
    };
  }
  function centerInk(el) {
    const m = inkMetrics(el, el.textContent);
    const dx = m.adv / 2 - (m.l + m.r) / 2;
    const dy = m.size / 2 - (m.base + (m.t + m.b) / 2);
    el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
  }
  function centerAll() {
    $$('.num').forEach(centerInk);
  }
  const fontsReady = Promise.all([
    document.fonts.load('60px Armelie'),
    document.fonts.load('40px Cinzel'),
    document.fonts.load('40px Amiri', '٠١٢٣'),
  ]).catch(() => {}).then(() => document.fonts.ready);
  fontsReady.then(centerAll);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(centerAll, 120); });

  // ---------------------------------------------------------------- calendar & maps
  function updateCalendarLinks() {
    $('#directionsBtn').href = `https://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}&travelmode=driving`;
    const title = lang === 'ar' ? 'حفل زفاف سمير ووعد' : 'Sameer & Waad’s Wedding';
    const details = lang === 'ar'
      ? 'فتح الأبواب ٧:٠٠ مساءً · بدء الحفل ٨:٠٠ مساءً\nقاعة ون فيو · فندق ماونتن روز'
      : 'Doors open 7:00 PM · Celebration 8:00 PM\nOne View Hall · Mountain Rose Hotel';
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: '20261020T160000Z/20261020T220000Z',
      details: `${details}\nhttps://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}`,
      location: VENUE.name,
      ctz: 'Africa/Cairo',
    });
    $('#googleCalBtn').href = `https://calendar.google.com/calendar/render?${q}`;
  }

  // ---------------------------------------------------------------- reveals
  function initReveals() {
    // simple fade-up for anything marked data-reveal, staggered within its section
    $$('.slide').forEach((section) => {
      const items = $$('[data-reveal]', section);
      items.forEach((el, i) => {
        inView(el, () => {
          animate(el, { opacity: [0, 1], y: [34, 0] }, { duration: 1.2, delay: Math.min(i, 6) * .08, ease: SMOOTH });
        }, { amount: .15, margin: '0px 0px -6% 0px' });
      });
    });

    // venue frame: card unfolds, blooms pop, then the text
    inView('.frame', (frame) => {
      const art = $('.frame-art', frame);
      animate(art, { opacity: [0, 1], scale: [.94, 1], y: [50, 0] }, { duration: 1.4, ease: SMOOTH });
      animate($$('.frame-content > *', frame), { opacity: [0, 1], y: [18, 0] }, { delay: stagger(.08, { startDelay: .45 }), duration: 1, ease: SMOOTH });
      Petals.burst(isSmall ? 14 : 22, innerWidth / 2, innerHeight * .35);
    }, { amount: .25 });

    // story arch
    inView('.arch', (arch) => {
      const art = $('.arch-art', arch);
      animate(art, { opacity: [0, 1], scale: [.92, 1], y: [40, 0] }, { duration: 1.5, ease: SMOOTH });
    }, { amount: .25 });

    // countdown: birds greet you
    // shared camera: a soft "flash" pops the first time the section comes into view
    inView('#camera', (section) => {
      if (reduced) return;
      setTimeout(() => {
        animate($('.cam-flash', section), { opacity: [0, .85, 0] }, { duration: .7, times: [0, .12, 1], ease: 'easeOut' });
        animate($('.cam-flash-window', section), { fill: ['#e9eef2', '#ffffff', '#e9eef2'] }, { duration: .7 });
      }, 900);
    }, { amount: .4 });

    // keep drifting petals from covering the QR code while it's on screen
    inView('.cam-card', () => {
      document.body.classList.add('qr-visible');
      return () => document.body.classList.remove('qr-visible');
    }, { amount: .3 });

    // countdown & timeline: a flock passes behind the clouds
    ['#countdown', '#timeline'].forEach((sel) => inView(sel, () => {
      setTimeout(() => flock(3, Clouds.bandY() ?? undefined), 400);
    }, { amount: .3 }));

    // timeline
    const tl = $('.tl');
    const fill = $('.tl-fill'), pearlDot = $('.tl-pearl');
    const line = $('.tl-line');
    let lineH = line.offsetHeight;
    addEventListener('resize', () => { lineH = line.offsetHeight; });
    // Jertig theme: switches on when the pearl reaches the jertig icon, off again above it
    const jertigItem = $('[data-icon="jertig"]').closest('.tl-item');
    let jertigAt = 0;
    const measureJertig = () => {
      const icon = $('.tl-icon', jertigItem);
      jertigAt = (jertigItem.offsetTop + icon.offsetTop + icon.offsetHeight / 2) - line.offsetTop;
    };
    measureJertig();
    addEventListener('resize', measureJertig);
    let jertigOn = false;
    const themeMeta = $('meta[name="theme-color"]');
    function setJertig(on) {
      if (on === jertigOn) return;
      jertigOn = on;
      document.documentElement.classList.toggle('theme-jertig', on);
      Petals.setPalette(on ? 'jertig' : 'garden');
      if (themeMeta) themeMeta.content = on ? '#8a1117' : '#f4eee3';
      if (on) {
        const r = $('.tl-icon', jertigItem).getBoundingClientRect();
        Petals.celebrate(r.left + r.width / 2, r.top + r.height / 2);
      }
    }

    scroll((p) => {
      fill.style.transform = `scaleY(${p})`;
      pearlDot.style.transform = `translate3d(0, ${(p * lineH).toFixed(1)}px, 0)`;
      setJertig(p * lineH >= jertigAt);
    }, { target: tl, offset: ['start 70%', 'end 55%'] });

    $$('.tl-item').forEach((item, i) => {
      inView(item, () => {
        const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
        const side = i % 2 ? -1 : 1;
        const icon = $('.tl-icon', item), text = $('.tl-text', item);
        animate(icon, { opacity: [0, 1], scale: [.6, 1], rotate: [-8 * side, 0] }, { type: 'spring', bounce: .4, duration: .9 });
        animate($$('.draw > *', icon), { strokeDashoffset: [1, 0] }, { duration: 1.4, delay: stagger(.12), ease: 'easeInOut' });
        if (text) animate(text, { opacity: [0, 1], x: [40 * side * dir, 0] }, { duration: 1, delay: .15, ease: SMOOTH });
      }, { amount: .4 });
    });

    // gentle scroll-linked parallax on containers that nothing else animates
    if (!reduced) {
      const drift = (sel, from, to) => $$(sel).forEach((el) => {
        scroll(animate(el, { y: [from, to] }, { ease: 'linear' }), { target: el.closest('.slide'), offset: ['start end', 'end start'] });
      });
      drift('.count-inner', 40, -40);
      drift('.invite-card', 50, -50);
      drift('.sprig', -60, 60);
      drift('.tl', 30, -30);
    }

    // music follows the scroll depth
    scroll((p) => window.Music.setProgress(p));
  }

  // ---------------------------------------------------------------- smooth scrolling
  // Lenis eases wheel/trackpad scrolling; touch keeps the phone's native momentum.
  // It runs inside Motion's frame loop so scroll-linked animations update in the same frame.
  function startSmoothScroll() {
    if (reduced || !window.Lenis) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false, autoRaf: false });
    frame.update(({ timestamp }) => lenis.raf(timestamp), true);
    window.lenis = lenis;
  }

  // ---------------------------------------------------------------- hero intro
  function heroIntro() {
    const svg = $('.wreath svg');
    animate(svg, { opacity: [0, 1], rotate: [-25, 0], scale: [.8, 1] }, { duration: 1.8, ease: EASE });
    if (!reduced) animate($$('.bloom', svg), { scale: [0, 1] }, { delay: stagger(.03, { startDelay: .5 }), type: 'spring', bounce: .5, duration: .9 });
        // the logo "writes" itself in from top to bottom
    animate($('.hero-logo'), { opacity: [0, 1], scale: [.9, 1], clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'] },
      { delay: .7, duration: 1.6, ease: EASE });
  }

  // ---------------------------------------------------------------- gate
  function openGate() {
    const gate = $('.gate');
    if (gate.dataset.opening) return;
    gate.dataset.opening = '1';
    enableGyro();               // iOS needs this inside the tap
    window.Music.start();       // audio also needs the user gesture
    $('#musicToggle').setAttribute('aria-pressed', 'true');
    gate.style.pointerEvents = 'none';

    const env = $('.gate-envelope'), seal = $('.seal'), flap = $('.env-flap'), letter = $('.env-letter');
    const back = $('.env-back'), pocket = $('.env-pocket');
    idle.forEach((a) => a.stop());

    const revealSite = () => {
      document.body.classList.remove('is-locked');
      heroIntro();
      Clouds.init();
      initReveals();
      startSmoothScroll();
      Petals.start();
      setTimeout(() => flock(3), 1200);
      setTimeout(birdLoop, 7000);
    };

    if (reduced) {
      animate(gate, { opacity: [1, 0] }, { duration: .5 });
      setTimeout(() => { gate.remove(); revealSite(); }, 500);
      return;
    }

    // 1 · the wax seal cracks into two halves that fall away
    animate('.gate-copy', { opacity: 0, y: 16 }, { duration: .35 });
    const sr = seal.getBoundingClientRect(), er = env.getBoundingClientRect();
    ['l', 'r'].forEach((side) => {
      const half = document.createElement('div');
      half.className = `seal-half ${side}`;
      half.innerHTML = seal.innerHTML;
      Object.assign(half.style, {
        left: `${sr.left - er.left}px`, top: `${sr.top - er.top}px`, width: `${sr.width}px`, height: `${sr.height}px`,
      });
      env.appendChild(half);
      const dir = side === 'l' ? -1 : 1;
      animate(half, { x: [0, dir * 6, dir * 46], y: [0, -4, innerHeight * .75], rotate: [0, dir * 6, dir * 70] },
        { duration: 1.2, delay: .12, ease: [0.45, 0, 0.7, 1], times: [0, .15, 1] });
      animate(half, { opacity: [1, 0] }, { duration: .5, delay: .75 });
      setTimeout(() => half.remove(), 1400);
    });
    animate(seal, { scale: [1, 1.08] }, { duration: .12 });
    setTimeout(() => { seal.style.visibility = 'hidden'; }, 120);

    // 2 · the flap swings open on its hinge (and slips behind the letter once it passes 90°)
    const T_FLAP = 350;
    setTimeout(() => {
      // hinge on the top edge with a slight overshoot; once it passes 90° (edge-on)
      // it tucks behind the letter so the letter can slide out in front of it
      tween(950, cubicBezier(0.5, 0, 0.25, 1.15), (k) => {
        const deg = k * 180;
        flap.style.transform = `perspective(1400px) rotateX(${deg.toFixed(2)}deg)`;
        if (deg >= 90) flap.style.zIndex = '1';
      });
    }, T_FLAP);

    // 3 · the letter slides up out of the envelope
    const T_SLIDE = T_FLAP + 900;
    const envH = er.height;
    const slideY = -envH * .62;
    setTimeout(() => {
      animate(letter, { y: [0, slideY] }, { duration: .95, ease: [0.22, 1, 0.36, 1] });
      animate(env, { y: [0, envH * .18] }, { duration: .95, ease: [0.22, 1, 0.36, 1] });
    }, T_SLIDE);

    // 4 · the envelope drops away while the letter comes forward and grows into the site
    const T_GROW = T_SLIDE + 950;
    setTimeout(() => {
      letter.style.zIndex = '7';
      [back, pocket, flap].forEach((el) => animate(el, { y: [0, innerHeight * .75], opacity: [1, 1, 0] }, { duration: 1.2, ease: [0.5, 0, 0.75, .7] }));
      const lr = letter.getBoundingClientRect();
      const dx = innerWidth / 2 - (lr.left + lr.width / 2);
      const dy = innerHeight / 2 - (lr.top + lr.height / 2);
      const scale = Math.max(innerWidth / lr.width, innerHeight / lr.height) * 1.04;
      animate($('.letter-inner', letter), { opacity: [1, 1, 0] }, { duration: .9, times: [0, .45, 1], ease: 'easeIn' });
      animate(letter, { x: [0, dx], y: [slideY, slideY + dy], scale: [1, scale], borderRadius: ['4px', '0px'] },
        { duration: 1.25, ease: [0.45, 0, 0.2, 1] });
      Petals.burst(isSmall ? 26 : 40, innerWidth / 2, innerHeight / 2);
    }, T_GROW);

    // 5 · the letter has become the page: fade the gate away over the live site
    const T_SITE = T_GROW + 1100;
    setTimeout(revealSite, T_SITE);
    setTimeout(() => animate(gate, { opacity: [1, 0] }, { duration: .6, ease: 'easeOut' }), T_SITE + 150);
    setTimeout(() => gate.remove(), T_SITE + 900);
  }
  $('.seal').addEventListener('click', openGate);
  $('.gate').addEventListener('click', openGate);
  // before the tap: the envelope floats gently and the seal breathes
  const idle = reduced ? [] : [
    animate('.gate-envelope', { y: [0, -8, 0], rotate: [-.6, .6, -.6] }, { duration: 5, repeat: Infinity, ease: 'easeInOut' }),
    animate('.seal', { scale: [1, 1.05, 1] }, { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }),
  ];
  animate('.gate-envelope', { opacity: [0, 1], scale: [.94, 1] }, { duration: .9, ease: EASE });
  animate('.gate-copy', { opacity: [0, 1], y: [12, 0] }, { duration: 1, delay: .4 });
  if (new URLSearchParams(location.search).has('autoopen')) setTimeout(openGate, 1000);

  // ---------------------------------------------------------------- music toggle
  $('#musicToggle').addEventListener('click', () => {
    const muted = window.Music.toggle();
    $('#musicToggle').setAttribute('aria-pressed', String(!muted));
  });
  $('#musicToggle').setAttribute('aria-pressed', 'false');

  // ---------------------------------------------------------------- private message to the couple
  const form = $('#msgForm'), formMsg = $('.form-msg', form), done = $('.msg-done');
  const nameIn = $('#guestName'), msgIn = $('#guestMsg');
  msgIn.addEventListener('input', () => { $('#msgCount').textContent = msgIn.value.length; });
  const shake = (el) => { animate(el, { x: [0, -8, 8, -5, 5, 0] }, { duration: .4 }); el.focus(); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameIn.value.trim(), message = msgIn.value.trim();
    formMsg.textContent = '';
    if (!name) { formMsg.textContent = t('msg.needName'); return shake(nameIn); }
    if (!message) { formMsg.textContent = t('msg.needMsg'); return shake(msgIn); }
    const btn = $('button', form), label = $('span', btn);
    btn.disabled = true;
    label.textContent = t('msg.sending');
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, message, lang,
          client: {
            lang: navigator.language,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${screen.width}×${screen.height} @${devicePixelRatio || 1}x`,
            platform: navigator.userAgentData?.platform || navigator.platform || '',
            touch: navigator.maxTouchPoints || 0,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));

      // celebrate from the middle of the form, then remove it and thank the guest
      const r = form.getBoundingClientRect();
      Petals.celebrate(r.left + r.width / 2, r.top + r.height / 2);
      animate(form, { opacity: [1, 0], scale: [1, .92], filter: ['blur(0px)', 'blur(6px)'] }, { duration: .35, ease: 'easeIn' });
      await wait(360);
      form.remove();
      $('.thanks', done).textContent = t('msg.thanks').replace('{name}', name);
      done.hidden = false;
      animate($('.msg-done-heart', done), { scale: [0, 1.25, 1], rotate: [-20, 8, 0] }, { duration: .9, ease: [0.34, 1.56, 0.64, 1] });
      animate($$('.thanks, .thanks-sub', done), { opacity: [0, 1], y: [16, 0] }, { delay: stagger(.15, { startDelay: .25 }), duration: .8, ease: EASE });
      setTimeout(() => { const d = done.getBoundingClientRect(); Petals.celebrate(d.left + d.width / 2, d.top + 30); }, 900);
      flock(4);
    } catch {
      formMsg.textContent = t('msg.error');
      btn.disabled = false;
      label.textContent = t('msg.send');
    }
  });

  applyLang();

  // ---------------------------------------------------------------- ?snapshot
  // Used by `npm run og` to capture the link-preview image: no gate, no controls,
  // hero fully revealed with petals and a flock of birds.
  // ?snapshot=<section id> captures that section instead (e.g. ?snapshot=countdown).
  const snapshotAt = new URLSearchParams(location.search).get('snapshot');
  if (snapshotAt !== null) {
    document.documentElement.classList.add('snapshot');
    // &theme=jertig previews the Jertig theme
    if (new URLSearchParams(location.search).get('theme') === 'jertig') {
      document.documentElement.classList.add('theme-jertig');
      Petals.setPalette('jertig');
    }
    $('.gate').remove();
    document.body.classList.remove('is-locked');
    // final states only (CSS .snapshot rules) so the capture never lands mid-animation
    Petals.start();
    Petals.scatter(38);
    const target = snapshotAt && document.getElementById(snapshotAt);
    if (target) {
      // show only that section (headless screenshots don't capture scrolled pages reliably)
      $$('.slide').forEach((sl) => { if (sl !== target) sl.style.display = 'none'; });
      Clouds.init();
    }
    const birdAt = (x, y, sc) => {
      const b = document.createElement('div');
      b.className = 'bird';
      b.innerHTML = BIRD;
      b.style.transform = `translate(${innerWidth * x}px, ${y}px) scale(${sc})`;
      $('.birds').appendChild(b);
    };
    if (target) {
      // a flock crossing the cloud band, partly hidden behind the clouds
      const band = 60;
      [[.2, 0, .7], [.26, 22, .55], [.33, -8, .6], [.45, 30, .75], [.58, 6, .65], [.7, 26, .6]].forEach(([x, dy, sc]) => birdAt(x, band + dy, sc));
    } else {
      [[.11, .15, .7], [.15, .19, .55], [.12, .2, .5], [.155, .245, .75], [.18, .19, .8], [.155, .29, .7]].forEach(([x, y, sc]) => birdAt(x, innerHeight * y, sc));
    }
  }
})();
