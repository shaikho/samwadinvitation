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

## Hosting

The site needs a Node host with a persistent disk, because RSVPs are written to a file.
Render (with a disk), Railway, Fly.io or any VPS all work.
Serverless hosts (Vercel/Netlify functions) will **lose** the RSVP file between requests.
