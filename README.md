# ComfortSpace

A local-only web platform for browsing and reading your personal manga library. Point it at a folder of CBZ archives on your machine, open the app in your browser, and read — no cloud, no accounts, no database.

ComfortSpace is the first piece of a broader personal media platform. Books and video are planned for later; manga is fully supported today.

---

## Features

- **Library browser** — grid of series with cover thumbnails, author, and volume count
- **Volume list** — per-series view with chapter counts, progress bars, and resume links
- **Manga reader** — customizable layouts (single page, double page, long strip, grid), fit-to-width/height, reading direction, and fullscreen
- **Reading progress** — automatically saved locally and restored when you reopen a volume
- **CBZ-native** — pages streamed directly from archives; no extraction to disk required
- **Zero database** — catalog and progress stored in a single JSON cache file
- **Filesystem-driven** — drop CBZ files into a folder, rescan, and they appear in the library

### Reader controls

| Action | Control |
|--------|---------|
| Next page | `→` or click the right half of the page |
| Previous page | `←` or click the left half of the page |
| Fullscreen | `f` |
| Jump to chapter | Chapter dropdown in the reader toolbar |
| Layout mode | Layout dropdown — single page, double page, long strip, or grid |
| Fit mode | Fit height / Fit width (single, double, and grid layouts) |
| Reading direction | Right-to-left / Left-to-right (double page layout) |
| Grid size | Columns and rows selectors (grid layout) |
| Strip zoom | Slider or ± buttons in the toolbar (long strip layout, 25%–200%) |

Layout and display preferences are saved in your browser and apply across all volumes.

---

## Why CBZ?

CBZ (Comic Book ZIP) is the recommended format for manga in ComfortSpace.

| | CBZ | PDF |
|---|---|---|
| Chapter boundaries | Parsed from image filenames | Requires PDF bookmarks |
| Page serving | Native JPEG/PNG, one request per page | Rendered per page via PDF.js |
| Double-page spreads | Supported as a single wide image | Not practical without manual mapping |
| Ecosystem | Standard for manga readers (Komga, Kavita, etc.) | Better suited to books and documents |

