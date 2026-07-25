# eupho — Netlify Deploy Guide

## Deploy on Netlify (recommended)

1. Push this folder to a GitHub repository.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
3. Choose your GitHub repo.
4. Build settings are read from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site**.

## What works on Netlify

- Public pages: home, beats, kits, game, visuals, watchers, producer, about, gate.
- API endpoints via Netlify Functions:
  - `GET /api/beats`
  - `GET /api/kits`
  - `GET /api/canvas`
  - `POST /api/canvas`
  - `GET /api/users`
  - `POST /api/register`
  - `POST /api/login`
  - `POST /api/wall`

## What does NOT work on Netlify

- **File uploads in admin** (MP3/WAV/ZIP) — Netlify Functions have a 6MB request limit and no persistent writable filesystem.
- To upload beats/kits, use the local server at home, then push the updated `data/beats.json` and `data/kits.json` to Git.

## Local upload workflow

1. Run the local Node server:
   ```bash
   node "C:\Users\bruhz\AppData\Local\Temp\opencode\server.js" "C:\Users\bruhz\OneDrive\Документы\Samples\euphosite2"
   ```
2. Open `http://localhost:8000/admin.html`
3. Upload beats and drum kits.
4. Commit and push `data/beats.json`, `data/kits.json`, `uploads/` folder.
5. Netlify redeploys automatically with the new catalog.

## Local preview with Netlify CLI

```bash
npm install
npm run dev
```

Then open the URL shown by Netlify CLI.

## Custom domain

In Netlify site settings → Domain management → add your custom domain.
