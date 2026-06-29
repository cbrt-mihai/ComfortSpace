export interface Chapter {
  number: number;
  title: string;
  pageStart: number;
  pageEnd: number;
  pageCount: number;
  stats?: ItemStats;
  readStatus?: ReadEntry;
  rating?: number;
  progress?: { page: number; updatedAt: string };
}

export interface Volume {
  number: number;
  filename: string;
  chapters: Chapter[];
  totalPages: number;
  progress?: ProgressEntry;
  stats?: ItemStats;
  readStatus?: ReadEntry;
  rating?: number;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  path: string;
  author?: string;
  description?: string;
  yearStart?: number;
  yearEnd?: number;
  genres?: string[];
  tags?: string[];
  status?: "ongoing" | "completed" | "hiatus";
  altTitles?: string[];
  publisher?: string;
  language?: string;
  coverPage: string;
  volumes: Volume[];
  stats?: ItemStats;
  readStatus?: ReadEntry;
  rating?: number;
}

export interface ProgressEntry {
  page: number;
  chapter?: number;
  updatedAt: string;
}

export interface ReadEntry {
  read: boolean;
  readAt?: string;
  updatedAt: string;
}

export interface RatingEntry {
  score: number;
  updatedAt: string;
}

export interface ItemRatings {
  manual?: number;
  calculated?: number;
  calculatedFromManualChildren?: number;
}

export interface ItemStats {
  volumesRead?: number;
  volumesTotal?: number;
  chaptersRead: number;
  chaptersTotal: number;
  pagesRead: number;
  pagesTotal: number;
  percentComplete: number;
  ratings?: ItemRatings;
}

export interface Library {
  scannedAt: string;
  series: Series[];
  progress: Record<string, ProgressEntry>;
  readStatus: Record<string, ReadEntry>;
  ratings: Record<string, RatingEntry>;
}

export interface ChapterOverride {
  title?: string;
}

export interface SeriesMetadata {
  title?: string;
  author?: string;
  description?: string;
  yearStart?: number;
  yearEnd?: number;
  genres?: string[];
  tags?: string[];
  status?: "ongoing" | "completed" | "hiatus";
  altTitles?: string[];
  publisher?: string;
  language?: string;
  chapterOverrides?: Record<string, Record<string, ChapterOverride>>;
}

export interface VolumeDetail extends Volume {
  series: { id: string; title: string; slug: string };
}

export type RatingDisplayMode = "stars10" | "numeric";
