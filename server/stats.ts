import { getVolumeProgress } from "./progress.js";
import { getRating, getReadStatus } from "./userData.js";
import type {
  Chapter,
  ItemRatings,
  ItemStats,
  Library,
  Series,
  Volume,
} from "./types.js";

function isLaterChapterExplicitlyRead(
  library: Library,
  seriesId: string,
  volume: Volume,
  chapter: Chapter
): boolean {
  for (const ch of volume.chapters) {
    if (ch.number > chapter.number) {
      const entry = getReadStatus(library, seriesId, volume.number, ch.number);
      if (entry?.read === true) return true;
    }
  }
  return false;
}

function isChapterRead(
  library: Library,
  seriesId: string,
  volume: Volume,
  chapter: Chapter
): boolean {
  const readEntry = getReadStatus(library, seriesId, volume.number, chapter.number);
  if (readEntry?.read === true) return true;
  if (readEntry?.read === false) return false;

  if (isLaterChapterExplicitlyRead(library, seriesId, volume, chapter)) return true;

  const volProgress = getVolumeProgress(library, seriesId, volume.number);
  if (volProgress && volProgress.page >= chapter.pageEnd) return true;

  const volRead = getReadStatus(library, seriesId, volume.number);
  if (volRead?.read === true) return true;

  const seriesRead = getReadStatus(library, seriesId);
  if (seriesRead?.read === true) return true;

  return false;
}

function isVolumeRead(library: Library, seriesId: string, volume: Volume): boolean {
  const readEntry = getReadStatus(library, seriesId, volume.number);
  if (readEntry?.read === true) return true;
  if (readEntry?.read === false) return false;

  const seriesRead = getReadStatus(library, seriesId);
  if (seriesRead?.read === true) return true;

  const volProgress = getVolumeProgress(library, seriesId, volume.number);
  if (volProgress && volProgress.page >= volume.totalPages) return true;

  return volume.chapters.every((ch) =>
    isChapterRead(library, seriesId, volume, ch)
  );
}

function chapterPagesRead(
  library: Library,
  seriesId: string,
  volume: Volume,
  chapter: Chapter
): number {
  const chapterReadEntry = getReadStatus(
    library,
    seriesId,
    volume.number,
    chapter.number
  );
  if (chapterReadEntry?.read === false) return 0;

  const volumeReadEntry = getReadStatus(library, seriesId, volume.number);
  if (volumeReadEntry?.read === false) return 0;

  const seriesReadEntry = getReadStatus(library, seriesId);
  if (seriesReadEntry?.read === false) return 0;

  if (isChapterRead(library, seriesId, volume, chapter)) {
    return chapter.pageCount;
  }

  const volProgress = getVolumeProgress(library, seriesId, volume.number);
  if (!volProgress) return 0;

  if (volProgress.page < chapter.pageStart) return 0;
  if (volProgress.page >= chapter.pageEnd) return chapter.pageCount;
  return volProgress.page - chapter.pageStart + 1;
}

