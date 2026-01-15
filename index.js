import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    'https://lukasreis.com',
    'http://localhost:4321'
  ]
}));

const LASTFM_API_KEY = process.env.LASTFM_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME || 'capitaoananas';
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_USER_ID = process.env.SLACK_USER_ID;

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/now-playing', async (req, res) => {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    const track = data.recenttracks?.track?.[0];
    if (!track) {
      return res.json({ playing: false });
    }

    const isPlaying = track['@attr']?.nowplaying === 'true';

    res.json({
      playing: isPlaying,
      artist: track.artist['#text'],
      song: track.name,
      album: track.album['#text'],
      image: track.image?.find(i => i.size === 'extralarge')?.['#text'],
      songUrl: track.url
    });
  } catch {
    res.status(500).json({ error: 'Last.fm failed' });
  }
});

app.get('/api/slack-status', async (req, res) => {
  try {
    const response = await fetch(
      `https://slack.com/api/users.getPresence?user=${SLACK_USER_ID}`,
      { headers: { Authorization: `Bearer ${SLACK_TOKEN}` } }
    );
    const data = await response.json();

    res.json({
      online: data.presence === 'active'
    });
  } catch {
    res.status(500).json({ error: 'Slack failed' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`backend running on localhost:${PORT}`);
});
