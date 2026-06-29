import fs from "node:fs/promises";
import { LIBRARY_PATH } from "./paths.js";
import type { Library, RatingEntry, ReadEntry, Volume } from "./types.js";

export function itemKey(
  seriesId: string,
  volume?: number,
  chapter?: number
): string {
  if (chapter !== undefined && volume !== undefined) {
    return `${seriesId}/${volume}/${chapter}`;
  }
  if (volume !== undefined) {
    return `${seriesId}/${volume}`;
  }
  return seriesId;
}

async function loadLibraryRaw(): Promise<Library> {
  const raw = await fs.readFile(LIBRARY_PATH, "utf-8");
  const library = JSON.parse(raw) as Library;
  library.readStatus ??= {};
  library.ratings ??= {};
  library.progress ??= {};
  return library;
}

async function saveLibraryRaw(library: Library): Promise<void> {
  await fs.writeFile(LIBRARY_PATH, JSON.stringify(library, null, 2));
}

export function getReadStatus(
  library: Library,
  seriesId: string,
  volume?: number,
  chapter?: number
): ReadEntry | undefined {
  return library.readStatus[itemKey(seriesId, volume, chapter)];
}

export function isExplicitlyUnread(
  library: Library,
  seriesId: string,
  volume?: number,
  chapter?: number
): boolean {
  const entry = getReadStatus(library, seriesId, volume, chapter);
  return entry !== undefined && entry.read === false;
}

export function isRead(
  library: Library,
  seriesId: string,
  volume?: number,
  chapter?: number
): boolean {
  const entry = getReadStatus(library, seriesId, volume, chapter);
  return entry?.read === true;
}

function progressKey(seriesId: string, volume: number, chapter?: number): string {
  if (chapter !== undefined) return `${seriesId}/${volume}/${chapter}`;
  return `${seriesId}/${volume}`;
}

function deleteProgressScope(
  library: Library,
  seriesId: string,
  volume?: number,
  chapter?: number
): void {
  if (volume === undefined) {
    for (const key of Object.keys(library.progress)) {
      if (key.startsWith(`${seriesId}/`)) delete library.progress[key];
    }
    return;
  }

  const volPrefix = `${seriesId}/${volume}`;
  if (chapter === undefined) {
    for (const key of Object.keys(library.progress)) {
      if (key === volPrefix || key.startsWith(`${volPrefix}/`)) {
        delete library.progress[key];
      }
    }
    return;
  }

  delete library.progress[progressKey(seriesId, volume, chapter)];

  const series = library.series.find((s) => s.id === seriesId);
  const vol = series?.volumes.find((v) => v.number === volume);
  const ch = vol?.chapters.find((c) => c.number === chapter);
  if (!vol || !ch) return;

  const resetPage = Math.max(0, ch.pageStart - 1);
  const volKey = progressKey(seriesId, volume);
  if (resetPage <= 0) {
    delete library.progress[volKey];
    return;
  }

  const prevChapter = vol.chapters.find((c) => c.pageEnd <= resetPage);
  library.progress[volKey] = {
    page: resetPage,
    chapter: prevChapter?.number,
    updatedAt: new Date().toISOString(),
  };
}

function setProgressComplete(
  library: Library,
  seriesId: string,
  vol: Volume,
  now: string,
  throughChapter?: number
): void {
  if (throughChapter !== undefined) {
    const ch = vol.chapters.find((c) => c.number === throughChapter);
    if (ch) {
      library.progress[progressKey(seriesId, vol.number)] = {
        page: ch.pageEnd,
        chapter: throughChapter,
        updatedAt: now,
      };
      return;
    }
  }

  const lastChapter = vol.chapters.at(-1);
  library.progress[progressKey(seriesId, vol.number)] = {
    page: vol.totalPages,
    chapter: lastChapter?.number,
    updatedAt: now,
  };
}

function syncProgressForReadStatus(
  library: Library,
  seriesId: string,
  read: boolean,
  volume?: number,
  chapter?: number
): void {
  const series = library.series.find((s) => s.id === seriesId);
  if (!series) return;

  if (!read) {
    deleteProgressScope(library, seriesId, volume, chapter);
    return;
  }

  if (volume === undefined) {
    for (const vol of series.volumes) {
      setProgressComplete(library, seriesId, vol, new Date().toISOString());
    }
  } else {
    const vol = series.volumes.find((v) => v.number === volume);
    if (vol) {
      setProgressComplete(library, seriesId, vol, new Date().toISOString(), chapter);
    }
  }
}

