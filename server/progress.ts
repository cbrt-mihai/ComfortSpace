import fs from "node:fs/promises";
import { LIBRARY_PATH } from "./paths.js";
import { findSeries, findVolume, loadLibrary } from "./scanner.js";
import { autoMarkRead } from "./userData.js";
import type { Library, ProgressEntry } from "./types.js";

export function progressKey(
  seriesId: string,
  volume: number,
  chapter?: number
): string {
  if (chapter !== undefined) {
    return `${seriesId}/${volume}/${chapter}`;
  }
  return `${seriesId}/${volume}`;
}

export async function saveProgress(
  seriesId: string,
  volume: number,
  page: number,
  chapter?: number
): Promise<ProgressEntry> {
  const library = await loadLibrary();
  const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
  const lib = JSON.parse(raw) as Library;

  const entry: ProgressEntry = {
    page,
    chapter,
    updatedAt: new Date().toISOString(),
  };

  lib.progress[progressKey(seriesId, volume)] = entry;
  if (chapter !== undefined) {
    lib.progress[progressKey(seriesId, volume, chapter)] = entry;
  }

  await fs.writeFile(LIBRARY_PATH, JSON.stringify(lib, null, 2));

  const series = findSeries(library, seriesId);
  const vol = series ? findVolume(series, volume) : undefined;
  if (vol && page >= vol.totalPages) {
    await autoMarkRead(seriesId, volume, chapter);
  }

  return entry;
}

export function getVolumeProgress(
  library: Library,
  seriesId: string,
  volume: number
): ProgressEntry | undefined {
  return library.progress[progressKey(seriesId, volume)];
}
