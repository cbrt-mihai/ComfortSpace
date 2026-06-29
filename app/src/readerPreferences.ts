export type LayoutMode = "single" | "double" | "strip" | "grid";
export type FitMode = "width" | "height";
export type ReadingDirection = "ltr" | "rtl";

export interface ReaderPreferences {
  layoutMode: LayoutMode;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  gridColumns: number;
  gridRows: number;
  stripZoom: number;
}

const STORAGE_KEY = "comfortspace-reader-prefs";

export const STRIP_ZOOM_MIN = 25;
export const STRIP_ZOOM_MAX = 200;
export const STRIP_ZOOM_STEP = 25;

const DEFAULTS: ReaderPreferences = {
  layoutMode: "single",
  fitMode: "height",
  readingDirection: "rtl",
  gridColumns: 2,
  gridRows: 3,
  stripZoom: 100,
};

export function loadReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      layoutMode: isLayoutMode(parsed.layoutMode) ? parsed.layoutMode : DEFAULTS.layoutMode,
      fitMode: parsed.fitMode === "width" || parsed.fitMode === "height" ? parsed.fitMode : DEFAULTS.fitMode,
      readingDirection:
        parsed.readingDirection === "ltr" || parsed.readingDirection === "rtl"
          ? parsed.readingDirection
          : DEFAULTS.readingDirection,
      gridColumns: clamp(parsed.gridColumns ?? DEFAULTS.gridColumns, 2, 4),
      gridRows: clamp(parsed.gridRows ?? DEFAULTS.gridRows, 2, 4),
      stripZoom: clamp(parsed.stripZoom ?? DEFAULTS.stripZoom, STRIP_ZOOM_MIN, STRIP_ZOOM_MAX),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReaderPreferences(partial: Partial<ReaderPreferences>): ReaderPreferences {
  const next = { ...loadReaderPreferences(), ...partial };
  if (partial.gridColumns !== undefined) {
    next.gridColumns = clamp(partial.gridColumns, 2, 4);
  }
  if (partial.gridRows !== undefined) {
    next.gridRows = clamp(partial.gridRows, 2, 4);
  }
  if (partial.stripZoom !== undefined) {
    next.stripZoom = clamp(partial.stripZoom, STRIP_ZOOM_MIN, STRIP_ZOOM_MAX);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function isLayoutMode(v: unknown): v is LayoutMode {
  return v === "single" || v === "double" || v === "strip" || v === "grid";
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

/** Page range for the current grid viewport. */
export function getGridPageRange(
  currentPage: number,
  totalPages: number,
  columns: number,
  rows: number
): { start: number; end: number; pages: number[] } {
  const perView = columns * rows;
  const viewIndex = Math.floor((currentPage - 1) / perView);
  const start = viewIndex * perView + 1;
  const end = Math.min(start + perView - 1, totalPages);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return { start, end, pages };
}

export function nextGridPage(
  currentPage: number,
  totalPages: number,
  columns: number,
  rows: number
): number {
  const { end } = getGridPageRange(currentPage, totalPages, columns, rows);
  return Math.min(end + 1, totalPages);
}

export function prevGridPage(
  currentPage: number,
  totalPages: number,
  columns: number,
  rows: number
): number {
  const { start } = getGridPageRange(currentPage, totalPages, columns, rows);
  if (start <= 1) return 1;
  const perView = columns * rows;
  return Math.max(1, start - perView);
}

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  single: "Single page",
  double: "Double page",
  strip: "Long strip",
  grid: "Grid",
};
