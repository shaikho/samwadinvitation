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

  // ---------- Bridal bouquet flowers (anthurium, peony, tulip, orchid, calla, eucalyptus, amaranthus) ----------
  // Palette taken from the bride's reference bouquet: blush and candy pinks, bright whites,
  // silver-green eucalyptus and cream trailing amaranthus.
  const B = {
    pinks: [['#c95f7c', '#e391a6', '#f6cdd6'], ['#d77892', '#eca9b8', '#f9dde2'], ['#bf5270', '#df8aa0', '#f3c2cd']],
    anth: ['#e39aad', '#f0bccb'],
    tulip: ['#e27592', '#f2a4b6', '#f9ccd6'],
    white: '#fcfaf6', whiteEdge: '#e4dbd0', whiteShade: '#efe8df',
    euc: ['#9db3a2', '#8aa493', '#b4c7b6'], eucStem: '#7f8f76',
    amar: ['#d9ccb2', '#cbbc9e', '#e6dcc8'],
    spadix: '#efe0a8',
  };

  // ruffled peony / lisianthus: layered wavy petals
  function peony(x, y, r, tone, rot = 0) {
    const [deep, mid, light] = tone;
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><g class="bloom">`;
    const ring = (n, rad, rx, ry, fill, stroke, off) => {
      for (let i = 0; i < n; i++) {
        const a = ((i * 360) / n + off) * Math.PI / 180;
        const cx = Math.cos(a) * rad, cy = Math.sin(a) * rad;
        s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f((i * 360) / n + off)} ${f(cx)} ${f(cy)})" fill="${fill}" stroke="${stroke}" stroke-width=".7" stroke-dasharray="2.2 1.2"/>`;
      }
    };
    ring(9, r * .58, r * .5, r * .4, light, mid, 0);
    ring(7, r * .38, r * .42, r * .33, mid, deep, 20);
    ring(5, r * .2, r * .32, r * .26, light, mid, 45);
    s += `<circle r="${f(r * .16)}" fill="${deep}"/>`;
    // ruffle highlights
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + 15) * Math.PI / 180;
      s += `<path d="M${f(Math.cos(a) * r * .3)} ${f(Math.sin(a) * r * .3)}q${f(Math.cos(a + .6) * r * .25)} ${f(Math.sin(a + .6) * r * .25)} ${f(Math.cos(a) * r * .5)} ${f(Math.sin(a) * r * .5)}" stroke="#fff" stroke-width=".8" opacity=".5" fill="none"/>`;
    }
    return s + '</g></g>';
  }

  // anthurium: glossy heart-shaped spathe with a cream spadix
  function anthurium(x, y, sz, rot = 0) {
    const k = sz;
    const spathe = `M0 ${f(-.35 * k)}C${f(-.35 * k)} ${f(-.95 * k)} ${f(-1.05 * k)} ${f(-.55 * k)} ${f(-.8 * k)} ${f(.05 * k)}C${f(-.6 * k)} ${f(.5 * k)} ${f(-.2 * k)} ${f(.75 * k)} 0 ${f(1 * k)}C${f(.2 * k)} ${f(.75 * k)} ${f(.6 * k)} ${f(.5 * k)} ${f(.8 * k)} ${f(.05 * k)}C${f(1.05 * k)} ${f(-.55 * k)} ${f(.35 * k)} ${f(-.95 * k)} 0 ${f(-.35 * k)}Z`;
    let veins = '';
    for (let i = -3; i <= 3; i++) {
      const a = (90 + i * 24) * Math.PI / 180;
      veins += `M0 ${f(-.2 * k)}Q${f(Math.cos(a) * .45 * k)} ${f(-.2 * k + Math.sin(a) * .35 * k)} ${f(Math.cos(a) * .7 * k)} ${f(-.2 * k + Math.sin(a) * .8 * k)}`;
    }
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><g class="bloom">
      <path d="${spathe}" fill="${B.anth[0]}" stroke="#c97a8f" stroke-width=".8"/>
      <path d="${spathe}" fill="${B.anth[1]}" opacity=".55" transform="scale(.82) translate(0 ${f(-.06 * k)})"/>
      <path d="${veins}" stroke="#cf8196" stroke-width=".7" fill="none" opacity=".7"/>
      <path d="M0 ${f(-.2 * k)}q${f(.22 * k)} ${f(-.35 * k)} ${f(.08 * k)} ${f(-.78 * k)}" stroke="${B.spadix}" stroke-width="${f(.13 * k)}" stroke-linecap="round" fill="none"/>
      <path d="M0 ${f(-.2 * k)}q${f(.22 * k)} ${f(-.35 * k)} ${f(.08 * k)} ${f(-.78 * k)}" stroke="#d8c585" stroke-width=".8" stroke-dasharray="1 1.4" fill="none"/>
    </g></g>`;
  }

  // tulip: a closed cup of petals on a stem
  function tulip(x, y, sz, rot = 0) {
    const k = sz;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
      <path d="M0 ${f(.1 * k)}L0 ${f(1.5 * k)}" stroke="${C.stem}" stroke-width="1.4"/>
      ${leaf(0, 1.2 * k, -70, .9 * k, C.leaves[0])}
      <g class="bloom">
      <path d="M${f(-.42 * k)} 0C${f(-.5 * k)} ${f(-.6 * k)} ${f(-.12 * k)} ${f(-.95 * k)} 0 ${f(-1.02 * k)}C${f(.12 * k)} ${f(-.95 * k)} ${f(.5 * k)} ${f(-.6 * k)} ${f(.42 * k)} 0C${f(.3 * k)} ${f(.3 * k)} ${f(-.3 * k)} ${f(.3 * k)} ${f(-.42 * k)} 0Z" fill="${B.tulip[0]}" stroke="#c75a78" stroke-width=".7"/>
      <path d="M${f(-.2 * k)} ${f(.12 * k)}C${f(-.35 * k)} ${f(-.4 * k)} ${f(-.05 * k)} ${f(-.85 * k)} ${f(.12 * k)} ${f(-.9 * k)}C${f(.3 * k)} ${f(-.6 * k)} ${f(.3 * k)} ${f(-.1 * k)} ${f(.18 * k)} ${f(.14 * k)}Z" fill="${B.tulip[1]}"/>
      <path d="M${f(-.05 * k)} ${f(-.1 * k)}C${f(-.12 * k)} ${f(-.45 * k)} 0 ${f(-.7 * k)} ${f(.08 * k)} ${f(-.78 * k)}" stroke="${B.tulip[2]}" stroke-width="1" fill="none" stroke-dasharray="2 1.4"/>
      </g></g>`;
  }

  // phalaenopsis orchid: three sepals, two wide petals, a small blush lip
  function orchid(x, y, sz, rot = 0) {
    const k = sz;
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><g class="bloom">`;
    for (const a of [-90, 30, 150]) {
      const r = a * Math.PI / 180, cx = Math.cos(r) * .55 * k, cy = Math.sin(r) * .55 * k;
      s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(.6 * k)}" ry="${f(.25 * k)}" transform="rotate(${a} ${f(cx)} ${f(cy)})" fill="${B.white}" stroke="${B.whiteEdge}" stroke-width=".7"/>`;
    }
    for (const a of [-20, 200]) {
      const r = a * Math.PI / 180, cx = Math.cos(r) * .5 * k, cy = Math.sin(r) * .5 * k;
      s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(.58 * k)}" ry="${f(.46 * k)}" transform="rotate(${a} ${f(cx)} ${f(cy)})" fill="${B.white}" stroke="${B.whiteEdge}" stroke-width=".7"/>`;
    }
    s += `<ellipse cx="0" cy="${f(.28 * k)}" rx="${f(.2 * k)}" ry="${f(.16 * k)}" fill="#f2b6c3"/>`;
    s += `<circle r="${f(.12 * k)}" fill="#f6d98f"/><circle cy="${f(.05 * k)}" r="${f(.05 * k)}" fill="#e39aad"/>`;
    return s + '</g></g>';
  }

  // calla lily: a white trumpet on a long stem
  function calla(x, y, sz, rot = 0) {
    const k = sz;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
      <path d="M0 0L0 ${f(1.6 * k)}" stroke="${C.stem}" stroke-width="1.5"/>
      <g class="bloom">
      <path d="M0 0C${f(-.3 * k)} ${f(-.3 * k)} ${f(-.45 * k)} ${f(-.8 * k)} ${f(-.1 * k)} ${f(-1.1 * k)}C${f(.2 * k)} ${f(-1.3 * k)} ${f(.55 * k)} ${f(-1.1 * k)} ${f(.65 * k)} ${f(-.98 * k)}C${f(.38 * k)} ${f(-.92 * k)} ${f(.26 * k)} ${f(-.6 * k)} ${f(.15 * k)} ${f(-.28 * k)}Z" fill="${B.white}" stroke="${B.whiteEdge}" stroke-width=".8"/>
      <path d="M${f(.02 * k)} ${f(-.1 * k)}C${f(-.15 * k)} ${f(-.45 * k)} ${f(-.12 * k)} ${f(-.85 * k)} ${f(.1 * k)} ${f(-1 * k)}" stroke="${B.whiteShade}" stroke-width="${f(.12 * k)}" fill="none" stroke-linecap="round"/>
      <path d="M${f(.05 * k)} ${f(-.35 * k)}l${f(.04 * k)} ${f(-.35 * k)}" stroke="#f0cf6e" stroke-width="${f(.07 * k)}" stroke-linecap="round"/>
      </g></g>`;
  }

  // eucalyptus: a stem with round silver-green leaves
  function eucalyptus(x, y, len, ang, r) {
    const a = ang * Math.PI / 180;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    const bend = 12 * (r() - .5);
    let s = `<path d="M${f(x)} ${f(y)}Q${f((x + ex) / 2 + Math.cos(a + 1.57) * bend)} ${f((y + ey) / 2 + Math.sin(a + 1.57) * bend)} ${f(ex)} ${f(ey)}" stroke="${B.eucStem}" stroke-width="1.1" fill="none"/>`;
    const n = Math.max(3, Math.round(len / 14));
    for (let i = 1; i <= n; i++) {
      const t = i / (n + .4);
      const px = x + (ex - x) * t, py = y + (ey - y) * t;
      const lr = 7.5 * (1 - t * .45);
      for (const side of [-1, 1]) {
        const off = a + side * 1.57;
        const cx = px + Math.cos(off) * lr * .9, cy = py + Math.sin(off) * lr * .9;
        s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(lr)}" fill="${B.euc[(i + (side > 0 ? 1 : 0)) % 3]}" stroke="#7e9784" stroke-width=".5"/>`;
        s += `<path d="M${f(px)} ${f(py)}L${f(cx)} ${f(cy)}" stroke="#c8d6c9" stroke-width=".5" opacity=".7"/>`;
      }
    }
    return s;
  }

  // amaranthus: trailing tassels of tiny cream beads
  function amaranthus(x, y, len, r) {
    let s = `<g class="sway" style="transform-origin:${f(x)}px ${f(y)}px">`;
    const strands = 3;
    for (let k = 0; k < strands; k++) {
      const x0 = x + (k - 1) * 5, l = len * (.75 + r() * .3), ph = r() * 6;
      for (let t = 0; t < l; t += 3.4) {
        const w = 3.2 * (1 - t / l * .6);
        const bx = x0 + Math.sin(t / 18 + ph) * (4 + t / 14);
        s += `<ellipse cx="${f(bx + (r() - .5) * w)}" cy="${f(y + t)}" rx="${f(w * .55)}" ry="${f(w * .42)}" fill="${B.amar[(t | 0) % 3]}" stroke="#b8a888" stroke-width=".3"/>`;
      }
    }
    return s + '</g>';
  }

  // a lush bouquet cluster that sits fully inside its 340×340 box (nothing is clipped at the edges),
  // placed near a corner of a section; mirror it with CSS for the other side
  function cornerBouquet(seed = 5) {
    const r = rng(seed);
    const cx = 130, cy = 118;
    let s = '<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#emb)">';
    // greenery radiating from the heart of the bouquet, every tip kept inside the box
    [[-160, 105], [-122, 92], [-62, 92], [-22, 140], [14, 150], [58, 105], [118, 96], [168, 100]].forEach(([ang, len]) => { s += eucalyptus(cx, cy, len, ang, r); });
    s += leaf(cx, cy, 200, 56, C.leaves[1]) + leaf(cx, cy, -40, 52, C.leaves[3]) + leaf(cx, cy, 100, 48, C.leaves[0]) + leaf(cx, cy, -130, 46, C.leaves[2]);
    // trailing amaranthus
    s += amaranthus(108, 158, 135, r) + amaranthus(150, 164, 115, r) + amaranthus(80, 150, 105, r);
    // calla lilies reaching outward
    s += calla(214, 76, 30, 70) + calla(58, 92, 28, -72) + calla(196, 152, 24, 118);
    // the heart of the bouquet
    s += peony(120, 108, 32, B.pinks[0], 10);
    s += anthurium(176, 92, 32, -35);
    s += peony(166, 136, 23, B.pinks[1], 40);
    s += peony(84, 140, 21, B.pinks[2], 70);
    s += orchid(216, 118, 16, 10) + orchid(104, 176, 15, 40) + orchid(70, 106, 13, -20);
    s += tulip(244, 84, 14, 62) + tulip(204, 186, 13, 128) + tulip(58, 168, 13, 160);
    s += rose(150, 72, 11, C.roses[1], 20) + rose(96, 78, 10, C.roses[0], 50);
    for (let i = 0; i < 10; i++) s += knot(60 + r() * 170, 60 + r() * 130, 1.8, pick(r, ['#fbf6ec', '#f6cdd6', '#e6dcc8']));
    return s + '</g></svg>';
  }

  // a slim vertical garland for card edges: eucalyptus with small blooms
  function sideGarland(seed = 9) {
    const r = rng(seed);
    let s = '<svg viewBox="0 0 70 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#emb)">';
    const pts = [];
    for (let y = 8; y <= 592; y += 9) pts.push([35 + Math.sin(y / 38) * 9, y]);
    s += `<path d="M${pts.map((p) => p.map(f).join(' ')).join('L')}" stroke="${B.eucStem}" stroke-width="1.2" fill="none"/>`;
    pts.forEach(([x, y], i) => {
      if (i % 2 === 0) {
        s += `<circle cx="${f(x - 7)}" cy="${f(y)}" r="5.5" fill="${B.euc[i % 3]}" stroke="#7e9784" stroke-width=".5"/>`;
        s += `<circle cx="${f(x + 7)}" cy="${f(y + 4)}" r="5" fill="${B.euc[(i + 1) % 3]}" stroke="#7e9784" stroke-width=".5"/>`;
      }
    });
    [[70, 'p'], [150, 'o'], [230, 't'], [310, 'p'], [390, 'o'], [470, 't'], [545, 'p']].forEach(([y, kind], i) => {
      const x = 35 + Math.sin(y / 38) * 9;
      if (kind === 'p') s += peony(x, y, 13, B.pinks[i % 3], i * 30);
      else if (kind === 'o') s += orchid(x, y, 10, i * 25);
      else s += tulip(x, y - 4, 9, i % 2 ? 20 : -20);
    });
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
    // the zaffa: a frame drum (daf) with jingles, and music notes
    zaffa: `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="draw" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle pathLength="1" cx="44" cy="58" r="28"/><circle pathLength="1" cx="44" cy="58" r="22"/>
      <path pathLength="1" d="M44 30v6M44 80v6M16 58h6M66 58h6"/>
      <path pathLength="1" d="M78 16v18"/><path pathLength="1" d="M78 16l10 3v6l-10-3"/><path pathLength="1" d="M78 34a4 3.2 0 1 1-4-3"/>
      <path pathLength="1" d="M88 44v10a3 2.4 0 1 1-3-2.2"/></g>
      <g filter="url(#emb)">${rose(44, 58, 8, C.roses[0])}${leaf(44, 58, 200, 12, C.leaves[1])}${leaf(44, 58, -20, 12, C.leaves[0])}${pearl(44, 33, 2.4)}${pearl(44, 83, 2.4)}${pearl(19, 58, 2.4)}${pearl(69, 58, 2.4)}</g></svg>`,
    // the jertig: a Sudanese clay incense burner (مبخر) — a round bowl on a narrow waist and flared foot,
    // painted with a band of triangles, embers glowing on the rim and bakhoor smoke rising
    jertig: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <g filter="url(#emb)">
        <path d="M31 50L36 58L41 50L46 58L51 50L56 58L61 50L66 58L69 52Z" fill="#c98491" opacity=".85"/>
        <path d="M36 58L41 50L46 58ZM46 58L51 50L56 58ZM56 58L61 50L66 58Z" fill="#d8c192"/>
        <circle cx="44" cy="44" r="2.2" fill="#e3a15b"/><circle cx="51" cy="43.4" r="2.6" fill="#d9774f"/><circle cx="57" cy="44.2" r="2" fill="#e3a15b"/>
        ${pearl(40, 84, 1.8)}${pearl(50, 86, 1.8)}${pearl(60, 84, 1.8)}
      </g>
      <g class="draw" fill="none" stroke="${C.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <ellipse pathLength="1" cx="50" cy="45" rx="23" ry="4.5"/>
        <path pathLength="1" d="M27 45c0 14 10 22 23 22s23-8 23-22"/>
        <path pathLength="1" d="M30 50h40M33 58h34"/>
        <path pathLength="1" d="M44 67l2 7h8l2-7"/>
        <path pathLength="1" d="M46 74c-6 4-11 10-13 17h34c-2-7-7-13-13-17"/>
        <path pathLength="1" d="M44 38c-6-5 5-9 0-15"/><path pathLength="1" d="M51 36c6-6-6-10 0-17"/><path pathLength="1" d="M58 38c5-5-5-9 0-14"/>
      </g></svg>`,
    // farewell: two interlocking hearts
    hearts: `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="draw" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path pathLength="1" stroke="${C.gold}" transform="translate(40 52) rotate(-14) scale(1.45)" d="M0 14C-16 4-20-8-12-15-6-20 0-15 0-10 0-15 6-20 12-15 20-8 16 4 0 14Z"/>
      <path pathLength="1" stroke="#b86f7e" transform="translate(61 57) rotate(14) scale(1.45)" d="M0 14C-16 4-20-8-12-15-6-20 0-15 0-10 0-15 6-20 12-15 20-8 16 4 0 14Z"/></g>
      <g filter="url(#emb)">${leaf(50, 88, 200, 12, C.leaves[1])}${leaf(50, 88, -20, 12, C.leaves[0])}${rose(50, 88, 5, C.roses[1])}</g></svg>`,
  };

  window.Art = {
    frame: () => asImage(frame(), 'art-img') + frameThreads(),
    arch: () => asImage(arch(), 'art-img'),
    bouquet: () => asImage(cornerBouquet(5), 'art-img'),
    bouquetAlt: () => asImage(cornerBouquet(12), 'art-img'),
    garland: () => asImage(sideGarland(9), 'art-img'),
    wreath, divider, sprig, icons,
  };
})();
