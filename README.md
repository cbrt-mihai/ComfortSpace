# ComfortSpace

A local-only web platform for browsing and reading your personal manga library. Point it at a folder of CBZ archives on your machine, open the app in your browser, and read. No cloud, no accounts, no database.

ComfortSpace is the first piece of a broader personal media platform. Books and video are planned for later; manga is fully supported today.

---

## Features

- **Library browser** - grid of series with cover and title; stats and ratings appear after 1s hover
- **Volume list** - per-series grid or expandable list view with chapter-level progress, read marks, and ratings
- **Manga reader** - customizable layouts (single page, double page, long strip), zoom, fit-to-width/height, reading direction, and fullscreen
- **Reading progress** - tracked at series, volume, and chapter level; automatically saved and restored
- **Read marks** - auto-mark when finishing a volume; manual mark/unmark at any level; unmarking cascades to children (series → volumes → chapters, volume → chapters)
- **Ratings** - 1–10 scores via 10-star picker (half steps) with numeric label; manual ratings at series/volume/chapter level plus calculated rollups
- **Page navigation** - page counter with jump input, step buttons, and page selector (volumes ≤200 pages)
- **Series metadata wizard** - in-app editor for `series.json` including chapter title overrides
- **CBZ-native** - pages streamed directly from archives; no extraction to disk required
- **Zero database** - catalog, progress, read status, and ratings stored in a single JSON cache file
- **Filesystem-driven** - drop CBZ files into a folder, rescan, and they appear in the library

### Reader controls

| Action | Control |
|--------|---------|
| Next page | Right arrow key `→` or click the right half of the page |
| Previous page | Left arrow key `←` or click the left half of the page |
| Fullscreen | `f` |
| Jump to page | Page input, ± buttons, or page dropdown (≤200 pages) |
| Jump to chapter | Chapter dropdown in the reader toolbar |
| Mark read/unread | Read toggle in the reader toolbar |
| Rate chapter | Star rating in the reader toolbar |
| Layout mode | Layout dropdown - single page, double page, or long strip |
| Fit mode | Fit height / Fit width (single and double page layouts) |
| Reading direction | Right-to-left / Left-to-right (double page layout) |
| Zoom | Slider, ± buttons, or editable percentage field (all layouts, 25%–200%) |

Layout and display preferences are saved in your browser and apply across all volumes. Ratings are always shown as 10 stars with a small numeric score (e.g. `7.5`).

---

## Why CBZ?

CBZ (Comic Book ZIP) is the recommended format for manga in ComfortSpace.

| | CBZ | PDF |
|---|---|---|
| Chapter boundaries | Parsed from image filenames | Requires PDF bookmarks |
| Page serving | Native JPEG/PNG, one request per page | Rendered per page via PDF.js |
| Double-page spreads | Supported as a single wide image | Not practical without manual mapping |
| Ecosystem | Standard for manga readers (Komga, Kavita, etc.) | Better suited to books and documents |

