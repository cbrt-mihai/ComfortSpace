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

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseVolumeNumber(filename: string): number | null {
  const match = filename.match(
    /(?:^|[^a-zA-Z])(?:v|vol(?:ume)?)\s*\.?\s*[-_ ]?\s*0*(\d+)\b/i
  );
  return match ? parseInt(match[1], 10) : null;
}

function buildChapters(pages: { index: number; chapter: number }[]): Chapter[] {
  if (pages.length === 0) return [];

  const chapters: Chapter[] = [];
  let currentChapter = pages.find((p) => p.chapter > 0)?.chapter || 1;
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

function applyChapterOverrides(
  chapters: Chapter[],
  volNum: number,
  metadata: SeriesMetadata | null
): Chapter[] {
  const overrides = metadata?.chapterOverrides?.[String(volNum)];
  if (!overrides) return chapters;

  return chapters.map((ch) => {
    const override = overrides[String(ch.number)];
    if (override?.title) {
      return { ...ch, title: override.title };
    }
    return ch;
  });
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
      chapters: applyChapterOverrides(buildChapters(pages), volNum, metadata),
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
    genres: metadata?.genres,
    tags: metadata?.tags,
    status: metadata?.status,
    altTitles: metadata?.altTitles,
    publisher: metadata?.publisher,
    language: metadata?.language,
    coverPage: `/api/series/${slug}/volumes/1/pages/1`,
    volumes,
  };
}

async function loadExistingUserData(): Promise<
  Pick<Library, "progress" | "readStatus" | "ratings">
> {
  try {
    const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
    const lib = JSON.parse(raw) as Library;
    return {
      progress: lib.progress ?? {},
      readStatus: lib.readStatus ?? {},
      ratings: lib.ratings ?? {},
    };
  } catch {
    return { progress: {}, readStatus: {}, ratings: {} };
  }
}

export function normalizeLibrary(raw: Library): Library {
  return {
    ...raw,
    progress: raw.progress ?? {},
    readStatus: raw.readStatus ?? {},
    ratings: raw.ratings ?? {},
  };
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

  const userData = await loadExistingUserData();

  const library: Library = {
    scannedAt: new Date().toISOString(),
    series,
    progress: userData.progress,
    readStatus: userData.readStatus,
    ratings: userData.ratings,
  };

  await fs.writeFile(LIBRARY_PATH, JSON.stringify(library, null, 2));
  return library;
}

export async function rescanSeries(slug: string): Promise<Series | null> {
  const seriesDir = path.join(DATA_DIR, slug);
  const scanned = await scanSeries(seriesDir);
  if (!scanned) return null;

  const library = await loadLibrary();
  const idx = library.series.findIndex((s) => s.slug === slug);
  if (idx >= 0) {
    library.series[idx] = scanned;
  } else {
    library.series.push(scanned);
  }
  library.series.sort((a, b) => a.title.localeCompare(b.title));
  library.scannedAt = new Date().toISOString();
  await fs.writeFile(LIBRARY_PATH, JSON.stringify(library, null, 2));
  return scanned;
}

export async function loadLibrary(): Promise<Library> {
  try {
    const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
    return normalizeLibrary(JSON.parse(raw) as Library);
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