function averageFromScores(scores: number[]): number | undefined {
  if (scores.length === 0) return undefined;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

function computeChapterRatings(
  library: Library,
  seriesId: string,
  volume: Volume,
  chapter: Chapter
): ItemRatings {
  const manual = getRating(library, seriesId, volume.number, chapter.number)?.score;
  return manual !== undefined ? { manual } : {};
}

function computeVolumeCalculated(
  library: Library,
  seriesId: string,
  volume: Volume
): number | undefined {
  const scores: number[] = [];
  for (const ch of volume.chapters) {
    const manual = getRating(library, seriesId, volume.number, ch.number)?.score;
    if (manual !== undefined) scores.push(manual);
  }
  return averageFromScores(scores);
}

function computeVolumeRatings(
  library: Library,
  seriesId: string,
  volume: Volume
): ItemRatings {
  const manual = getRating(library, seriesId, volume.number)?.score;
  const calculated = computeVolumeCalculated(library, seriesId, volume);
  const ratings: ItemRatings = {};
  if (manual !== undefined) ratings.manual = manual;
  if (calculated !== undefined) ratings.calculated = calculated;
  return ratings;
}

function computeSeriesRatings(library: Library, series: Series): ItemRatings {
  const manual = getRating(library, series.id)?.score;

  const volumeCalculatedScores: number[] = [];
  const volumeManualScores: number[] = [];

  for (const vol of series.volumes) {
    const volCalculated = computeVolumeCalculated(library, series.id, vol);
    if (volCalculated !== undefined) volumeCalculatedScores.push(volCalculated);

    const volManual = getRating(library, series.id, vol.number)?.score;
    if (volManual !== undefined) volumeManualScores.push(volManual);
  }

  const ratings: ItemRatings = {};
  if (manual !== undefined) ratings.manual = manual;

  const calculated = averageFromScores(volumeCalculatedScores);
  if (calculated !== undefined) ratings.calculated = calculated;

  const calculatedFromManualChildren = averageFromScores(volumeManualScores);
  if (calculatedFromManualChildren !== undefined) {
    ratings.calculatedFromManualChildren = calculatedFromManualChildren;
  }

  return ratings;
}

export function computeChapterStats(
  library: Library,
  seriesId: string,
  volume: Volume,
  chapter: Chapter
): ItemStats {
  const read = isChapterRead(library, seriesId, volume, chapter);
  const pagesRead = chapterPagesRead(library, seriesId, volume, chapter);
  const ratings = computeChapterRatings(library, seriesId, volume, chapter);

  return {
    chaptersRead: read ? 1 : 0,
    chaptersTotal: 1,
    pagesRead,
    pagesTotal: chapter.pageCount,
    percentComplete: read
      ? 100
      : chapter.pageCount > 0
        ? Math.round((pagesRead / chapter.pageCount) * 100)
        : 0,
    ratings: Object.keys(ratings).length > 0 ? ratings : undefined,
  };
}

export function computeVolumeStats(
  library: Library,
  seriesId: string,
  volume: Volume
): ItemStats {
  let chaptersRead = 0;
  let pagesRead = 0;
  let pagesTotal = 0;

  for (const ch of volume.chapters) {
    pagesTotal += ch.pageCount;
    if (isChapterRead(library, seriesId, volume, ch)) {
      chaptersRead++;
      pagesRead += ch.pageCount;
    } else {
      pagesRead += chapterPagesRead(library, seriesId, volume, ch);
    }
  }

  const ratings = computeVolumeRatings(library, seriesId, volume);
  const volRead = isVolumeRead(library, seriesId, volume);

  return {
    chaptersRead,
    chaptersTotal: volume.chapters.length,
    pagesRead,
    pagesTotal: pagesTotal || volume.totalPages,
    percentComplete:
      pagesTotal > 0 ? Math.round((pagesRead / pagesTotal) * 100) : volRead ? 100 : 0,
    ratings: Object.keys(ratings).length > 0 ? ratings : undefined,
  };
}

export function computeSeriesStats(library: Library, series: Series): ItemStats {
  let volumesRead = 0;
  let chaptersRead = 0;
  let chaptersTotal = 0;
  let pagesRead = 0;
  let pagesTotal = 0;

  for (const vol of series.volumes) {
    if (isVolumeRead(library, series.id, vol)) volumesRead++;
    const volStats = computeVolumeStats(library, series.id, vol);
    chaptersRead += volStats.chaptersRead;
    chaptersTotal += volStats.chaptersTotal;
    pagesRead += volStats.pagesRead;
    pagesTotal += volStats.pagesTotal;
  }

  const ratings = computeSeriesRatings(library, series);

  return {
    volumesRead,
    volumesTotal: series.volumes.length,
    chaptersRead,
    chaptersTotal,
    pagesRead,
    pagesTotal,
    percentComplete: pagesTotal > 0 ? Math.round((pagesRead / pagesTotal) * 100) : 0,
    ratings: Object.keys(ratings).length > 0 ? ratings : undefined,
  };
}

export function enrichChapter(
  library: Library,
  seriesId: string,
  volume: Volume,
  chapter: Chapter
) {
  const readEntry = getReadStatus(library, seriesId, volume.number, chapter.number);
  const rating = getRating(library, seriesId, volume.number, chapter.number);
  const volProgress = getVolumeProgress(library, seriesId, volume.number);
  const chapterProgress =
    volProgress && volProgress.page >= chapter.pageStart
      ? { page: Math.min(volProgress.page, chapter.pageEnd), updatedAt: volProgress.updatedAt }
      : undefined;

  return {
    ...chapter,
    stats: computeChapterStats(library, seriesId, volume, chapter),
    readStatus: readEntry,
    rating: rating?.score,
    progress: chapterProgress,
  };
}

export function enrichVolume(library: Library, seriesId: string, volume: Volume) {
  const readEntry = getReadStatus(library, seriesId, volume.number);
  const rating = getRating(library, seriesId, volume.number);

  return {
    ...volume,
    chapters: volume.chapters.map((ch) =>
      enrichChapter(library, seriesId, volume, ch)
    ),
    stats: computeVolumeStats(library, seriesId, volume),
    progress: getVolumeProgress(library, seriesId, volume.number),
    readStatus: readEntry,
    rating: rating?.score,
  };
}

export function enrichSeries(library: Library, series: Series) {
  const readEntry = getReadStatus(library, series.id);
  const rating = getRating(library, series.id);

  return {
    ...series,
    volumes: series.volumes.map((vol) => enrichVolume(library, series.id, vol)),
    stats: computeSeriesStats(library, series),
    readStatus: readEntry,
    rating: rating?.score,
  };
}
