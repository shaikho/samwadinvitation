// RSVP storage.
// - On Vercel: Vercel Blob (the filesystem there is read-only). Each RSVP is its own tiny
//   blob, and the guest's name is encoded in the blob's pathname, so listing the folder
//   returns the whole guest list in one call and two RSVPs can never overwrite each other.
// - Locally (no BLOB_READ_WRITE_TOKEN): a plain JSON file in data/attendees.json.
const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'attendees.json');
const PREFIX = 'rsvp/';
// Vercel names the variable BLOB_READ_WRITE_TOKEN by default, but lets you pick another
// prefix when connecting the store (e.g. SAMWAD_READ_WRITE_TOKEN), so find it by value.
function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.endsWith('_READ_WRITE_TOKEN') && typeof v === 'string' && v.startsWith('vercel_blob_rw_')) return v;
  }
  return null;
}
const useBlob = () => Boolean(blobToken());

const b64url = {
  enc: (s) => Buffer.from(s, 'utf8').toString('base64url'),
  dec: (s) => Buffer.from(s, 'base64url').toString('utf8'),
};

// ---------- local file ----------
async function readFile() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}
let writeQueue = Promise.resolve();
function appendFile(entry) {
  writeQueue = writeQueue.then(async () => {
    const list = await readFile();
    list.push(entry);
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
  });
  return writeQueue;
}

// ---------- Vercel Blob ----------
async function appendBlob(entry) {
  const { put } = require('@vercel/blob');
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `${PREFIX}${Date.now()}_${rand}_${b64url.enc(JSON.stringify({ n: entry.name, l: entry.lang }))}.json`;
  const body = JSON.stringify(entry);
  const first = process.env.BLOB_ACCESS === 'private' ? 'private' : 'public';
  try {
    await put(key, body, { access: first, contentType: 'application/json', addRandomSuffix: false, token: blobToken() });
  } catch (err) {
    // The store's access mode is fixed when it's created; retry with the other one.
    await put(key, body, { access: first === 'public' ? 'private' : 'public', contentType: 'application/json', addRandomSuffix: false, token: blobToken() });
  }
}
async function readBlob() {
  const { list } = require('@vercel/blob');
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000, token: blobToken() });
    for (const b of page.blobs) {
      const m = b.pathname.match(/^rsvp\/(\d+)_[a-z0-9]+_([A-Za-z0-9_-]+)\.json$/);
      if (!m) continue;
      try {
        const { n, l } = JSON.parse(b64url.dec(m[2]));
        out.push({ name: n, lang: l, at: new Date(Number(m[1])).toISOString() });
      } catch { /* ignore unreadable entries */ }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

async function addAttendee(entry) {
  if (useBlob()) return appendBlob(entry);
  if (process.env.VERCEL) {
    const err = new Error('Vercel Blob is not connected (BLOB_READ_WRITE_TOKEN missing)');
    err.code = 'storage_not_configured';
    throw err;
  }
  return appendFile(entry);
}

function listAttendees() {
  return useBlob() ? readBlob() : readFile();
}

// ---------- HTTP handlers (work for both Express and Vercel functions) ----------
async function rsvpHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const name = String(body?.name ?? '').trim().slice(0, 120);
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });
  const lang = body?.lang === 'en' ? 'en' : 'ar';
  try {
    await addAttendee({ name, lang, at: new Date().toISOString() });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.code || 'storage_failed' });
  }
}

async function attendeesHandler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(await listAttendees());
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'storage_failed' });
  }
}

module.exports = { addAttendee, listAttendees, rsvpHandler, attendeesHandler };
