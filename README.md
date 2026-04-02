# Melodex

A free, clean music web app. Paste a YouTube URL → get an MP3 → listen in a Spotify-style interface.

## Features

- YouTube → MP3 conversion with real-time SSE progress
- Persistent Spotify-style player (play, pause, skip, shuffle, repeat, seek, volume)
- Library with search, sort, and per-song context menus
- Playlists with drag-and-drop reorder and public sharing
- Lyrics via lyrics.ovh
- Google OAuth + email/password auth
- Guest mode (localStorage) — no login required
- Google AdSense interstitial on download only (nowhere else)
- Full cross-device sync for authenticated users

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Audio | yt-dlp + ffmpeg |
| Auth + DB + Storage | Supabase |
| State | Zustand |
| DnD | @dnd-kit |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Local Setup

### Prerequisites

- Node.js 20+
- Python 3 (for yt-dlp)
- ffmpeg installed locally
- yt-dlp installed locally
- A Supabase project

### 1. Install ffmpeg and yt-dlp (local dev)

**macOS:**
```bash
brew install ffmpeg
brew install yt-dlp
```

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### 2. Supabase Setup

1. Create a new project at https://supabase.com
2. Go to SQL Editor and run the full contents of `supabase/schema.sql`
3. Go to Authentication → Providers → enable Google OAuth (add your OAuth credentials from Google Cloud Console)
4. Copy your project URL and keys from Settings → API

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
TEMP_DIR=/tmp/melodex-conversions
```

```bash
npm run dev
```

Backend runs on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `frontend/.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_AD_SLOT=XXXXXXXXXX
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Deployment

### Backend → Railway

1. Push your code to GitHub
2. Create a new Railway project → "Deploy from GitHub repo"
3. Select the `backend/` directory as the root (or set root to `/backend` in Railway settings)
4. Railway will automatically detect the `Dockerfile` — it installs yt-dlp and ffmpeg
5. Set all environment variables from `backend/.env.example` in Railway's Variables tab
6. Set `NODE_ENV=production` and `ALLOWED_ORIGINS=https://your-app.vercel.app`
7. Deploy — note your Railway URL (e.g. `https://melodex-backend.up.railway.app`)

### Frontend → Vercel

1. Push your code to GitHub
2. Create a new Vercel project → import the repo
3. Set the root directory to `frontend/`
4. Set all environment variables from `frontend/.env.example` in Vercel's Environment Variables
5. Set `VITE_API_URL` to your Railway backend URL
6. Deploy

### Post-Deployment: Supabase CORS

In your Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## Project Structure

```
melodex/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # AuthModal
│   │   │   ├── library/       # SongRow
│   │   │   ├── lyrics/        # LyricsPanel
│   │   │   ├── player/        # PlayerBar
│   │   │   ├── playlist/      # PlaylistCard, PlaylistModal
│   │   │   └── shared/        # Sidebar, AdModal, AddSongModal, etc.
│   │   ├── hooks/             # usePlaylists
│   │   ├── lib/               # supabase.ts, api.ts, utils.ts, guestStorage.ts
│   │   ├── pages/             # LibraryPage, PlaylistsPage, PlaylistDetailPage, etc.
│   │   ├── store/             # authStore, playerStore, libraryStore, uiStore
│   │   └── types/             # TypeScript interfaces
│   ├── public/
│   └── vercel.json
├── backend/
│   ├── src/
│   │   ├── lib/               # supabase.js
│   │   ├── middleware/        # auth.js
│   │   ├── routes/            # convert.js, songs.js, playlists.js
│   │   └── services/          # converter.js (yt-dlp + ffmpeg)
│   ├── Dockerfile
│   └── package.json
└── supabase/
    └── schema.sql
```

---

## AdSense Notes

- The ad unit fires **only** when the user clicks "Download Song"
- Modal shows a real `<ins class="adsbygoogle">` unit
- "Continue" button is disabled for 5 seconds
- In development, AdSense won't load (no live publisher ID) — the modal still works, the ad space just appears empty
- Make sure your AdSense account is approved and the publisher ID is correct before deploying

---

## Environment Variables Reference

### Backend
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (server-side only, never expose) |
| `PORT` | Server port (Railway sets this automatically) |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `TEMP_DIR` | Directory for temporary audio files during conversion |
| `RATE_LIMIT_MAX_REQUESTS` | Max conversion requests per window (default: 20) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default: 900000 = 15min) |

### Frontend
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_API_URL` | Backend API base URL |
| `VITE_ADSENSE_PUBLISHER_ID` | Google AdSense publisher ID (ca-pub-XXXX) |
| `VITE_ADSENSE_AD_SLOT` | AdSense ad slot ID |

---

## License

MIT
