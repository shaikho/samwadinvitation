// Captures public/og-image.jpg, the WhatsApp / X / iMessage link preview (1200×630).
// Needs the local server running (npm start) and Microsoft Edge or Google Chrome installed.
//   npm run og            → the bilingual invitation card (public/share-card.html) — the WhatsApp preview
//   npm run og -- hero    → a screenshot of the site's welcome screen (/?snapshot) instead
//   BROWSER="path/to/chrome" npm run og   to pick a specific browser
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const candidates = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('No Chrome/Edge found. Set BROWSER=/path/to/chrome');
  process.exit(1);
}

const mode = process.argv[2] === 'hero' ? 'hero' : 'card';
const base = `http://localhost:${process.env.PORT || 3000}`;
const url = mode === 'card' ? `${base}/share-card.html` : `${base}/?snapshot`;
// The hero is laid out at a desktop size (1800×945) and scaled down to 1200×630.
const [w, h, dsf] = mode === 'card' ? [1200, 630, 1] : [1800, 945, 2 / 3];
// WhatsApp caches previews per image URL: when the card changes, change this name (and the meta tags)
const out = path.join(__dirname, '..', 'public', process.env.OG_NAME || 'og-invitation-2.jpg');
const tmp = path.join(os.tmpdir(), 'samwad-og.jpeg');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'samwad-og-'));
fs.rmSync(tmp, { force: true });

execFileSync(browser, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--force-device-scale-factor=${dsf}`, `--window-size=${w},${h}`,
  '--virtual-time-budget=9000', `--user-data-dir=${profile}`,
  `--screenshot=${tmp}`, url,
], { stdio: 'ignore' });

// Edge sometimes finishes writing the file just after it exits: wait for it briefly
const until = Date.now() + 5000;
while (!fs.existsSync(tmp) && Date.now() < until) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
if (!fs.existsSync(tmp)) {
  console.error('The browser did not produce a screenshot. Is the server running (npm start)?');
  process.exit(1);
}
fs.copyFileSync(tmp, out);
console.log(`${path.basename(out)} written (${Math.round(fs.statSync(out).size / 1024)} KB)`);
