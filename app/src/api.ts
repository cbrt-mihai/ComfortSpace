import type {
  Library,
  ProgressEntry,
  RatingEntry,
  ReadEntry,
  Series,
  SeriesMetadata,
  VolumeDetail,
} from "./types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export function getLibrary(): Promise<Library> {
  return fetchJson<Library>("/api/library");
}

export function rescanLibrary(): Promise<Library> {
  return fetchJson<Library>("/api/library/rescan", { method: "POST" });
}

export function getSeries(slug: string): Promise<Series> {
  return fetchJson<Series>(`/api/series/${slug}`);
}

export function getVolume(slug: string, volume: number): Promise<VolumeDetail> {
  return fetchJson<VolumeDetail>(`/api/series/${slug}/volumes/${volume}`);
}

export function pageUrl(slug: string, volume: number, page: number): string {
  return `/api/series/${slug}/volumes/${volume}/pages/${page}`;
}

export function saveProgress(
  seriesId: string,
  volume: number,
  page: number,
  chapter?: number
): Promise<ProgressEntry> {
  return fetchJson<ProgressEntry>("/api/progress", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seriesId, volume, page, chapter }),
  });
}

export function setReadStatus(
  seriesId: string,
  read: boolean,
  volume?: number,
  chapter?: number
): Promise<ReadEntry> {
  return fetchJson<ReadEntry>("/api/read-status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seriesId, volume, chapter, read }),
  });
}

export function setRating(
  seriesId: string,
  score: number | null,
  volume?: number,
  chapter?: number,
  cascade = false
): Promise<RatingEntry | null> {
  return fetchJson<RatingEntry | null>("/api/ratings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seriesId, volume, chapter, score, cascade }),
  });
}

export function getSeriesMetadata(slug: string): Promise<SeriesMetadata> {
  return fetchJson<SeriesMetadata>(`/api/series/${slug}/metadata`);
}

export function saveSeriesMetadata(
  slug: string,
  metadata: SeriesMetadata
): Promise<{ metadata: SeriesMetadata; series: Series | null }> {
  return fetchJson<{ metadata: SeriesMetadata; series: Series | null }>(
    `/api/series/${slug}/metadata`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    }
  );
}