CBZ files are ZIP archives containing ordered image files. ComfortSpace reads pages on demand using [`yauzl`](https://github.com/thejoshwolfe/yauzl) — archives are never fully extracted to disk.

---

## Requirements

- **Node.js** 20 or later
- **npm** 10 or later

Your manga files are not included in this repository. You provide your own CBZ library under `data/manga/`.

---

## Quick start

```bash
git clone <your-repo-url>
cd ComfortSpace

# Install dependencies (root + frontend)
npm install
cd app && npm install && cd ..

# Start the API server and frontend dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

On first launch the server scans `data/manga/` and writes a catalog to `.cache/library.json`.

**After cloning**, copy your own `.cbz` files into `data/manga/<series-slug>/` — archives are gitignored and are not pushed to GitHub.

---

## Adding manga

Place each series in its own folder under `data/manga/`. Use a URL-friendly slug as the folder name.

```
data/manga/
└── delicious-in-dungeon/
    ├── series.json       # optional display metadata
    ├── v01.cbz
    ├── v02.cbz
    └── v14.cbz
```

### Naming conventions

- **Folder name** — becomes the series slug (e.g. `delicious-in-dungeon` → `/series/delicious-in-dungeon`)
- **Volume files** — must contain a volume number matching `v01`, `v02`, etc. (e.g. `v01.cbz`, `v12.cbz`)
- **CBZ contents** — image files inside the archive; chapter and page order are parsed from filenames when present

Example internal CBZ filename (used for chapter detection):

```
Delicious in Dungeon - c001 (v01) - p002-p003 [Yen Press] [Digital] [1r0n].jpg
                      ^chapter      ^page / spread
```

After adding or removing files, click **Rescan library** in the app header (or restart the server).

### Media and git

CBZ/CBR/PDF files are listed in `.gitignore` and should stay on your machine (or NAS/cloud folder). Only lightweight files like `series.json` belong in the repository. This keeps clones fast and avoids GitHub’s file size limits.

---

Each series folder may include a `series.json` for display metadata. Values here override auto-detected defaults during a library scan.

```json
{
  "title": "Delicious in Dungeon",
  "author": "Ryoko Kui",
  "yearStart": 2017,
  "yearEnd": 2024,
  "description": "After a party member is eaten by a dragon, Laios and his companions descend into the dungeon again — this time cooking and eating the monsters they fight along the way."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | No | Display title (defaults to slug converted to title case) |
| `author` | No | Author or artist name |
| `yearStart` | No | First publication year |
| `yearEnd` | No | Last publication year |
| `description` | No | Short series synopsis |

---

## Project structure

```
ComfortSpace/
├── app/                        # React frontend (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── pages/              # Library, Series, Reader
│       ├── components/         # Layout, SeriesCard, VolumeCard, PageViewer
│       └── api.ts              # API client
├── server/                     # Local Express API
│   ├── index.ts                # Route definitions
│   ├── scanner.ts              # Filesystem scan + catalog builder
│   ├── cbz.ts                  # CBZ page listing and streaming
│   └── progress.ts             # Reading progress read/write
├── data/
│   └── manga/                  # Your CBZ library (not committed)
└── .cache/
    └── library.json            # Auto-generated catalog + progress (not committed)
```

---

## Architecture

```
Browser (localhost:5173)
    │
    │  /api/* proxied in dev
    ▼
Express API (localhost:3001)
    ├── scanner  →  walks data/manga/, parses CBZ manifests
    ├── cbz      →  streams individual pages from archives (LRU cache)
    └── progress →  reads/writes .cache/library.json
    │
    ▼
Local filesystem
    ├── data/manga/**/*.cbz
    └── .cache/library.json
```

The browser cannot read arbitrary local files, so a small Node.js server acts as the bridge between your filesystem and the web UI. Everything runs on `localhost` — nothing is sent to the internet.

### Catalog cache (`.cache/library.json`)

Generated on startup and on rescan. Reading progress is preserved across rescans.

```json
{
  "scannedAt": "2026-06-29T12:26:32.728Z",
  "series": [
    {
      "id": "delicious-in-dungeon",
      "title": "Delicious in Dungeon",
      "slug": "delicious-in-dungeon",
      "path": "data/manga/delicious-in-dungeon",
      "coverPage": "/api/series/delicious-in-dungeon/volumes/1/pages/1",
      "volumes": [
        {
          "number": 1,
          "filename": "v01.cbz",
          "chapters": [
            {
              "number": 1,
              "title": "Chapter 1",
              "pageStart": 1,
              "pageEnd": 40,
              "pageCount": 40
            }
          ],
          "totalPages": 192
        }
      ]
    }
  ],
  "progress": {
    "delicious-in-dungeon/1": {
      "page": 12,
      "chapter": 1,
      "updatedAt": "2026-06-29T12:27:29.103Z"
    }
  }
}
```

---

## API reference

All endpoints are served at `http://localhost:3001/api` (proxied through Vite in development).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/library` | Full library catalog |
| `POST` | `/library/rescan` | Re-scan `data/manga/` and rebuild catalog |
| `GET` | `/series/:slug` | Series detail with volume list and progress |
| `GET` | `/series/:slug/volumes/:num` | Volume detail with chapter list |
| `GET` | `/series/:slug/volumes/:num/pages/:page` | Page image (JPEG/PNG/WebP) |
| `PATCH` | `/progress` | Save reading progress |

### Save progress

```bash
curl -X PATCH http://localhost:3001/api/progress \
  -H "Content-Type: application/json" \
  -d '{"seriesId": "delicious-in-dungeon", "volume": 1, "page": 12, "chapter": 1}'
```

---

## Scripts

Run from the repository root:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API (port 3001) and Vite dev server (port 5173) |
| `npm run dev:server` | Start API only |
| `npm run dev:app` | Start frontend only |
| `npm run build` | Build frontend for production |
| `npm start` | Start API server (production) |

Frontend linting (from `app/`):

```bash
cd app && npm run lint
```

---

## Production build

```bash
npm run build        # builds frontend to app/dist/
npm start            # starts API on port 3001
```

In production you will need to serve `app/dist/` separately (e.g. with a static file server or by extending the Express app to serve the built frontend). The API does not currently serve the built frontend automatically.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, TypeScript, React Router, Tailwind CSS 4 |
| Backend | Express 5, TypeScript, tsx |
| CBZ reading | yauzl (streaming ZIP reader) |
| Caching | lru-cache (in-memory page cache, ~50 pages) |
| Storage | Local JSON (`.cache/library.json`) |

---

## Roadmap

ComfortSpace is designed to grow into a unified local media platform:

- [x] Manga — CBZ library, volume/chapter reader, progress tracking
- [ ] Books — EPUB/PDF support
- [ ] Video — TV series and movies
- [ ] OPDS catalog sharing
- [ ] Full-text search

---

## Troubleshooting

**No series appear after starting**

- Confirm CBZ files are in `data/manga/<series-slug>/` with names like `v01.cbz`
- Click **Rescan library** or restart the server
- Check the server console for scan errors

**Pages fail to load (500 error)**

- Verify the CBZ file is a valid ZIP archive
- Ensure image files inside use supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

**Progress not saved**

- Confirm `.cache/` is writable
- Check that `PATCH /api/progress` returns 200 in the browser network tab

**Port already in use**

- API defaults to port `3001`; Vite defaults to `5173`
- Stop any other process using those ports, or adjust the port in `server/index.ts` and `app/vite.config.ts`

---

## Privacy

ComfortSpace is entirely local. Your files stay on your machine. No telemetry, no external services, no authentication layer. The API binds to `localhost` and is not intended to be exposed to a network.

---

## License

This project does not include a license file. Manga files you add to `data/manga/` are your own responsibility — only add content you have the right to possess and use.
