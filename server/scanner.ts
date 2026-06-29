import fs from "node:fs/promises";
import path from "node:path";
import { listCbzPages } from "./cbz.js";
import { CACHE_DIR, DATA_DIR, LIBRARY_PATH } from "./paths.js";
import type {
  Chapter,
  Library,
  Series,
  SeriesMetadata,
  Volume,
} from "./types.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseVolumeNumber(filename: string): number | null {
  const match = filename.match(/v(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function buildChapters(pages: { index: number; chapter: number }[]): Chapter[] {
  if (pages.length === 0) return [];

  const chapters: Chapter[] = [];
  let currentChapter = pages[0].chapter || 1;
  let pageStart = pages[0].index;

  for (let i = 1; i <= pages.length; i++) {
    const isLast = i === pages.length;
    const chapter = pages[i - 1].chapter || currentChapter;
    const nextChapter = !isLast ? pages[i].chapter || currentChapter : null;

    if (isLast || (nextChapter !== null && nextChapter !== currentChapter)) {
      const pageEnd = pages[i - 1].index;
      chapters.push({
        number: currentChapter,
        title: `Chapter ${currentChapter}`,
        pageStart,
        pageEnd,
        pageCount: pageEnd - pageStart + 1,
      });
      if (!isLast) {
        currentChapter = nextChapter!;
        pageStart = pages[i].index;
      }
    }
  }

  return chapters;
}

async function readSeriesMetadata(
  seriesDir: string
): Promise<SeriesMetadata | null> {
  const metaPath = path.join(seriesDir, "series.json");
  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    return JSON.parse(raw) as SeriesMetadata;
  } catch {
    return null;
  }
}

async function scanSeries(seriesDir: string): Promise<Series | null> {
  const slug = path.basename(seriesDir);
  const metadata = await readSeriesMetadata(seriesDir);
  const entries = await fs.readdir(seriesDir);
  const cbzFiles = entries
    .filter((f) => f.toLowerCase().endsWith(".cbz"))
    .sort((a, b) => {
      const na = parseVolumeNumber(a) ?? 0;
      const nb = parseVolumeNumber(b) ?? 0;
      return na - nb;
    });

  if (cbzFiles.length === 0) return null;

  const volumes: Volume[] = [];
  for (const filename of cbzFiles) {
    const volNum = parseVolumeNumber(filename);
    if (volNum === null) continue;

    const cbzPath = path.join(seriesDir, filename);
    const pages = await listCbzPages(cbzPath);
    volumes.push({
      number: volNum,
      filename,
      chapters: buildChapters(pages),
      totalPages: pages.length,
    });
  }

  if (volumes.length === 0) return null;

  const title = metadata?.title ?? titleFromSlug(slug);
  const id = slug;

  return {
    id,
    title,
    slug,
    path: path.relative(path.join(DATA_DIR, "..", ".."), seriesDir),
    author: metadata?.author,
    description: metadata?.description,
    yearStart: metadata?.yearStart,
    yearEnd: metadata?.yearEnd,
    coverPage: `/api/series/${slug}/volumes/1/pages/1`,
    volumes,
  };
}

async function loadExistingProgress(): Promise<Library["progress"]> {
  try {
    const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
    const lib = JSON.parse(raw) as Library;
    return lib.progress ?? {};
  } catch {
    return {};
  }
}

export async function scanLibrary(): Promise<Library> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });

  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  const seriesDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(DATA_DIR, e.name));

  const series: Series[] = [];
  for (const dir of seriesDirs) {
    const s = await scanSeries(dir);
    if (s) series.push(s);
  }

  series.sort((a, b) => a.title.localeCompare(b.title));

  const library: Library = {
    scannedAt: new Date().toISOString(),
    series,
    progress: await loadExistingProgress(),
  };

  await fs.writeFile(LIBRARY_PATH, JSON.stringify(library, null, 2));
  return library;
}

export async function loadLibrary(): Promise<Library> {
  try {
    const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
    return JSON.parse(raw) as Library;
  } catch {
    return scanLibrary();
  }
}

export function findSeries(library: Library, slug: string): Series | undefined {
  return library.series.find((s) => s.slug === slug);
}

export function findVolume(series: Series, volumeNum: number): Volume | undefined {
  return series.volumes.find((v) => v.number === volumeNum);
}
