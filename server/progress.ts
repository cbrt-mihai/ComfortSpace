import fs from "node:fs/promises";
import { LIBRARY_PATH } from "./paths.js";
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
  const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
  const library = JSON.parse(raw) as Library;

  const entry: ProgressEntry = {
    page,
    chapter,
    updatedAt: new Date().toISOString(),
  };

  library.progress[progressKey(seriesId, volume)] = entry;
  if (chapter !== undefined) {
    library.progress[progressKey(seriesId, volume, chapter)] = entry;
  }

  await fs.writeFile(LIBRARY_PATH, JSON.stringify(library, null, 2));
  return entry;
}

export function getVolumeProgress(
  library: Library,
  seriesId: string,
  volume: number
): ProgressEntry | undefined {
  return library.progress[progressKey(seriesId, volume)];
}
