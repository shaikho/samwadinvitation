// Renders public/share-card.html to public/og-image.jpg (the WhatsApp / social link preview).
// Needs the local server running (npm start) and Microsoft Edge or Google Chrome installed.
//   npm run og            (or: BROWSER="path/to/chrome" npm run og)
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

const url = `http://localhost:${process.env.PORT || 3000}/share-card.html`;
const out = path.join(__dirname, '..', 'public', 'og-image.jpg');
const tmp = path.join(os.tmpdir(), 'samwad-og.jpeg');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'samwad-og-'));

execFileSync(browser, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1200,630',
  '--virtual-time-budget=8000', `--user-data-dir=${profile}`,
  `--screenshot=${tmp}`, url,
], { stdio: 'ignore' });

fs.copyFileSync(tmp, out);
console.log(`og-image.jpg written (${Math.round(fs.statSync(out).size / 1024)} KB)`);
