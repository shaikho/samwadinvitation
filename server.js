// Local development server. On Vercel, public/ is served statically and
// api/*.js run as serverless functions — both share lib/store.js.
const express = require('express');
const path = require('path');
const { rsvpHandler, attendeesHandler } = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '10kb' }));

app.all('/api/rsvp', rsvpHandler);
app.get('/api/attendees', attendeesHandler);

app.get(['/attendees', '/addendies'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'attendees.html'));
});

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Invitation running on http://localhost:${PORT}`);
});
