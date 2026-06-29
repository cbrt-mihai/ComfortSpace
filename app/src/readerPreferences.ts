export type LayoutMode = "single" | "double" | "strip";
export type FitMode = "width" | "height";
export type ReadingDirection = "ltr" | "rtl";

export interface ReaderPreferences {
  layoutMode: LayoutMode;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  zoom: number;
}

const STORAGE_KEY = "comfortspace-reader-prefs";

export const ZOOM_MIN = 25;
export const ZOOM_MAX = 200;

const DEFAULTS: ReaderPreferences = {
  layoutMode: "single",
  fitMode: "height",
  readingDirection: "rtl",
  zoom: 100,
};

export function loadReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences> & {
      stripZoom?: number;
      layoutMode?: string;
    };
    return {
      layoutMode: isLayoutMode(parsed.layoutMode) ? parsed.layoutMode : DEFAULTS.layoutMode,
      fitMode: parsed.fitMode === "width" || parsed.fitMode === "height" ? parsed.fitMode : DEFAULTS.fitMode,
      readingDirection:
        parsed.readingDirection === "ltr" || parsed.readingDirection === "rtl"
          ? parsed.readingDirection
          : DEFAULTS.readingDirection,
      zoom: clamp(parsed.zoom ?? parsed.stripZoom ?? DEFAULTS.zoom, ZOOM_MIN, ZOOM_MAX),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReaderPreferences(partial: Partial<ReaderPreferences>): ReaderPreferences {
  const next = { ...loadReaderPreferences(), ...partial };
  if (partial.zoom !== undefined) {
    next.zoom = clamp(partial.zoom, ZOOM_MIN, ZOOM_MAX);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function isLayoutMode(v: unknown): v is LayoutMode {
  return v === "single" || v === "double" || v === "strip";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Pages shown together in double-spread mode. */
export function getDoubleSpreadPages(
  currentPage: number,
  totalPages: number,
  direction: ReadingDirection
): number[] {
  if (direction === "rtl") {
    if (currentPage === 1) return [1];
    const start = currentPage % 2 === 0 ? currentPage : currentPage - 1;
    return [start, start + 1].filter((p) => p <= totalPages);
  }
  const start = currentPage % 2 === 1 ? currentPage : currentPage - 1;
  return [start, start + 1].filter((p) => p <= totalPages);
}

export function nextDoublePage(
  currentPage: number,
  totalPages: number,
  direction: ReadingDirection
): number {
  if (direction === "rtl") {
    if (currentPage === 1) return Math.min(2, totalPages);
    return Math.min(currentPage + 2, totalPages);
  }
  const start = currentPage % 2 === 1 ? currentPage : currentPage - 1;
  return Math.min(start + 2, totalPages);
}

export function prevDoublePage(currentPage: number, direction: ReadingDirection): number {
  if (direction === "rtl") {
    if (currentPage <= 2) return 1;
    return currentPage - 2;
  }
  const start = currentPage % 2 === 1 ? currentPage : currentPage - 1;
  return Math.max(1, start - 1);
}

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  single: "Single page",
  double: "Double page",
  strip: "Long strip",
};