CBZ files are ZIP archives containing ordered image files. ComfortSpace reads pages on demand using [`yauzl`](https://github.com/thejoshwolfe/yauzl) - archives are never fully extracted to disk.

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

**After cloning**, copy your own `.cbz` files into `data/manga/<series-slug>/` - archives are gitignored and are not pushed to GitHub.

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

- **Folder name** - becomes the series slug (e.g. `delicious-in-dungeon` → `/series/delicious-in-dungeon`)
- **Volume files** - must contain a volume number matching `v01`, `v02`, etc. (e.g. `v01.cbz`, `v12.cbz`)
- **CBZ contents** - image files inside the archive; chapter and page order are parsed from filenames when present

Example internal CBZ filename (used for chapter detection):

```
Delicious in Dungeon - c001 (v01) - p002-p003 [Yen Press] [Digital] [1r0n].jpg
                      ^chapter      ^page / spread
```

After adding or removing files, click **Rescan library** in the app header (or restart the server).

### Media and git

CBZ/CBR/PDF files are listed in `.gitignore` and should stay on your machine (or NAS/cloud folder). Only lightweight files like `series.json` belong in the repository. This keeps clones fast and avoids GitHub’s file size limits.

---

Each series folder may include a `series.json` for display metadata. Values here override auto-detected defaults during a library scan. You can edit this file by hand or use **Edit series info** on the series page.

```json
{
  "title": "Delicious in Dungeon",
  "author": "Ryoko Kui",
  "yearStart": 2017,
  "yearEnd": 2024,
  "description": "After a party member is eaten by a dragon...",
  "genres": ["Fantasy", "Comedy"],
  "tags": ["monsters", "cooking"],
  "status": "completed",
  "altTitles": ["Dungeon Meshi"],
  "publisher": "Yen Press",
  "language": "en",
  "chapterOverrides": {
    "1": {
      "3": { "title": "Custom Chapter Title" }
    }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | No | Display title (defaults to slug converted to title case) |
| `author` | No | Author or artist name |
| `yearStart` | No | First publication year |
| `yearEnd` | No | Last publication year |
| `description` | No | Short series synopsis |
| `genres` | No | Array of genre labels |
| `tags` | No | Array of freeform tags |
| `status` | No | `ongoing`, `completed`, or `hiatus` |
| `altTitles` | No | Alternate series titles |
| `publisher` | No | Publisher name |
| `language` | No | Language code (e.g. `en`, `ja`) |
| `chapterOverrides` | No | Per-volume, per-chapter title overrides (keys are volume/chapter numbers as strings) |

User-specific data (reading progress, read marks, ratings) is **not** stored in `series.json`. It lives in `.cache/library.json`.

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
│   ├── progress.ts             # Reading progress read/write
│   ├── userData.ts             # Read marks and ratings
│   ├── stats.ts                # Progress/rating rollups
│   └── metadata.ts             # series.json read/write
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
    ├── progress →  reads/writes reading position
    ├── userData →  read marks and ratings
    ├── stats    →  computes rollups for API responses
    └── metadata →  reads/writes series.json
    │
    ▼
Local filesystem
    ├── data/manga/**/*.cbz
    └── .cache/library.json
```

The browser cannot read arbitrary local files, so a small Node.js server acts as the bridge between your filesystem and the web UI. Everything runs on `localhost` - nothing is sent to the internet.

### Catalog cache (`.cache/library.json`)

Generated on startup and on rescan. User data (progress, read status, ratings) is preserved across rescans.

```json
{
  "scannedAt": "2026-06-29T12:26:32.728Z",
  "series": [ "..." ],
  "progress": {
    "delicious-in-dungeon/1": {
      "page": 12,
      "chapter": 1,
      "updatedAt": "2026-06-29T12:27:29.103Z"
    }
  },
  "readStatus": {
    "delicious-in-dungeon/1/1": {
      "read": true,
      "readAt": "2026-06-29T13:00:00.000Z",
      "updatedAt": "2026-06-29T13:00:00.000Z"
    }
  },
  "ratings": {
    "delicious-in-dungeon/1/1": {
      "score": 8.5,
      "updatedAt": "2026-06-29T13:05:00.000Z"
    }
  }
}
```

Key patterns for `progress`, `readStatus`, and `ratings`:

| Level | Key pattern | Example |
|-------|-------------|---------|
| Series | `{seriesId}` | `delicious-in-dungeon` |
| Volume | `{seriesId}/{volume}` | `delicious-in-dungeon/3` |
| Chapter | `{seriesId}/{volume}/{chapter}` | `delicious-in-dungeon/3/5` |

### Rating scores (manual vs calculated)

Ratings are stored as manual scores at each level. The API also returns **calculated** rollups in `stats.ratings`:

| Level | Fields | Meaning |
|-------|--------|---------|
| Chapter | `manual` | Your rating for that chapter |
| Volume | `manual`, `calculated` | Your volume rating; `calculated` = average of rated chapters |
| Series | `manual`, `calculated`, `calculatedFromManualChildren` | Your series rating; `calculated` = average of volume calculated scores; `calculatedFromManualChildren` = average of manual volume ratings |

On the series page all three series scores are always shown (empty stars and `-` when no score yet). Volume cards show your rating plus a calculated score from chapters.

---

## API reference

All endpoints are served at `http://localhost:3001/api` (proxied through Vite in development).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/library` | Full library catalog with per-series stats |
| `POST` | `/library/rescan` | Re-scan `data/manga/` and rebuild catalog |
| `GET` | `/series/:slug` | Series detail with volumes, stats, read status, ratings |
| `GET` | `/series/:slug/metadata` | Raw `series.json` metadata |
| `PUT` | `/series/:slug/metadata` | Write `series.json` and rescan series |
| `GET` | `/series/:slug/volumes/:num` | Volume detail with chapters, stats, read status, ratings |
| `GET` | `/series/:slug/volumes/:num/pages/:page` | Page image (JPEG/PNG/WebP) |
| `PATCH` | `/progress` | Save reading progress |
| `PATCH` | `/read-status` | Mark or unmark series/volume/chapter as read |
| `PATCH` | `/ratings` | Set or clear rating (1–10, or `null` to remove) |

### Save progress

```bash
curl -X PATCH http://localhost:3001/api/progress \
  -H "Content-Type: application/json" \
  -d '{"seriesId": "delicious-in-dungeon", "volume": 1, "page": 12, "chapter": 1}'
```

### Mark as read

```bash
curl -X PATCH http://localhost:3001/api/read-status \
  -H "Content-Type: application/json" \
  -d '{"seriesId": "delicious-in-dungeon", "volume": 1, "chapter": 3, "read": true}'
```

### Set rating

```bash
curl -X PATCH http://localhost:3001/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"seriesId": "delicious-in-dungeon", "volume": 1, "chapter": 3, "score": 8.5}'
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

- [x] Manga - CBZ library, volume/chapter reader, progress tracking, read marks, ratings, metadata wizard
- [ ] Books - EPUB/PDF support
- [ ] Video - TV series and movies
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

This project does not include a license file. Manga files you add to `data/manga/` are your own responsibility - only add content you have the right to possess and use.
