const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'attendees.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '10kb' }));

// Motion (motion.dev) vanilla bundle, served straight from node_modules.
app.get('/vendor/motion.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'motion', 'dist', 'motion.js'));
});

async function readAttendees() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Serialise writes so two RSVPs arriving together don't clobber each other.
let writeQueue = Promise.resolve();
function addAttendee(entry) {
  writeQueue = writeQueue.then(async () => {
    const list = await readAttendees();
    list.push(entry);
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
    return list.length;
  });
  return writeQueue;
}

app.post('/api/rsvp', async (req, res) => {
  const name = String(req.body?.name ?? '').trim().slice(0, 120);
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });
  const lang = req.body?.lang === 'en' ? 'en' : 'ar';
  try {
    const count = await addAttendee({ name, lang, at: new Date().toISOString() });
    res.json({ ok: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'storage_failed' });
  }
});

app.get('/api/attendees', async (req, res) => {
  res.json(await readAttendees());
});

app.get(['/attendees', '/addendies'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'attendees.html'));
});

// Calendar file — served with a real text/calendar type so iOS/macOS open it in Calendar.
app.get('/wedding.ics', (req, res) => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sameer & Waad//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:sameer-waad-wedding-20261020@samwad',
    'DTSTAMP:20260901T000000Z',
    // 7:00 PM – 1:00 AM Cairo time (UTC+3 in October)
    'DTSTART:20261020T160000Z',
    'DTEND:20261020T220000Z',
    'SUMMARY:Sameer & Waad Wedding · زفاف سمير ووعد',
    'LOCATION:Mountain Rose Hotel\, 6th of October City\, Giza\, Egypt',
    'GEO:29.9310476;30.9494757',
    'DESCRIPTION:Doors open 7:00 PM · Celebration 8:00 PM\nhttps://www.google.com/maps/dir/?api=1&destination=29.9310476,30.9494757',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Sameer & Waad wedding tomorrow',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="sameer-waad-wedding.ics"');
  res.send(ics);
});

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Invitation running on http://localhost:${PORT}`);
});
