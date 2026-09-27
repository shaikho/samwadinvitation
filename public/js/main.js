(function () {
  const { animate, inView, scroll, stagger } = window.Motion;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 640px)').matches;
  const EASE = [0.22, 1, 0.36, 1];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const WEDDING = new Date('2026-10-20T20:00:00+03:00'); // 8:00 PM Cairo
  const VENUE = { lat: 29.9310476, lng: 30.9494757, name: 'Mountain Rose Hotel, 6th of October City, Giza, Egypt' };

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
    animate(main, { opacity: [1, 0], filter: ['blur(0px)', 'blur(6px)'] }, { duration: 0.25 });
    await wait(260);
    applyLang();
    animate(main, { opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] }, { duration: 0.45 });
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
  const charmHolders = [];

  function tiltLoop(now) {
    const idle = tilt.hasGyro ? 0 : 0.12;
    const tx = tilt.tx + Math.sin(now / 3100) * idle;
    const ty = tilt.ty + Math.cos(now / 3700) * idle;
    tilt.x += (tx - tilt.x) * 0.06;
    tilt.y += (ty - tilt.y) * 0.06;
    const sy = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);

    for (const { el, d } of layers) {
      el.style.transform = `translate3d(${(-tilt.x * 34 * d).toFixed(2)}px, ${(-tilt.y * 34 * d - sy * 120 * d).toFixed(2)}px, 0) rotateX(${(tilt.y * 4).toFixed(2)}deg) rotateY(${(-tilt.x * 4).toFixed(2)}deg)`;
    }
    for (const el of tilters) {
      el.style.transform = `perspective(1100px) rotateY(${(tilt.x * 7).toFixed(2)}deg) rotateX(${(-tilt.y * 7).toFixed(2)}deg)`;
    }
    for (const el of charmHolders) {
      el.style.transform = `rotate(${(-tilt.x * 14).toFixed(2)}deg)`;
    }
    requestAnimationFrame(tiltLoop);
  }
  if (!reduced) requestAnimationFrame(tiltLoop);

  // ---------------------------------------------------------------- petals canvas
  const Petals = (function () {
    const cv = $('.petals');
    const ctx = cv.getContext('2d');
    const colors = ['#eab7be', '#f3d2d0', '#d99aa5', '#f7e4dc', '#cdbfe4', '#f0c9c4'];
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
      });
    }
    function burst(n, x, y) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3.5;
        spawn({ x: x ?? W / 2, y: y ?? H / 2, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5, a: 1, life: 260 + Math.random() * 200 });
      }
    }
    function draw(p) {
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
        p.vy -= dy * .012;
        p.vx += (wind + Math.sin(now / 1400 + p.flip) * .25 - p.vx) * .015 * dt;
        p.vy += (.55 - p.vy) * .012 * dt;
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
    return { start, burst: reduced ? () => {} : burst };
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
    const wrap = $('.birds');
    const el = document.createElement('div');
    el.className = 'bird';
    el.innerHTML = BIRD;
    wrap.appendChild(el);
    const ltr = opts.ltr ?? Math.random() < .5;
    const W = innerWidth, H = innerHeight;
    const size = opts.scale ?? (.55 + Math.random() * .6);
    const y0 = opts.y ?? H * (.08 + Math.random() * .45);
    const from = ltr ? -60 : W + 60, to = ltr ? W + 60 : -60;
    const steps = 6;
    const xs = [], ys = [];
    for (let i = 0; i <= steps; i++) {
      xs.push(from + (to - from) * (i / steps));
      ys.push(y0 + Math.sin(i * 1.3 + Math.random()) * 26 - i * (opts.rise ?? 6));
    }
    el.style.scale = `${ltr ? size : -size} ${size}`;
    const dur = opts.duration ?? (W / 90 + 4 + Math.random() * 4);
    animate(el, { x: xs, y: ys }, { duration: dur, ease: 'linear', delay: opts.delay ?? 0 })
      .finished.then(() => el.remove());
  }
  function flock(n = 3) {
    const ltr = Math.random() < .5;
    const y = innerHeight * (.12 + Math.random() * .3);
    for (let i = 0; i < n; i++) flyBird({ ltr, y: y + (i % 2 ? 22 : -8) * i, delay: i * .35, scale: .5 + Math.random() * .35, duration: innerWidth / 110 + 5 });
  }
  function birdLoop() {
    Math.random() < .3 ? flock(2 + ((Math.random() * 2) | 0)) : flyBird();
    setTimeout(birdLoop, 6000 + Math.random() * 7000);
  }

  // ---------------------------------------------------------------- countdown charms
  const GOLD = 'url(#goldGrad)';
  const charmShapes = {
    heart: (L) => `<path d="M20 ${L + 24}C6 ${L + 15} 7 ${L + 2} 15 ${L + 3}c3 0 5 3 5 3s2-3 5-3c8-1 9 12-5 21z" fill="${GOLD}"/>`,
    ring: (L) => `<circle cx="20" cy="${L + 14}" r="8.5" fill="none" stroke="${GOLD}" stroke-width="3"/><path d="M16 ${L + 5}l4-5 4 5-4 3z" fill="#eaf4ff" stroke="#b8975f" stroke-width=".6"/>`,
    pearl: (L) => `<circle cx="20" cy="${L + 9}" r="7" fill="url(#pearl)"/><circle cx="20" cy="${L + 1}" r="2" fill="${GOLD}"/>`,
    star: (L) => `<path d="M20 ${L}l3.2 7.6 8.2.7-6.2 5.4 1.9 8-7.1-4.3-7.1 4.3 1.9-8-6.2-5.4 8.2-.7z" fill="${GOLD}"/>`,
    moon: (L) => `<path d="M24 ${L + 1}a11 11 0 1 0 8 16 9 9 0 0 1-8-16z" fill="${GOLD}"/>`,
    bird: (L) => `<g transform="translate(4 ${L - 2}) scale(.8)"><path d="M6 19c2-7 12-9 20-7 1-4 7-5 9-1l4 2-4 2c-1 7-9 13-18 12-6-1-10-4-11-8z" fill="#4aa3df"/><path d="M8 19 1 14l2 6-3 4 9-2z" fill="#3f8fcf"/><path d="M14 17C17 8 23 4 28 3c-3 6-5 11-9 15z" fill="#3a8fd0"/><circle cx="32" cy="11.5" r="1" fill="#fff"/></g>`,
    rose: (L) => `<g transform="translate(20 ${L + 10})"><circle r="9" fill="#e7b9bd" stroke="#c98491" stroke-dasharray="1.6 1"/><circle r="5.5" fill="#c98491"/><circle r="2.6" fill="#a9606f"/></g>`,
  };
  function buildCharms() {
    const box = $('.charms');
    const specs = [
      [5, 70, 'pearl'], [15, 150, 'heart'], [26, 95, 'bird'], [38, 185, 'star'],
      [50, 120, 'ring'], [62, 175, 'rose'], [74, 90, 'bird'], [85, 140, 'moon'], [95, 60, 'pearl'],
    ];
    const use = isSmall ? specs.filter((_, i) => i % 2 === 0 || i === 3 || i === 5) : specs;
    use.forEach(([left, L, shape], i) => {
      // keep the longest charm clear of the (vertically centred) countdown
      const h = Math.round(L * Math.min(1, (innerHeight * .19) / 185));
      let beads = '';
      for (let y = 14; y < h - 8; y += 16) beads += `<circle cx="20" cy="${y}" r="${i % 2 ? 2.4 : 1.8}" fill="url(#pearl)"/>`;
      const holder = document.createElement('div');
      holder.className = 'charm';
      holder.style.left = `calc(${left}% - 20px)`;
      holder.innerHTML = `<div class="swing"><svg width="40" height="${h + 30}" viewBox="0 0 40 ${h + 30}">
        <path d="M20 0V${h}" stroke="#b8975f" stroke-width=".9" stroke-dasharray="2.5 1.5"/>${beads}${charmShapes[shape](h)}</svg></div>`;
      box.appendChild(holder);
      charmHolders.push(holder);
      const swing = $('.swing', holder);
      swing.style.transformOrigin = 'top center';
      if (!reduced) {
        const a = 3 + Math.random() * 4;
        animate(swing, { rotate: [-a, a] }, { duration: 2.4 + Math.random() * 1.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: -Math.random() * 2 });
      }
    });
  }
  buildCharms();

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
  function layoutMonogram(box) {
    const spans = $$('.l', box);
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    const isAmp = spans.map((sp) => sp.classList.contains('l-amp'));
    const [fitW, fitH] = (box.dataset.fit || '0.9,0.9').split(',').map(Number);
    let ms, xs, x, gap, top, bot;
    const measure = () => {
      ms = spans.map((sp) => inkMetrics(sp, sp.textContent));
      gap = ms[0].size * .04;
      xs = [];
      x = 0;
      ms.forEach((m) => { const ox = x - m.l; xs.push(ox); x = ox + m.r + gap; });
      const letters = ms.filter((_, i) => !isAmp[i]);
      top = Math.min(...letters.map((m) => m.t));
      bot = Math.max(...letters.map((m) => m.b));
    };
    // shrink the whole monogram until its ink fits the space (script swashes are wide)
    box.style.fontSize = '';
    measure();
    const scale = Math.min(1, (W * fitW) / (x - gap), (H * fitH) / (bot - top));
    if (scale < 1) {
      box.style.fontSize = `${(parseFloat(getComputedStyle(box).fontSize) * scale).toFixed(2)}px`;
      measure();
    }
    const startX = (W - (x - gap)) / 2;
    const sharedBase = H / 2 - (top + bot) / 2; // S and W share one baseline
    ms.forEach((m, i) => {
      const baseline = isAmp[i] ? H / 2 - (m.t + m.b) / 2 : sharedBase; // & sits on the optical centre
      spans[i].style.left = `${(startX + xs[i]).toFixed(1)}px`;
      spans[i].style.top = `${(baseline - m.base).toFixed(1)}px`;
    });
    box.classList.add('is-laid-out');
  }
  function centerSvgText(el) {
    const [cx, cy] = el.dataset.centerInk.split(',').map(Number);
    el.style.fontSize = '';
    let m = inkMetrics(el, el.textContent);
    const fit = Number(el.dataset.fit);
    const w = m.r - m.l, hgt = m.b - m.t;
    if (fit && Math.max(w, hgt) > fit) {
      el.style.fontSize = `${(m.size * fit / Math.max(w, hgt)).toFixed(2)}px`;
      m = inkMetrics(el, el.textContent);
    }
    el.setAttribute('text-anchor', 'start');
    el.setAttribute('x', (cx - (m.l + m.r) / 2).toFixed(1));
    el.setAttribute('y', (cy - (m.t + m.b) / 2).toFixed(1));
  }
  function centerAll() {
    $$('[data-monogram]').forEach(layoutMonogram);
    $$('[data-center-ink]').forEach(centerSvgText);
    $$('.num').forEach(centerInk);
  }
  const fontsReady = Promise.all([
    document.fonts.load('60px Armelie'),
    document.fonts.load('40px "Cormorant Garamond"'),
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
      ? 'فتح الأبواب ٧:٠٠ مساءً · بدء الحفل ٨:٠٠ مساءً\nفندق ماونتن روز'
      : 'Doors open 7:00 PM · Celebration 8:00 PM\nMountain Rose Hotel';
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
          animate(el, { opacity: [0, 1], y: [28, 0], filter: ['blur(8px)', 'blur(0px)'] }, { duration: 1, delay: Math.min(i, 6) * .09, ease: EASE });
        }, { amount: .2 });
      });
    });

    // venue frame: card unfolds, blooms pop, then the text
    inView('.frame', (frame) => {
      const art = $('.frame-art', frame);
      animate(art, {
        opacity: [0, 1],
        scale: [.92, 1],
        y: [40, 0],
        clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'],
      }, { duration: 1.4, ease: EASE });
      animate($$('.frame-content > *', frame), { opacity: [0, 1], y: [18, 0] }, { delay: stagger(.09, { startDelay: .6 }), duration: .8, ease: EASE });
      Petals.burst(isSmall ? 14 : 22, innerWidth / 2, innerHeight * .35);
    }, { amount: .25 });

    // story arch
    inView('.arch', (arch) => {
      const art = $('.arch-art', arch);
      animate(art, {
        opacity: [0, 1],
        scale: [.94, 1],
        clipPath: ['circle(0% at 50% 100%)', 'circle(150% at 50% 100%)'],
      }, { duration: 1.6, ease: EASE });
    }, { amount: .25 });

    // countdown: birds greet you
    inView('#countdown', () => { flock(3); }, { amount: .4 });

    // timeline
    const tl = $('.tl');
    const fill = $('.tl-fill'), pearlDot = $('.tl-pearl');
    scroll((p) => {
      fill.style.transform = `scaleY(${p})`;
      pearlDot.style.top = `${p * 100}%`;
    }, { target: tl, offset: ['start 70%', 'end 55%'] });

    $$('.tl-item').forEach((item, i) => {
      inView(item, () => {
        const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
        const side = i % 2 ? -1 : 1;
        const icon = $('.tl-icon', item), text = $('.tl-text', item);
        animate(icon, { opacity: [0, 1], scale: [.6, 1], rotate: [-8 * side, 0] }, { type: 'spring', bounce: .4, duration: .9 });
        animate($$('.draw > *', icon), { strokeDashoffset: [1, 0] }, { duration: 1.4, delay: stagger(.12), ease: 'easeInOut' });
        animate(text, { opacity: [0, 1], x: [40 * side * dir, 0] }, { duration: .9, delay: .15, ease: EASE });
      }, { amount: .5 });
    });

    // music follows the scroll depth
    scroll((p) => window.Music.setProgress(p));
  }

  // ---------------------------------------------------------------- hero intro
  function heroIntro() {
    const svg = $('.wreath svg');
    animate(svg, { opacity: [0, 1], rotate: [-25, 0], scale: [.8, 1] }, { duration: 1.8, ease: EASE });
    if (!reduced) animate($$('.bloom', svg), { scale: [0, 1] }, { delay: stagger(.03, { startDelay: .5 }), type: 'spring', bounce: .5, duration: .9 });
    animate($$('.letters .l'), { opacity: [0, 1], y: [40, 0], filter: ['blur(10px)', 'blur(0px)'] }, { delay: stagger(.2, { startDelay: .7 }), duration: 1.1, ease: EASE });
  }

  // ---------------------------------------------------------------- gate
  function openGate() {
    const gate = $('.gate');
    if (gate.dataset.opening) return;
    gate.dataset.opening = '1';
    enableGyro();               // iOS needs this inside the tap
    window.Music.start();       // audio also needs the user gesture
    $('#musicToggle').setAttribute('aria-pressed', 'true');

    const seal = $('.seal'), copy = $('.gate-copy');
    animate(copy, { opacity: 0, y: 20 }, { duration: .4 });
    animate(seal, { scale: [1, 1.15, 0.2], rotate: [0, -10, 25], opacity: [1, 1, 0] }, { duration: .9, ease: EASE });
    Petals.burst(isSmall ? 26 : 40, innerWidth / 2, innerHeight / 2);

    const doorOpts = { duration: 1.7, delay: .45, ease: [0.7, 0, 0.2, 1] };
    animate('.door-left', { rotateY: [0, -105], opacity: [1, 1, 0] }, doorOpts);
    animate('.door-right', { rotateY: [0, 105], opacity: [1, 1, 0] }, doorOpts);
    gate.style.pointerEvents = 'none';
    setTimeout(() => gate.remove(), 2300);
    setTimeout(() => {
      document.body.classList.remove('is-locked');
      heroIntro();
      initReveals();
      Petals.start();
      setTimeout(() => flock(3), 1200);
      setTimeout(birdLoop, 7000);
    }, 700);
  }
  $('.seal').addEventListener('click', openGate);
  $('.gate').addEventListener('click', (e) => { if (e.target.closest('.gate')) openGate(); });
  animate('.seal', { scale: [1, 1.05, 1] }, { duration: 2.2, repeat: Infinity, ease: 'easeInOut' });
  animate('.gate-copy', { opacity: [0, 1], y: [12, 0] }, { duration: 1, delay: .4 });

  // ---------------------------------------------------------------- music toggle
  $('#musicToggle').addEventListener('click', () => {
    const muted = window.Music.toggle();
    $('#musicToggle').setAttribute('aria-pressed', String(!muted));
  });
  $('#musicToggle').setAttribute('aria-pressed', 'false');

  // ---------------------------------------------------------------- RSVP
  const form = $('#rsvpForm'), msg = $('.form-msg', form), done = $('.rsvp-done');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#guestName');
    const name = input.value.trim();
    msg.textContent = '';
    if (!name) {
      animate(input, { x: [0, -8, 8, -5, 5, 0] }, { duration: .4 });
      input.focus();
      return;
    }
    const btn = $('button', form), label = $('span', btn);
    btn.disabled = true;
    label.textContent = t('rsvp.sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      $('.thanks', done).textContent = t('rsvp.thanks').replace('{name}', name);
      animate(form, { opacity: [1, 0], y: [0, -10] }, { duration: .3 });
      await wait(310);
      form.hidden = true;
      done.hidden = false;
      animate(done, { opacity: [0, 1], scale: [.9, 1] }, { type: 'spring', bounce: .4, duration: .7 });
      const r = $('.thanks', done).getBoundingClientRect();
      Petals.burst(isSmall ? 30 : 50, r.left + r.width / 2, r.top + r.height / 2);
      flock(4);
      input.value = '';
    } catch {
      msg.textContent = t('rsvp.error');
    } finally {
      btn.disabled = false;
      label.textContent = t('rsvp.submit');
    }
  });
  $('#rsvpAgain').addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    animate(form, { opacity: [0, 1], y: [10, 0] }, { duration: .4 });
    $('#guestName').focus();
  });

  applyLang();
})();