export async function setReadStatus(
  seriesId: string,
  read: boolean,
  volume?: number,
  chapter?: number
): Promise<ReadEntry> {
  const library = await loadLibraryRaw();
  const now = new Date().toISOString();
  const key = itemKey(seriesId, volume, chapter);

  const entry: ReadEntry = {
    read,
    readAt: read ? now : undefined,
    updatedAt: now,
  };
  library.readStatus[key] = entry;

  if (read) {
    if (volume === undefined) {
      const series = library.series.find((s) => s.id === seriesId);
      if (series) {
        for (const vol of series.volumes) {
          library.readStatus[itemKey(seriesId, vol.number)] = {
            read: true,
            readAt: now,
            updatedAt: now,
          };
          for (const ch of vol.chapters) {
            library.readStatus[itemKey(seriesId, vol.number, ch.number)] = {
              read: true,
              readAt: now,
              updatedAt: now,
            };
          }
        }
      }
    } else if (chapter === undefined) {
      const series = library.series.find((s) => s.id === seriesId);
      const vol = series?.volumes.find((v) => v.number === volume);
      if (vol) {
        for (const ch of vol.chapters) {
          library.readStatus[itemKey(seriesId, volume, ch.number)] = {
            read: true,
            readAt: now,
            updatedAt: now,
          };
        }
      }
    } else {
      const series = library.series.find((s) => s.id === seriesId);
      const vol = series?.volumes.find((v) => v.number === volume);
      if (vol) {
        for (const ch of vol.chapters) {
          if (ch.number > chapter) continue;
          const chKey = itemKey(seriesId, volume, ch.number);
          const existing = library.readStatus[chKey];
          if (existing?.read === false) continue;
          library.readStatus[chKey] = {
            read: true,
            readAt: now,
            updatedAt: now,
          };
        }
      }
    }
  } else {
    const unreadEntry: ReadEntry = { read: false, updatedAt: now };
    if (volume === undefined) {
      const series = library.series.find((s) => s.id === seriesId);
      if (series) {
        for (const vol of series.volumes) {
          library.readStatus[itemKey(seriesId, vol.number)] = unreadEntry;
          for (const ch of vol.chapters) {
            library.readStatus[itemKey(seriesId, vol.number, ch.number)] = unreadEntry;
          }
        }
      }
    } else if (chapter === undefined) {
      const series = library.series.find((s) => s.id === seriesId);
      const vol = series?.volumes.find((v) => v.number === volume);
      if (vol) {
        for (const ch of vol.chapters) {
          library.readStatus[itemKey(seriesId, volume, ch.number)] = unreadEntry;
        }
      }
    }
  }

  syncProgressForReadStatus(library, seriesId, read, volume, chapter);

  await saveLibraryRaw(library);
  return entry;
}

export async function autoMarkRead(
  seriesId: string,
  volume: number,
  chapter?: number
): Promise<void> {
  const library = await loadLibraryRaw();

  if (isExplicitlyUnread(library, seriesId, volume)) return;
  if (chapter !== undefined && isExplicitlyUnread(library, seriesId, volume, chapter)) {
    return;
  }

  const now = new Date().toISOString();
  let changed = false;

  const volKey = itemKey(seriesId, volume);
  if (!isRead(library, seriesId, volume)) {
    library.readStatus[volKey] = { read: true, readAt: now, updatedAt: now };
    changed = true;
  }

  if (chapter !== undefined) {
    const chKey = itemKey(seriesId, volume, chapter);
    if (!isRead(library, seriesId, volume, chapter)) {
      library.readStatus[chKey] = { read: true, readAt: now, updatedAt: now };
      changed = true;
    }
  }

  if (changed) {
    await saveLibraryRaw(library);
  }
}

export function getRating(
  library: Library,
  seriesId: string,
  volume?: number,
  chapter?: number
): RatingEntry | undefined {
  return library.ratings[itemKey(seriesId, volume, chapter)];
}

export async function setRating(
  seriesId: string,
  score: number | null,
  volume?: number,
  chapter?: number,
  cascade = false
): Promise<RatingEntry | null> {
  const library = await loadLibraryRaw();
  const key = itemKey(seriesId, volume, chapter);

  if (score === null) {
    delete library.ratings[key];

    if (cascade) {
      if (volume === undefined) {
        const series = library.series.find((s) => s.id === seriesId);
        if (series) {
          for (const vol of series.volumes) {
            delete library.ratings[itemKey(seriesId, vol.number)];
            for (const ch of vol.chapters) {
              delete library.ratings[itemKey(seriesId, vol.number, ch.number)];
            }
          }
        }
      } else if (chapter === undefined) {
        const series = library.series.find((s) => s.id === seriesId);
        const vol = series?.volumes.find((v) => v.number === volume);
        if (vol) {
          for (const ch of vol.chapters) {
            delete library.ratings[itemKey(seriesId, volume, ch.number)];
          }
        }
      }
    }

    await saveLibraryRaw(library);
    return null;
  }

  const clamped = Math.min(10, Math.max(1, Math.round(score * 2) / 2));
  const entry: RatingEntry = {
    score: clamped,
    updatedAt: new Date().toISOString(),
  };
  library.ratings[key] = entry;
  await saveLibraryRaw(library);
  return entry;
}
