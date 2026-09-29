# Sameer & Waad · سمير ووعد

Wedding invitation site for **Tuesday 20 October 2026, 8:00 PM** at **One View Hall, Mountain Rose Hotel**.
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
| `/messages` (also `/attendees`, `/addendies`) | Private messages to the couple: sender, message, IP and location, browser details, with search and CSV export. No password. |
| `/wedding.ics` | Calendar file (Apple Calendar / Outlook / iCal) |
| `/api/message` | `POST {"name": "…", "message": "…"}` saves a message (the server adds IP, location and user-agent) |
| `/api/messages` | `GET` all messages as JSON |

Locally, messages are stored in `data/messages.json` (git-ignored).

## What's inside

- **Opening envelope**: an ivory envelope sealed with the logo in red wax. Tapping cracks the seal, the flap swings open, the letter slides out and grows into the site. It also starts the music and asks iOS for motion permission. Add `?autoopen` to the URL to open it automatically for testing.
- **Welcome**: the couple's calligraphic logo in an embroidered wreath, plus the welcome text.
- **Countdown** to 20.10.2026 · 8 PM Cairo time, with swaying gold charms (they also lean with the phone's tilt) and small flying bluebirds that return throughout the site.
- **Invitation**: families آل بلال وآل خباب, names, and the date.
- **Location / date & time**: embroidered wisteria-and-rose card, directions (Google Maps), Google Calendar and Apple/iCal buttons. Rose petals drift across the site and react to scrolling and tilting.
- **Our story**: floral arch.
- **Timeline**: a thread that draws as you scroll, with icons stitched in on view.
- **Message to the couple**: guests send a private note with their name; the form is replaced by a burst of hearts, petals and gold sparks and a thank-you. The server records the sender's IP (with Vercel's country/city), user-agent, screen, time zone and language.
- **3D background**: layered bokeh, flowers and pearls that move with the phone's gyroscope (or the mouse on desktop).
- **Music**: see `public/audio/README.md`. The volume rises from ~5% to ~70% as the guest scrolls down.

Animations use [Motion](https://motion.dev/docs) (served from `node_modules/motion` at `/vendor/motion.js`).
All artwork is generated SVG (`public/js/art.js`), so there are no image files to manage.

## Editing content

All text, in both languages, is in `public/js/i18n.js`: names, families, story, timeline items, message form wording.
The wedding time, the venue coordinates and the calendar event are in `public/js/main.js` (`WEDDING`, `VENUE`, `updateCalendarLinks`) and `server.js` (`/wedding.ics`).

## Hosting on Vercel

- `public/` is served as static files (`vercel.json` → `outputDirectory`). `/attendees` and `/addendies` are rewrites.
- `api/message.js` and `api/messages.js` run as serverless functions and share `lib/store.js` with the local server.
- Vercel's filesystem is read-only, so messages are stored in **Vercel Blob**:
  1. Vercel dashboard → your project → **Storage** → **Create** → **Blob** → connect it to this project.
     This adds the `BLOB_READ_WRITE_TOKEN` environment variable.
  2. Redeploy.

  Without the Blob store, sending a message shows an error on the live site.
- Locally (no token) messages go to `data/messages.json`.
- `public/vendor/motion.js` is a committed copy of the Motion bundle, because Vercel doesn't serve `node_modules`.
  After upgrading `motion`, run `npm run vendor` to refresh it.

## Link preview (WhatsApp / X / iMessage / Telegram)

Pasting the link shows the invitation card: the logo in its wreath, both names, the date, the doors-open time and the venue in Arabic and English, framed by the bridal-bouquet flowers. A short bilingual title and description go with it.
- The image is `public/og-invitation.jpg` (1200×630, about 100 KB), rendered from `public/share-card.html`.
- To regenerate it after editing the card: run `npm start`, then `npm run og` (needs Edge or Chrome). `npm run og -- hero` captures the welcome screen instead.
- The title, description and image are the `og:*`, `itemprop` and `twitter:*` tags at the top of `public/index.html`. They use absolute `https://samwadinvitation.vercel.app` URLs; update them if the domain changes.
- WhatsApp's rules: the tags must be in the first 300 KB of the page, the image under 600 KB and at least 300px wide, and the description is best kept to about 80 characters.
- WhatsApp caches previews (including "no preview") per URL for days. When the card changes, render it under a new name (`OG_NAME=og-invitation-2.jpg npm run og`) and update the meta tags. To test, paste a URL WhatsApp hasn't seen before, e.g. `https://samwadinvitation.vercel.app/?w=1`, and wait up to 10 seconds.

## Logo

The calligraphic logo is a vector traced from the supplied artwork. It's defined once as `#logoPath` in the hidden SVG defs of `public/index.html` and reused everywhere with `<use href="#logoPath">`: the welcome wreath, the envelope letter, the wax seals and the footer. It's drawn in the same olive-brown as the headings (`#5d5a45`, via `#logoGreen`), or in cream when pressed into the wax seals. The browser tab icon is `public/favicon.svg`.

## Fonts

The English script names use **Armelie** (`public/fonts/Armelie-Regular.otf`, from 1001fonts.com).
Its licence is **free for personal use only**; commercial use needs a licence from brandsemut.com.
