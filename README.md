# Sameer & Waad · سمير ووعد

Wedding invitation site for **Tuesday 20 October 2026, 8:00 PM** at **Mountain Rose Hotel**.
Arabic first (RTL), with a one-tap switch to English.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000 (add `?lang=en` to open in English).

| Route | What it is |
|---|---|
| `/` | The invitation |
| `/attendees` (also `/addendies`) | Guest list: everyone who RSVP'd, with search and CSV export. No password. |
| `/wedding.ics` | Calendar file (Apple Calendar / Outlook / iCal) |
| `/api/rsvp` | `POST {"name": "…"}` saves a guest |
| `/api/attendees` | `GET` the raw list as JSON |

RSVPs are stored in `data/attendees.json` (git-ignored).

## What's inside

- **Opening gate**: sage linen doors sealed with an S&W wax seal. Tapping it opens the doors in 3D, starts the music and asks iOS for motion permission.
- **Welcome**: embroidered wreath monogram *S & W* and the welcome text.
- **Countdown** to 20.10.2026 · 8 PM Cairo time, with swaying gold charms (they also lean with the phone's tilt) and small flying bluebirds that return throughout the site.
- **Invitation**: families آل بلال وآل خباب, names, and the date.
- **Location / date & time**: embroidered wisteria-and-rose card, directions (Google Maps), Google Calendar and Apple/iCal buttons. Rose petals drift across the site and react to scrolling and tilting.
- **Our story**: floral arch.
- **Timeline**: a thread that draws as you scroll, with icons stitched in on view.
- **RSVP**: asks for the guest's name only.
- **3D background**: layered bokeh, flowers and pearls that move with the phone's gyroscope (or the mouse on desktop).
- **Music**: see `public/audio/README.md`. The volume rises from ~5% to ~70% as the guest scrolls down.

Animations use [Motion](https://motion.dev/docs) (served from `node_modules/motion` at `/vendor/motion.js`).
All artwork is generated SVG (`public/js/art.js`), so there are no image files to manage.

## Editing content

All text, in both languages, is in `public/js/i18n.js`: names, families, story, timeline items, RSVP deadline.
The wedding time, the venue coordinates and the calendar event are in `public/js/main.js` (`WEDDING`, `VENUE`, `updateCalendarLinks`) and `server.js` (`/wedding.ics`).

## Hosting on Vercel

- `public/` is served as static files (`vercel.json` → `outputDirectory`). `/attendees` and `/addendies` are rewrites.
- `api/rsvp.js` and `api/attendees.js` run as serverless functions and share `lib/store.js` with the local server.
- Vercel's filesystem is read-only, so RSVPs are stored in **Vercel Blob**:
  1. Vercel dashboard → your project → **Storage** → **Create** → **Blob** → connect it to this project.
     This adds the `BLOB_READ_WRITE_TOKEN` environment variable.
  2. Redeploy.

  Without the Blob store, the RSVP button shows an error on the live site.
- Locally (no token) RSVPs go to `data/attendees.json`.
- `public/vendor/motion.js` is a committed copy of the Motion bundle, because Vercel doesn't serve `node_modules`.
  After upgrading `motion`, run `npm run vendor` to refresh it.

## Link preview (WhatsApp / X / iMessage / Telegram)

Pasting the link shows a preview image of the welcome screen (wreath monogram, welcome text, petals and bluebirds), plus a bilingual title and description with the date, doors-open time and venue.
- The image is `public/og-image.jpg` (1200×630, about 50 KB). It's captured from `/?snapshot`, a mode that skips the gate and animations and hides the controls.
- To regenerate it after changing the design: run `npm start`, then `npm run og` (needs Edge or Chrome).
  `npm run og -- card` captures the alternative designed bilingual card (`public/share-card.html`) instead.
- The title, description and image are the `og:*` / `twitter:*` tags in `public/index.html`. They use absolute `https://samwadinvitation.vercel.app` URLs; update them if the domain changes.
- WhatsApp and X cache previews. After changing the image, bump `?v=2` in the `og:image` URLs. If a chat already shows an old preview, share the link with `?v=3` (or any new value) added.

## Fonts

The monogram, seal and English script names use **Armelie** (`public/fonts/Armelie-Regular.otf`, from 1001fonts.com).
Its licence is **free for personal use only**; commercial use needs a licence from brandsemut.com.
