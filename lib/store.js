// Private messages to the couple.
// - On Vercel: Vercel Blob (the filesystem there is read-only). Every message is its own small
//   JSON blob under messages/, so two guests sending at once can never overwrite each other.
// - Locally (no Blob token): a plain JSON file in data/messages.json.
// Each record keeps the sender, their message, and basic tracking info: the public IP (plus the
// country/city Vercel derives from it), the browser's user-agent and a few client details.
const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'messages.json');
const PREFIX = 'messages/';
const LEGACY_PREFIX = 'rsvp/'; // name-only RSVPs from the earlier version of the site

// ---------- Blob credentials ----------
// Vercel can connect a Blob store in two ways:
//  1. a read-write token, BLOB_READ_WRITE_TOKEN (or a custom prefix, e.g. SAMWAD_READ_WRITE_TOKEN);
//  2. OIDC: the project gets BLOB_STORE_ID (or <PREFIX>_STORE_ID) and every request carries a
//     short-lived OIDC token in the x-vercel-oidc-token header — no read-write token at all.
// Supporting only (1) made newer OIDC-connected stores look "not configured".
function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.endsWith('_READ_WRITE_TOKEN') && typeof v === 'string' && v.startsWith('vercel_blob_rw_')) return v;
  }
  return null;
}
function blobStoreId() {
  if (process.env.BLOB_STORE_ID) return process.env.BLOB_STORE_ID;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.endsWith('_STORE_ID') && typeof v === 'string' && /^store_/i.test(v.trim())) return v.trim();
  }
  return null;
}
function oidcTokenFrom(req) {
  const h = req?.headers?.['x-vercel-oidc-token'];
  return (Array.isArray(h) ? h[0] : h) || process.env.VERCEL_OIDC_TOKEN || null;
}
// Options to spread into every @vercel/blob call, or null when no store is connected.
function blobAuth(req) {
  const token = blobToken();
  if (token) return { token };
  const storeId = blobStoreId();
  const oidcToken = oidcTokenFrom(req);
  if (storeId && oidcToken) return { storeId, oidcToken };
  return null;
}
// What this deployment can see (names/booleans only, never secret values) — for /api/messages?diag=1
function credentialReport(req) {
  const names = Object.keys(process.env).filter((k) => /BLOB|_STORE_ID$|_READ_WRITE_TOKEN$/.test(k));
  return {
    readWriteToken: Boolean(blobToken()),
    storeId: Boolean(blobStoreId()),
    oidcToken: Boolean(oidcTokenFrom(req)),
    usable: Boolean(blobAuth(req)),
    blobEnvNames: names,
    vercelEnv: process.env.VERCEL_ENV || null,
  };
}

// ---------- request details ----------
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

function clientIp(req) {
  const h = req.headers || {};
  const fwd = h['x-forwarded-for'];
  if (fwd) return clip(String(fwd).split(',')[0], 64);
  return clip(h['x-real-ip'] || req.socket?.remoteAddress || '', 64);
}
function geo(req) {
  const h = req.headers || {};
  const dec = (v) => { try { return v ? decodeURIComponent(v) : ''; } catch { return String(v); } };
  return {
    country: clip(h['x-vercel-ip-country'], 8),
    region: clip(dec(h['x-vercel-ip-country-region']), 40),
    city: clip(dec(h['x-vercel-ip-city']), 60),
  };
}
function clientInfo(c) {
  if (!c || typeof c !== 'object') return {};
  return {
    lang: clip(c.lang, 20),
    tz: clip(c.tz, 60),
    screen: clip(c.screen, 30),
    platform: clip(c.platform, 40),
    touch: Number.isFinite(Number(c.touch)) ? Number(c.touch) : undefined,
  };
}

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
async function appendBlob(entry, auth) {
  const { put } = require('@vercel/blob');
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `${PREFIX}${Date.now()}_${rand}.json`;
  const body = JSON.stringify(entry);
  const first = process.env.BLOB_ACCESS === 'private' ? 'private' : 'public';
  const opts = { contentType: 'application/json', addRandomSuffix: false, ...auth };
  try {
    await put(key, body, { ...opts, access: first });
  } catch (err) {
    // The store's access mode is fixed when it's created; retry with the other one.
    console.warn(`put with access=${first} failed, retrying with the other mode:`, err?.message);
    await put(key, body, { ...opts, access: first === 'public' ? 'private' : 'public' });
  }
}

async function readOne(url, auth) {
  const { get } = require('@vercel/blob');
  for (const access of ['public', 'private']) {
    try {
      const res = await get(url, { access, useCache: false, ...auth });
      if (res && res.stream) return JSON.parse(await new Response(res.stream).text());
    } catch { /* try the other access mode */ }
  }
  return null;
}

async function listAll(prefix, auth) {
  const { list } = require('@vercel/blob');
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000, ...auth });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function readBlob(auth) {
  const [messages, legacy] = await Promise.all([listAll(PREFIX, auth), listAll(LEGACY_PREFIX, auth)]);
  const out = [];

  // fetch message bodies, a few at a time
  for (let i = 0; i < messages.length; i += 16) {
    const batch = await Promise.all(messages.slice(i, i + 16).map((b) => readOne(b.url, auth)));
    batch.forEach((m) => { if (m) out.push(m); });
  }

  // earlier name-only RSVPs: the name was encoded in the pathname
  for (const b of legacy) {
    const m = b.pathname.match(/^rsvp\/(\d+)_[a-z0-9]+_([A-Za-z0-9_-]+)\.json$/);
    if (!m) continue;
    try {
      const { n, l } = JSON.parse(Buffer.from(m[2], 'base64url').toString('utf8'));
      out.push({ name: n, message: '', lang: l, at: new Date(Number(m[1])).toISOString(), legacy: true });
    } catch { /* ignore unreadable entries */ }
  }
  return out.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

function notConfigured(req) {
  const err = new Error(`Vercel Blob is not connected: ${JSON.stringify(credentialReport(req))}`);
  err.code = 'storage_not_configured';
  return err;
}

async function addMessage(entry, req) {
  const auth = blobAuth(req);
  if (auth) return appendBlob(entry, auth);
  if (process.env.VERCEL) throw notConfigured(req);
  return appendFile(entry);
}

function listMessages(req) {
  const auth = blobAuth(req);
  if (auth) return readBlob(auth);
  if (process.env.VERCEL) throw notConfigured(req);
  return readFile();
}

// ---------- HTTP handlers (work for both Express and Vercel functions) ----------
async function messageHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const name = clip(body?.name, 80);
  const message = clip(body?.message, 1000);
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });
  if (!message) return res.status(400).json({ ok: false, error: 'message_required' });
  const entry = {
    name,
    message,
    lang: body?.lang === 'en' ? 'en' : 'ar',
    at: new Date().toISOString(),
    ip: clientIp(req),
    geo: geo(req),
    ua: clip(req.headers?.['user-agent'], 400),
    client: clientInfo(body?.client),
  };
  try {
    await addMessage(entry, req);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.code || 'storage_failed', detail: String(err?.message || '').slice(0, 200) });
  }
}

async function messagesHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // /api/messages?diag=1 → which Blob credentials this deployment can see (no secret values)
  const diag = req.query?.diag ?? new URL(req.url || '/', 'http://x').searchParams.get('diag');
  if (diag) return res.status(200).json(credentialReport(req));
  try {
    res.status(200).json(await listMessages(req));
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.code || 'storage_failed', detail: String(err?.message || '').slice(0, 200) });
  }
}

module.exports = { addMessage, listMessages, messageHandler, messagesHandler };
