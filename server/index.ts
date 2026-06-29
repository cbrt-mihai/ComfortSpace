import cors from "cors";
import express from "express";
import path from "node:path";
import { cbzExists, getCbzPage } from "./cbz.js";
import { readSeriesMetadataFile, writeSeriesMetadata } from "./metadata.js";
import { DATA_DIR, ROOT_DIR } from "./paths.js";
import { getVolumeProgress, saveProgress } from "./progress.js";
import { enrichSeries, enrichVolume } from "./stats.js";
import {
  findSeries,
  findVolume,
  loadLibrary,
  rescanSeries,
  scanLibrary,
} from "./scanner.js";
import { setRating, setReadStatus } from "./userData.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/library", async (_req, res) => {
  const library = await loadLibrary();
  res.json({
    ...library,
    series: library.series.map((s) => enrichSeries(library, s)),
  });
});

app.post("/api/library/rescan", async (_req, res) => {
  const library = await scanLibrary();
  res.json({
    ...library,
    series: library.series.map((s) => enrichSeries(library, s)),
  });
});

app.get("/api/series/:slug", async (req, res) => {
  const library = await loadLibrary();
  const series = findSeries(library, req.params.slug);
  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }

  res.json(enrichSeries(library, series));
});

app.get("/api/series/:slug/metadata", async (req, res) => {
  const library = await loadLibrary();
  const series = findSeries(library, req.params.slug);
  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }
  const metadata = await readSeriesMetadataFile(req.params.slug);
  res.json(metadata);
});

app.put("/api/series/:slug/metadata", async (req, res) => {
  const library = await loadLibrary();
  const series = findSeries(library, req.params.slug);
  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }

  try {
    const metadata = await writeSeriesMetadata(req.params.slug, req.body);
    await rescanSeries(req.params.slug);
    const updated = await loadLibrary();
    const refreshed = findSeries(updated, req.params.slug);
    res.json({
      metadata,
      series: refreshed ? enrichSeries(updated, refreshed) : null,
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Invalid metadata",
    });
  }
});

app.get("/api/series/:slug/volumes/:num", async (req, res) => {
  const library = await loadLibrary();
  const series = findSeries(library, req.params.slug);
  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }

  const volumeNum = parseInt(req.params.num, 10);
  const volume = findVolume(series, volumeNum);
  if (!volume) {
    res.status(404).json({ error: "Volume not found" });
    return;
  }

  res.json({
    ...enrichVolume(library, series.id, volume),
    series: { id: series.id, title: series.title, slug: series.slug },
  });
});

app.get("/api/series/:slug/volumes/:num/pages/:page", async (req, res) => {
  const library = await loadLibrary();
  const series = findSeries(library, req.params.slug);
  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }

  const volumeNum = parseInt(req.params.num, 10);
  const pageNum = parseInt(req.params.page, 10);
  const volume = findVolume(series, volumeNum);
  if (!volume) {
    res.status(404).json({ error: "Volume not found" });
    return;
  }

  const cbzPath = path.join(ROOT_DIR, series.path, volume.filename);
  if (!cbzExists(cbzPath)) {
    res.status(404).json({ error: "CBZ file not found" });
    return;
  }

  try {
    const result = await getCbzPage(cbzPath, pageNum);
    if (!result) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    res.set("Content-Type", result.contentType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(result.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read page" });
  }
});

app.patch("/api/progress", async (req, res) => {
  const { seriesId, volume, page, chapter } = req.body as {
    seriesId?: string;
    volume?: number;
    page?: number;
    chapter?: number;
  };

  if (!seriesId || volume === undefined || page === undefined) {
    res.status(400).json({ error: "seriesId, volume, and page are required" });
    return;
  }

  const entry = await saveProgress(seriesId, volume, page, chapter);
  res.json(entry);
});

app.patch("/api/read-status", async (req, res) => {
  const { seriesId, volume, chapter, read } = req.body as {
    seriesId?: string;
    volume?: number;
    chapter?: number;
    read?: boolean;
  };

  if (!seriesId || read === undefined) {
    res.status(400).json({ error: "seriesId and read are required" });
    return;
  }

  const entry = await setReadStatus(seriesId, read, volume, chapter);
  res.json(entry);
});

app.patch("/api/ratings", async (req, res) => {
  const { seriesId, volume, chapter, score, cascade } = req.body as {
    seriesId?: string;
    volume?: number;
    chapter?: number;
    score?: number | null;
    cascade?: boolean;
  };

  if (!seriesId) {
    res.status(400).json({ error: "seriesId is required" });
    return;
  }

  if (score !== null && score !== undefined) {
    if (typeof score !== "number" || score < 1 || score > 10) {
      res.status(400).json({ error: "score must be between 1 and 10, or null" });
      return;
    }
  }

  const entry = await setRating(
    seriesId,
    score === undefined ? null : score,
    volume,
    chapter,
    cascade === true
  );
  res.json(entry);
});

async function start() {
  await scanLibrary();
  app.listen(PORT, () => {
    console.log(`ComfortSpace API running at http://localhost:${PORT}`);
    console.log(`Manga library: ${DATA_DIR}`);
  });
}

start().catch(console.error);
