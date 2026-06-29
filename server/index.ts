import cors from "cors";
import express from "express";
import path from "node:path";
import { cbzExists, getCbzPage } from "./cbz.js";
import { DATA_DIR, ROOT_DIR } from "./paths.js";
import { getVolumeProgress, saveProgress } from "./progress.js";
import {
  findSeries,
  findVolume,
  loadLibrary,
  scanLibrary,
} from "./scanner.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/library", async (_req, res) => {
  const library = await loadLibrary();
  res.json(library);
});

app.post("/api/library/rescan", async (_req, res) => {
  const library = await scanLibrary();
  res.json(library);
});

app.get("/api/series/:slug", async (req, res) => {
  const library = await loadLibrary();
  const series = findSeries(library, req.params.slug);
  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }

  const volumesWithProgress = series.volumes.map((vol) => ({
    ...vol,
    progress: getVolumeProgress(library, series.id, vol.number),
  }));

  res.json({ ...series, volumes: volumesWithProgress });
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
    ...volume,
    series: { id: series.id, title: series.title, slug: series.slug },
    progress: getVolumeProgress(library, series.id, volumeNum),
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

async function start() {
  await scanLibrary();
  app.listen(PORT, () => {
    console.log(`ComfortSpace API running at http://localhost:${PORT}`);
    console.log(`Manga library: ${DATA_DIR}`);
  });
}

start().catch(console.error);
