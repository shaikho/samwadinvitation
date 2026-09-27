// Procedural "embroidered garden" artwork — roses, wisteria, leaves, knots and pearls,
// all drawn as SVG so it stays crisp on every screen and weighs almost nothing.
(function () {
  const C = {
    roses: [
      ['#a9606f', '#c98491', '#e7b9bd'],
      ['#b97583', '#d69ea6', '#f0cdcc'],
      ['#c7847c', '#e0a79d', '#f4d3c8'],
    ],
    leaves: ['#86997a', '#7a8e6c', '#93a687', '#6d8161'],
    leafVein: '#c3d0b3',
    stem: '#6f7f5f',
    wis: ['#8f78b3', '#a590c7', '#bba9d8', '#cdbfe4', '#9c86bd'],
    cream: '#fbf6ec',
    creamEdge: '#e2d6c2',
    gold: '#b8975f',
  };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (n) => Math.round(n * 10) / 10;
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  function leaf(x, y, ang, s, col) {
    const sat = [];
    for (let k = 1; k <= 4; k++) {
      const xk = s * (0.12 + 0.17 * k);
      sat.push(`M${f(xk)} 0L${f(xk + s * 0.1)} ${f(-s * 0.19)}M${f(xk)} 0L${f(xk + s * 0.1)} ${f(s * 0.19)}`);
    }
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">` +
      `<path d="M0 0C${f(s * .25)} ${f(-s * .4)} ${f(s * .72)} ${f(-s * .36)} ${f(s)} 0C${f(s * .72)} ${f(s * .36)} ${f(s * .25)} ${f(s * .4)} 0 0Z" fill="${col}"/>` +
      `<path d="${sat.join('')}" stroke="${C.leafVein}" stroke-width=".6" opacity=".55" fill="none"/>` +
      `<path d="M${f(s * .06)} 0L${f(s * .92)} 0" stroke="${C.leafVein}" stroke-width=".9" stroke-dasharray="2.2 1.4" fill="none"/></g>`;
  }

  function rose(x, y, r, tone, rot = 0, cls = 'bloom') {
    const [deep, mid, light] = tone;
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><g class="${cls}">`;
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 * Math.PI) / 180;
      s += `<ellipse cx="${f(Math.cos(a) * r * .46)}" cy="${f(Math.sin(a) * r * .46)}" rx="${f(r * .56)}" ry="${f(r * .42)}" transform="rotate(${i * 60} ${f(Math.cos(a) * r * .46)} ${f(Math.sin(a) * r * .46)})" fill="${light}" stroke="${mid}" stroke-width=".7" stroke-dasharray="1.6 1.1"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 + 30) * Math.PI) / 180;
      s += `<ellipse cx="${f(Math.cos(a) * r * .24)}" cy="${f(Math.sin(a) * r * .24)}" rx="${f(r * .38)}" ry="${f(r * .3)}" transform="rotate(${i * 72 + 30} ${f(Math.cos(a) * r * .24)} ${f(Math.sin(a) * r * .24)})" fill="${mid}"/>`;
    }
    const q = r * .13;
    s += `<circle r="${f(r * .3)}" fill="${deep}"/>` +
      `<path d="M${f(-q)} 0a${f(q)} ${f(q)} 0 1 1 ${f(q * 1.7)} ${f(q * .5)}a${f(q * 1.6)} ${f(q * 1.6)} 0 1 1 ${f(-q * 2.6)} ${f(-q * .9)}" stroke="${light}" stroke-width=".9" fill="none" opacity=".85"/></g></g>`;
    return s;
  }

  function flower(x, y, r, cls = 'bloom') {
    let s = `<g transform="translate(${f(x)} ${f(y)})"><g class="${cls}">`;
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      s += `<circle cx="${f(Math.cos(a) * r * .55)}" cy="${f(Math.sin(a) * r * .55)}" r="${f(r * .52)}" fill="${C.cream}" stroke="${C.creamEdge}" stroke-width=".7"/>`;
    }
    return s + `<circle r="${f(r * .3)}" fill="#e3c98f"/><circle r="${f(r * .12)}" fill="${C.gold}"/></g></g>`;
  }

  const knot = (x, y, r, col) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}"/><circle cx="${f(x - r * .3)}" cy="${f(y - r * .3)}" r="${f(r * .35)}" fill="#fff" opacity=".45"/>`;

  const pearl = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#pearl)"/>`;

  function wisteria(x, y, len, w, r, sway = false) {
    const n = Math.round(len / 4.2);
    let s = `<g class="${sway ? 'sway' : ''}" style="transform-origin:${f(x)}px ${f(y)}px">`;
    s += `<path d="M${f(x)} ${f(y)}Q${f(x + 3)} ${f(y + len * .4)} ${f(x)} ${f(y + len * .9)}" stroke="${C.stem}" stroke-width=".9" fill="none"/>`;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const spread = w * (1 - t * .85) * .5;
      const xx = x + (r() * 2 - 1) * spread + Math.sin(t * 5) * 1.5;
      const yy = y + 4 + t * len;
      const rr = w * .1 * (1 - t * .5) + 1.1;
      s += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(rr)}" ry="${f(rr * .8)}" fill="${pick(r, C.wis)}" stroke="#7d68a0" stroke-width=".35"/>`;
    }
    s += leaf(x, y + 2, 200 + r() * 30, 12, C.leaves[1]) + leaf(x, y + 2, -20 - r() * 30, 12, C.leaves[0]);
    return s + '</g>';
  }

  function vineAlong(points, r, opts = {}) {
    const { leafEvery = 2, leafSize = 13, width = 1.6 } = opts;
    let d = `M${f(points[0][0])} ${f(points[0][1])}`;
    for (let i = 1; i < points.length; i++) d += `L${f(points[i][0])} ${f(points[i][1])}`;
    let s = `<path class="vine" d="${d}" stroke="${C.stem}" stroke-width="${width}" fill="none" stroke-dasharray="3.5 1.6" stroke-linecap="round"/>`;
    for (let i = 1; i < points.length - 1; i += leafEvery) {
      const [x, y] = points[i];
      const [nx, ny] = points[i + 1];
      const ang = (Math.atan2(ny - y, nx - x) * 180) / Math.PI;
      const side = i % (leafEvery * 2) === 1 ? 1 : -1;
      s += leaf(x, y, ang + side * (40 + r() * 25), leafSize * (.75 + r() * .45), pick(r, C.leaves));
    }
    return s;
  }

  function cluster(x, y, scale, r, flip = 1) {
    let s = '';
    for (let i = 0; i < 7; i++) {
      const a = r() * 360;
      s += leaf(x + (r() - .5) * 22 * scale, y + (r() - .5) * 18 * scale, a, 16 * scale, pick(r, C.leaves));
    }
    s += rose(x, y, 15 * scale, C.roses[0], r() * 60);
    s += rose(x + 20 * scale * flip, y + 12 * scale, 11 * scale, C.roses[1], r() * 60);
    s += rose(x - 12 * scale * flip, y + 18 * scale, 9 * scale, C.roses[2], r() * 60);
    s += flower(x + 26 * scale * flip, y - 8 * scale, 6 * scale);
    s += flower(x - 18 * scale * flip, y - 6 * scale, 5 * scale);
    for (let i = 0; i < 5; i++) s += knot(x + (r() - .5) * 50 * scale, y + (r() - .5) * 40 * scale, 1.5, pick(r, ['#e7b9bd', '#fbf6ec', '#cdbfe4']));
    return s;
  }

  // ---------- Location frame (the embroidered card) ----------
  function frame() {
    const r = rng(20261020);
    const W = 400, H = 760;
    const L = 38, R = 362, T = 44, B = 640;
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;

    // scalloped lace edge behind the card
    s += '<g>';
    for (let x = L; x <= R; x += 11) s += `<circle cx="${x}" cy="${T}" r="5.5" fill="${C.cream}" stroke="${C.creamEdge}" stroke-width=".6"/><circle cx="${x}" cy="${B}" r="5.5" fill="${C.cream}" stroke="${C.creamEdge}" stroke-width=".6"/>`;
    for (let y = T; y <= B; y += 11) s += `<circle cx="${L}" cy="${y}" r="5.5" fill="${C.cream}" stroke="${C.creamEdge}" stroke-width=".6"/><circle cx="${R}" cy="${y}" r="5.5" fill="${C.cream}" stroke="${C.creamEdge}" stroke-width=".6"/>`;
    s += '</g>';
    s += `<rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" fill="url(#linen)"/>`;
    s += `<rect x="${L + 9}" y="${T + 9}" width="${R - L - 18}" height="${B - T - 18}" fill="none" stroke="${C.gold}" stroke-width=".8" stroke-dasharray="1 2.6" opacity=".8"/>`;
    s += `<rect x="${L + 14}" y="${T + 14}" width="${R - L - 28}" height="${B - T - 28}" fill="none" stroke="${C.creamEdge}" stroke-width=".6"/>`;

    s += '<g filter="url(#emb)">';
    // side vines
    const side = (x0, dir) => {
      const pts = [];
      for (let y = T + 40; y <= B - 30; y += 11) pts.push([x0 + Math.sin(y / 26) * 5 * dir, y]);
      let v = vineAlong(pts, r, { leafEvery: 2, leafSize: 12 });
      for (let y = T + 150; y < B - 60; y += 125) v += rose(x0 + dir * 2, y, 8 + r() * 3, pick(r, C.roses), r() * 60);
      for (let y = T + 95; y < B - 40; y += 70) v += flower(x0 - dir * 6, y, 4.5);
      return v;
    };
    s += side(L + 16, 1) + side(R - 16, -1);

    // top swag garland
    const swag = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      swag.push([L + 40 + t * (R - L - 80), T + 16 + Math.sin(t * Math.PI) * 44]);
    }
    s += vineAlong(swag, r, { leafEvery: 1, leafSize: 10, width: 1.2 });
    for (let i = 3; i < 30; i += 4) s += (i % 8 === 3 ? flower : (x, y, rr) => knot(x, y, rr * .5, '#cdbfe4'))(swag[i][0], swag[i][1] + 3, 5);

    // wisteria cascades from the top corners
    [[L + 34, 150], [L + 56, 118], [L + 78, 92], [L + 98, 70]].forEach(([x, len]) => { s += wisteria(x, T + 20, len, 20, r); });
    [[R - 34, 150], [R - 56, 118], [R - 78, 92], [R - 98, 70]].forEach(([x, len]) => { s += wisteria(x, T + 20, len, 20, r); });

    // corner rose clusters
    s += cluster(L + 18, T + 14, 1.15, r, 1) + cluster(R - 18, T + 14, 1.15, r, -1);

    // bottom garland
    const bot = [];
    for (let i = 0; i <= 34; i++) bot.push([L + 4 + (i / 34) * (R - L - 8), B - 6 + Math.sin(i * .9) * 3]);
    s += vineAlong(bot, r, { leafEvery: 1, leafSize: 13 });
    for (let i = 1; i < 34; i += 3) s += rose(bot[i][0], bot[i][1] - 2, 9 + r() * 5, pick(r, C.roses), r() * 60);
    for (let i = 2; i < 34; i += 3) s += flower(bot[i][0], bot[i][1] + 6, 5.5);
    s += cluster(L + 14, B - 8, 1.1, r, 1) + cluster(R - 14, B - 8, 1.1, r, -1);
    s += '</g></svg>';
    return s;
  }

  // Dangling threads & blossoms below the card. Kept in their own light, unfiltered SVG
  // so their continuous sway never forces the embroidered card to repaint.
  function frameThreads() {
    const r = rng(1310);
    const L = 38, R = 362, B = 640;
    let s = '<svg class="threads" viewBox="0 0 400 760" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    for (let i = 0; i < 17; i++) {
      const x = L + 12 + i * ((R - L - 24) / 16) + (r() - .5) * 6;
      const len = 55 + r() * 70;
      s += `<g class="sway" style="transform-origin:${f(x)}px ${B + 6}px"><path d="M${f(x)} ${B + 6}L${f(x)} ${f(B + 6 + len)}" stroke="${C.stem}" stroke-width=".7" stroke-dasharray="2.4 1.4"/>`;
      for (let k = 12; k < len; k += 13) {
        s += i % 3 === 0
          ? `<ellipse cx="${f(x + (k % 26 ? 3 : -3))}" cy="${f(B + 6 + k)}" rx="2.4" ry="1.9" fill="${pick(r, C.wis)}"/>`
          : leaf(x, B + 6 + k, k % 26 ? 35 : 145, 7, pick(r, C.leaves));
      }
      s += (i % 2 ? pearl(x, B + 8 + len, 2.6) : flower(x, B + 8 + len, 4.2)) + '</g>';
    }
    return s + '</svg>';
  }

  // Large static pieces are rasterised once as <img> (filters run a single time),
  // instead of being re-filtered on every repaint while the page animates.
  const DEFS = `<defs>
    <filter id="emb" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feDropShadow in="d" dx="0" dy="0.9" stdDeviation="0.6" flood-color="#5b4a3a" flood-opacity="0.35"/>
    </filter>
    <pattern id="linen" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#f7f1e6"/><path d="M0 1.5H6M0 4.5H6" stroke="#ebe2d1" stroke-width=".7"/><path d="M1.5 0V6M4.5 0V6" stroke="#efe7d8" stroke-width=".5"/>
    </pattern>
    <radialGradient id="pearl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f1e9df"/><stop offset="1" stop-color="#cfc1b0"/></radialGradient>
  </defs>`;
  function asImage(svg, cls = '') {
    const [, , , vw, vh] = svg.match(/viewBox="(\S+) (\S+) (\S+) (\S+)"/);
    const withDefs = svg
      .replace('<svg ', `<svg width="${vw * 3}" height="${vh * 3}" `)
      .replace(/(<svg[^>]*>)/, `$1${DEFS}`);
    return `<img class="${cls}" alt="" decoding="async" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(withDefs)}">`;
  }

  // ---------- Floral arch (Our Story) ----------
  function arch() {
    const r = rng(1020);
    const cx = 200, cy = 250, rad = 145, top = cy, bottom = 620;
    const pts = [];
    for (let y = bottom; y >= top; y -= 10) pts.push([cx - rad, y]);
    for (let a = 180; a >= 0; a -= 4) pts.push([cx + Math.cos((a * Math.PI) / 180) * rad, cy - Math.sin((a * Math.PI) / 180) * rad]);
    for (let y = top; y <= bottom; y += 10) pts.push([cx + rad, y]);
    // make it a little organic
    const organic = pts.map(([x, y], i) => [x + Math.sin(i * .7) * 3, y + Math.cos(i * .5) * 2]);

    let s = '<svg viewBox="0 0 400 660" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#emb)">';
    s += vineAlong(organic, r, { leafEvery: 1, leafSize: 15, width: 2 });
    // inner second vine for fullness
    s += vineAlong(organic.map(([x, y]) => [x + (x < cx ? 6 : -6), y + 4]), r, { leafEvery: 2, leafSize: 11, width: 1 });
    // wisteria hanging inside the crown
    for (let a = 58; a <= 122; a += 9) {
      const x = cx + Math.cos((a * Math.PI) / 180) * (rad - 8);
      const y = cy - Math.sin((a * Math.PI) / 180) * (rad - 8);
      s += wisteria(x, y, 50 + (1 - Math.abs(a - 90) / 32) * 40 + r() * 16, 18, r);
    }
    organic.forEach(([x, y], i) => {
      if (i % 6 === 0) s += rose(x, y, 12 + r() * 7, pick(r, C.roses), r() * 60);
      else if (i % 6 === 3) s += flower(x + (r() - .5) * 10, y + (r() - .5) * 10, 6 + r() * 2);
      else if (i % 3 === 1) s += knot(x + (r() - .5) * 16, y + (r() - .5) * 12, 1.8, pick(r, ['#fbf6ec', '#e7b9bd', '#cdbfe4']));
    });
    s += cluster(cx - rad, cy - 10, 1.3, r, 1) + cluster(cx + rad, cy - 10, 1.3, r, -1);
    s += cluster(cx, cy - rad, 1.2, r, 1);
    s += cluster(cx - rad + 4, bottom - 6, 1.35, r, 1) + cluster(cx + rad - 4, bottom - 6, 1.35, r, -1);
    s += '</g></svg>';
    return s;
  }

  // ---------- Monogram wreath (hero) ----------
  function wreath() {
    const r = rng(2010);
    const cx = 200, cy = 200, rad = 150;
    let s = '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += `<circle class="ring" cx="${cx}" cy="${cy}" r="${rad + 18}" fill="none" stroke="${C.gold}" stroke-width=".8" stroke-dasharray="1 3"/>`;
    s += '<g filter="url(#emb)">';
    const pts = [];
    for (let a = 100; a <= 460; a += 5) pts.push([cx + Math.cos((a * Math.PI) / 180) * rad, cy + Math.sin((a * Math.PI) / 180) * rad]);
    s += vineAlong(pts, r, { leafEvery: 1, leafSize: 15 });
    const blooms = [[140, 17], [158, 12], [122, 11], [176, 9], [-40, 16], [-58, 11], [-22, 10], [-72, 8], [270, 9], [45, 8]];
    blooms.forEach(([a, sz], i) => {
      const x = cx + Math.cos((a * Math.PI) / 180) * rad;
      const y = cy + Math.sin((a * Math.PI) / 180) * rad;
      s += i % 4 === 3 ? flower(x, y, sz * .7) : rose(x, y, sz, C.roses[i % 3], r() * 60);
    });
    for (let i = 0; i < 24; i++) {
      const a = r() * 360;
      s += knot(cx + Math.cos((a * Math.PI) / 180) * (rad + (r() - .5) * 22), cy + Math.sin((a * Math.PI) / 180) * (rad + (r() - .5) * 22), 1.7, pick(r, ['#fbf6ec', '#e7b9bd', '#cdbfe4']));
    }
    s += wisteria(cx + Math.cos((-50 * Math.PI) / 180) * rad, cy + Math.sin((-50 * Math.PI) / 180) * rad, 60, 16, r);
    s += wisteria(cx + Math.cos((-30 * Math.PI) / 180) * rad, cy + Math.sin((-30 * Math.PI) / 180) * rad, 44, 14, r);
    s += '</g></svg>';
    return s;
  }

  // ---------- Small decorative sprigs & dividers ----------
  function divider() {
    const r = rng(7);
    let s = '<svg viewBox="0 0 240 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#emb)">';
    s += `<path d="M10 17H100M140 17H230" stroke="${C.gold}" stroke-width=".8" stroke-dasharray="1 2.4"/>`;
    s += leaf(120, 17, 200, 22, C.leaves[0]) + leaf(120, 17, -20, 22, C.leaves[2]);
    s += leaf(120, 17, 160, 16, C.leaves[1]) + leaf(120, 17, 20, 16, C.leaves[3]);
    s += rose(120, 17, 10, C.roses[1], 20) + knot(100, 17, 2, '#cdbfe4') + knot(140, 17, 2, '#cdbfe4');
    return s + '</g></svg>';
  }

  function sprig(seed = 3) {
    const r = rng(seed);
    let s = '<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#emb)">';
    const pts = [];
    for (let y = 150; y > 20; y -= 9) pts.push([60 + Math.sin(y / 20) * 8, y]);
    s += vineAlong(pts, r, { leafEvery: 1, leafSize: 16 });
    s += rose(pts[pts.length - 1][0], pts[pts.length - 1][1], 14, C.roses[0], 10);
    s += rose(pts[8][0] + 10, pts[8][1], 9, C.roses[2], 40) + flower(pts[4][0] - 12, pts[4][1], 6);
    return s + '</g></svg>';
  }

  // ---------- Timeline icons (line art, drawn on scroll) ----------
  const icons = {
    doors: `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="draw" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path pathLength="1" d="M22 90V46a28 28 0 0 1 56 0v44"/><path pathLength="1" d="M50 18v72"/><path pathLength="1" d="M28 90V48a22 22 0 0 1 44 0v42"/>
      <path pathLength="1" d="M45 58v8M55 58v8"/><path pathLength="1" d="M12 90h76"/></g>
      <g filter="url(#emb)">${leaf(18, 88, 250, 16, C.leaves[0])}${leaf(82, 88, -70, 16, C.leaves[2])}${rose(20, 74, 6, C.roses[1])}${rose(80, 74, 6, C.roses[0])}</g></svg>`,
    dinner: `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="draw" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle pathLength="1" cx="50" cy="54" r="24"/><circle pathLength="1" cx="50" cy="54" r="16"/>
      <path pathLength="1" d="M14 30v18a5 5 0 0 0 10 0V30M19 30v62"/><path pathLength="1" d="M84 30c-8 6-8 22 0 26v36"/></g>
      <g filter="url(#emb)">${rose(50, 54, 8, C.roses[2])}${leaf(50, 54, 200, 14, C.leaves[1])}${leaf(50, 54, -20, 14, C.leaves[0])}</g></svg>`,
    cake: `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="draw" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path pathLength="1" d="M22 90V70h56v20"/><path pathLength="1" d="M30 70V52h40v18"/><path pathLength="1" d="M38 52V38h24v14"/>
      <path pathLength="1" d="M14 90h72"/><path pathLength="1" d="M22 78q7 5 14 0t14 0 14 0 14 0"/><path pathLength="1" d="M30 60q5 4 10 0t10 0 10 0 10 0"/></g>
      <g filter="url(#emb)">${rose(50, 32, 7, C.roses[0])}${leaf(50, 32, 200, 12, C.leaves[0])}${leaf(50, 32, -20, 12, C.leaves[2])}${pearl(26, 70, 2.5)}${pearl(74, 70, 2.5)}</g></svg>`,
    farewell: `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="draw" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path pathLength="1" d="M62 16a30 30 0 1 0 22 44A26 26 0 0 1 62 16z"/>
      <path pathLength="1" d="M26 20v10M21 25h10M80 76v8M76 80h8M18 70v6M15 73h6"/></g>
      <g filter="url(#emb)">${leaf(40, 78, 190, 14, C.leaves[1])}${rose(44, 78, 7, C.roses[1])}${flower(58, 80, 4.5)}</g></svg>`,
  };

  window.Art = {
    frame: () => asImage(frame(), 'art-img') + frameThreads(),
    arch: () => asImage(arch(), 'art-img'),
    wreath, divider, sprig, icons,
  };
})();
