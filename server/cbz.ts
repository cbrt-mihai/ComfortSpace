import fs from "node:fs";
import path from "node:path";
import { LRUCache } from "lru-cache";
import yauzl from "yauzl";
import type { Entry } from "yauzl";
import { comparePageMeta, parsePageMeta } from "./pageMeta.js";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

export interface CbzPage {
  index: number;
  filename: string;
  chapter: number;
}

function openZip(cbzPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(cbzPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) reject(err ?? new Error("Failed to open CBZ"));
      else resolve(zipfile);
    });
  });
}

function readAllEntries(zipfile: yauzl.ZipFile): Promise<Entry[]> {
  return new Promise((resolve, reject) => {
    const entries: Entry[] = [];
    zipfile.on("entry", (entry) => {
      if (/\/$/.test(entry.fileName)) {
        zipfile.readEntry();
        return;
      }
      entries.push(entry);
      zipfile.readEntry();
    });
    zipfile.on("end", () => resolve(entries));
    zipfile.on("error", reject);
    zipfile.readEntry();
  });
}

function findEntry(zipfile: yauzl.ZipFile, filename: string): Promise<Entry> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      zipfile.removeListener("entry", onEntry);
      zipfile.removeListener("end", onEnd);
      zipfile.removeListener("error", onError);
    };
    const onEntry = (entry: Entry) => {
      if (entry.fileName === filename) {
        cleanup();
        resolve(entry);
        return;
      }
      zipfile.readEntry();
    };
    const onEnd = () => {
      cleanup();
      reject(new Error(`Entry not found: ${filename}`));
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    zipfile.on("entry", onEntry);
    zipfile.on("end", onEnd);
    zipfile.on("error", onError);
    zipfile.readEntry();
  });
}

function readEntryStream(
  zipfile: yauzl.ZipFile,
  entry: Entry
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (err, stream) => {
      if (err || !stream) {
        reject(err ?? new Error("Failed to read entry"));
        return;
      }
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  });
}

export async function listCbzPages(cbzPath: string): Promise<CbzPage[]> {
  const zipfile = await openZip(cbzPath);
  try {
    const entries = await readAllEntries(zipfile);
    const images = entries
      .filter((e) => IMAGE_EXT.test(e.fileName))
      .map((entry) => ({ entry, meta: parsePageMeta(entry.fileName) }));

    images.sort((a, b) =>
      comparePageMeta(a.meta, b.meta, a.entry.fileName, b.entry.fileName)
    );

    return images.map((item, i) => ({
      index: i + 1,
      filename: item.entry.fileName,
      chapter: item.meta.chapter,
    }));
  } finally {
    zipfile.close();
  }
}

const pageCache = new LRUCache<string, Buffer>({
  max: 50,
  maxSize: 100 * 1024 * 1024,
  sizeCalculation: (value) => value.length,
});

const manifestCache = new LRUCache<string, CbzPage[]>({ max: 20 });

export async function getCbzPage(
  cbzPath: string,
  pageNumber: number
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const cacheKey = `${cbzPath}:${pageNumber}`;
  const cached = pageCache.get(cacheKey);
  if (cached) {
    return {
      buffer: cached,
      contentType: contentTypeForPage(pageNumber, cbzPath),
    };
  }

  let pages = manifestCache.get(cbzPath);
  if (!pages) {
    pages = await listCbzPages(cbzPath);
    manifestCache.set(cbzPath, pages);
  }

  const page = pages.find((p) => p.index === pageNumber);
  if (!page) return null;

  const zipfile = await openZip(cbzPath);
  try {
    const entry = await findEntry(zipfile, page.filename);
    const buffer = await readEntryStream(zipfile, entry);
    pageCache.set(cacheKey, buffer);
    return { buffer, contentType: contentTypeForFilename(page.filename) };
  } finally {
    zipfile.close();
  }
}

function contentTypeForFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function contentTypeForPage(pageNumber: number, cbzPath: string): string {
  const pages = manifestCache.get(cbzPath);
  const page = pages?.find((p) => p.index === pageNumber);
  return page ? contentTypeForFilename(page.filename) : "image/jpeg";
}

export function cbzExists(cbzPath: string): boolean {
  return fs.existsSync(cbzPath);
}
