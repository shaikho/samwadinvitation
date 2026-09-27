// Background music. Routed through Web Audio so the volume ramp also works on iOS
// (iOS Safari ignores HTMLMediaElement.volume). If public/audio/song.mp3 is missing,
// a soft generated music-box melody plays instead.
(function () {
  const SONG_URL = 'audio/song.mp3';
  const MIN_LEVEL = 0.05; // at the top of the page
  const MAX_LEVEL = 0.7;  // at the bottom of the page

  let ctx, master, started = false, muted = false, level = MIN_LEVEL, synth = null;

  function applyGain() {
    if (!master) return;
    const target = muted ? 0 : level;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.6);
  }

  function start() {
    if (started) return;
    started = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    ctx.resume();

    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.playsInline = true;
    el.src = SONG_URL;
    let fellBack = false;
    const fallback = () => {
      if (fellBack) return;
      fellBack = true;
      synth = startSynth();
    };
    el.addEventListener('error', fallback, { once: true });
    try {
      ctx.createMediaElementSource(el).connect(master);
    } catch { /* already connected / unsupported */ }
    // play() must run synchronously inside the user gesture for iOS
    const p = el.play();
    if (p && p.catch) p.catch(fallback);
    applyGain();
  }

  // ---------- generated fallback: gentle music box + pad ----------
  function startSynth() {
    const out = ctx.createGain();
    out.gain.value = 0.9;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    out.connect(master);
    out.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);

    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // D – Bm – G – A
    const chords = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]];
    const beat = 60 / 76;
    let next = ctx.currentTime + 0.1, step = 0;

    function bell(t, midi, vel) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o2.type = 'triangle';
      o.frequency.value = hz(midi); o2.frequency.value = hz(midi) * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
      o.start(t); o2.start(t); o.stop(t + 2.5); o2.stop(t + 2.5);
    }
    function pad(t, notes, dur) {
      notes.forEach((m) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = hz(m - 12);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.045, t + dur * 0.4);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1);
      });
    }
    const pattern = [0, 1, 2, 1, 2, 3, 2, 1];
    const timer = setInterval(() => {
      while (next < ctx.currentTime + 0.6) {
        const bar = Math.floor(step / 8) % chords.length;
        const ch = chords[bar];
        if (step % 8 === 0) pad(next, ch, beat * 8);
        const idx = pattern[step % 8];
        const note = idx === 3 ? ch[0] + 12 : ch[idx] + 12;
        bell(next, note, step % 8 === 0 ? 0.16 : 0.1);
        if (step % 16 === 6) bell(next + beat / 2, ch[2] + 24, 0.05);
        next += beat / 2;
        step++;
      }
    }, 150);
    return { stop: () => clearInterval(timer) };
  }

  window.Music = {
    start,
    get started() { return started; },
    get muted() { return muted; },
    setProgress(p) {
      p = Math.min(1, Math.max(0, p));
      level = MIN_LEVEL + (MAX_LEVEL - MIN_LEVEL) * Math.pow(p, 0.9);
      applyGain();
    },
    toggle() {
      if (!started) { start(); muted = false; applyGain(); return muted; }
      muted = !muted;
      if (!muted && ctx.state === 'suspended') ctx.resume();
      applyGain();
      return muted;
    },
  };
})();
