// Local development server. On Vercel, public/ is served statically and
// api/*.js run as serverless functions — both share lib/store.js.
const express = require('express');
const path = require('path');
const { messageHandler, messagesHandler } = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '10kb' }));

app.set('trust proxy', true); // so the sender's IP is read from X-Forwarded-For behind a proxy
app.all('/api/message', messageHandler);
app.get('/api/messages', messagesHandler);

app.get(['/attendees', '/addendies', '/messages'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'attendees.html'));
});

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Invitation running on http://localhost:${PORT}`);
});
