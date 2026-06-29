import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./paths.js";
import type { SeriesMetadata } from "./types.js";

function seriesDir(slug: string): string {
  return path.join(DATA_DIR, slug);
}

function metadataPath(slug: string): string {
  return path.join(seriesDir(slug), "series.json");
}

export async function readSeriesMetadataFile(slug: string): Promise<SeriesMetadata> {
  try {
    const raw = await fs.readFile(metadataPath(slug), "utf-8");
    return JSON.parse(raw) as SeriesMetadata;
  } catch {
    return {};
  }
}

export function validateSeriesMetadata(data: unknown): SeriesMetadata {
  if (!data || typeof data !== "object") {
    throw new Error("Metadata must be an object");
  }
  const obj = data as Record<string, unknown>;
  const meta: SeriesMetadata = {};

  if (obj.title !== undefined) {
    if (typeof obj.title !== "string") throw new Error("title must be a string");
    meta.title = obj.title.trim();
  }
  if (obj.author !== undefined) {
    if (typeof obj.author !== "string") throw new Error("author must be a string");
    meta.author = obj.author.trim();
  }
  if (obj.description !== undefined) {
    if (typeof obj.description !== "string") throw new Error("description must be a string");
    meta.description = obj.description.trim();
  }
  if (obj.yearStart !== undefined) {
    if (typeof obj.yearStart !== "number") throw new Error("yearStart must be a number");
    meta.yearStart = obj.yearStart;
  }
  if (obj.yearEnd !== undefined) {
    if (typeof obj.yearEnd !== "number") throw new Error("yearEnd must be a number");
    meta.yearEnd = obj.yearEnd;
  }
  if (obj.publisher !== undefined) {
    if (typeof obj.publisher !== "string") throw new Error("publisher must be a string");
    meta.publisher = obj.publisher.trim();
  }
  if (obj.language !== undefined) {
    if (typeof obj.language !== "string") throw new Error("language must be a string");
    meta.language = obj.language.trim();
  }
  if (obj.status !== undefined) {
    if (!["ongoing", "completed", "hiatus"].includes(obj.status as string)) {
      throw new Error("status must be ongoing, completed, or hiatus");
    }
    meta.status = obj.status as SeriesMetadata["status"];
  }
  if (obj.genres !== undefined) {
    if (!Array.isArray(obj.genres)) throw new Error("genres must be an array");
    meta.genres = obj.genres.filter((g): g is string => typeof g === "string" && g.trim() !== "");
  }
  if (obj.tags !== undefined) {
    if (!Array.isArray(obj.tags)) throw new Error("tags must be an array");
    meta.tags = obj.tags.filter((t): t is string => typeof t === "string" && t.trim() !== "");
  }
  if (obj.altTitles !== undefined) {
    if (!Array.isArray(obj.altTitles)) throw new Error("altTitles must be an array");
    meta.altTitles = obj.altTitles.filter(
      (t): t is string => typeof t === "string" && t.trim() !== ""
    );
  }
  if (obj.chapterOverrides !== undefined) {
    if (typeof obj.chapterOverrides !== "object" || obj.chapterOverrides === null) {
      throw new Error("chapterOverrides must be an object");
    }
    meta.chapterOverrides = {};
    for (const [volKey, chapters] of Object.entries(
      obj.chapterOverrides as Record<string, unknown>
    )) {
      if (typeof chapters !== "object" || chapters === null) continue;
      meta.chapterOverrides[volKey] = {};
      for (const [chKey, override] of Object.entries(chapters as Record<string, unknown>)) {
        if (typeof override !== "object" || override === null) continue;
        const title = (override as { title?: unknown }).title;
        if (typeof title === "string" && title.trim()) {
          meta.chapterOverrides[volKey][chKey] = { title: title.trim() };
        }
      }
    }
  }

  return meta;
}

export async function writeSeriesMetadata(
  slug: string,
  metadata: SeriesMetadata
): Promise<SeriesMetadata> {
  const validated = validateSeriesMetadata(metadata);
  const dir = seriesDir(slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(metadataPath(slug), JSON.stringify(validated, null, 2));
  return validated;
}

export async function createSeriesFolder(slug: string): Promise<void> {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!safe) throw new Error("Invalid slug");
  await fs.mkdir(seriesDir(safe), { recursive: true });
}
