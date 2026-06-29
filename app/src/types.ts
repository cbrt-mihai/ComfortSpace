export interface Chapter {
  number: number;
  title: string;
  pageStart: number;
  pageEnd: number;
  pageCount: number;
}

export interface Volume {
  number: number;
  filename: string;
  chapters: Chapter[];
  totalPages: number;
  progress?: ProgressEntry;
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
  coverPage: string;
  volumes: Volume[];
}

export interface ProgressEntry {
  page: number;
  chapter?: number;
  updatedAt: string;
}

export interface Library {
  scannedAt: string;
  series: Series[];
  progress: Record<string, ProgressEntry>;
}

export interface VolumeDetail extends Volume {
  series: { id: string; title: string; slug: string };
  progress?: ProgressEntry;
}
