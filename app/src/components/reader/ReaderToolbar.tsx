import type { Chapter } from "../../types";
import {
  LAYOUT_LABELS,
  STRIP_ZOOM_MAX,
  STRIP_ZOOM_MIN,
  STRIP_ZOOM_STEP,
  type FitMode,
  type LayoutMode,
  type ReaderPreferences,
  type ReadingDirection,
} from "../../readerPreferences";

interface ReaderToolbarProps {
  currentPage: number;
  totalPages: number;
  currentChapter?: Chapter;
  chapters: Chapter[];
  preferences: ReaderPreferences;
  onChapterJump: (page: number) => void;
  onPreferencesChange: (partial: Partial<ReaderPreferences>) => void;
}

export function ReaderToolbar({
  currentPage,
  totalPages,
  currentChapter,
  chapters,
  preferences,
  onChapterJump,
  onPreferencesChange,
}: ReaderToolbarProps) {
  const { layoutMode, fitMode, readingDirection, gridColumns, gridRows, stripZoom } = preferences;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-surface-raised border-b border-border text-sm shrink-0 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        {currentChapter && (
          <span className="text-text-muted truncate">{currentChapter.title}</span>
        )}
        <span className="text-text font-medium shrink-0">
          {currentPage} / {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <select
          value={currentChapter?.number ?? ""}
          onChange={(e) => {
            const ch = chapters.find((c) => c.number === parseInt(e.target.value, 10));
            if (ch) onChapterJump(ch.pageStart);
          }}
          className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
          aria-label="Jump to chapter"
        >
          {chapters.map((ch) => (
            <option key={ch.number} value={ch.number}>
              {ch.title}
            </option>
          ))}
        </select>

        <select
          value={layoutMode}
          onChange={(e) => onPreferencesChange({ layoutMode: e.target.value as LayoutMode })}
          className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
          aria-label="Layout mode"
        >
          {(Object.keys(LAYOUT_LABELS) as LayoutMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {LAYOUT_LABELS[mode]}
            </option>
          ))}
        </select>

        {layoutMode !== "strip" && (
          <select
            value={fitMode}
            onChange={(e) => onPreferencesChange({ fitMode: e.target.value as FitMode })}
            className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
            aria-label="Fit mode"
          >
            <option value="height">Fit height</option>
            <option value="width">Fit width</option>
          </select>
        )}

        {layoutMode === "strip" && (
          <label className="flex items-center gap-2 text-text-muted">
            <span className="shrink-0">Zoom</span>
            <button
              type="button"
              onClick={() =>
                onPreferencesChange({
                  stripZoom: Math.max(STRIP_ZOOM_MIN, stripZoom - STRIP_ZOOM_STEP),
                })
              }
              disabled={stripZoom <= STRIP_ZOOM_MIN}
              className="w-7 h-7 rounded border border-border text-text hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Zoom out"
            >
              −
            </button>
            <input
              type="range"
              min={STRIP_ZOOM_MIN}
              max={STRIP_ZOOM_MAX}
              step={STRIP_ZOOM_STEP}
              value={stripZoom}
              onChange={(e) =>
                onPreferencesChange({ stripZoom: parseInt(e.target.value, 10) })
              }
              className="w-24 accent-accent"
              aria-label="Strip zoom"
            />
            <button
              type="button"
              onClick={() =>
                onPreferencesChange({
                  stripZoom: Math.min(STRIP_ZOOM_MAX, stripZoom + STRIP_ZOOM_STEP),
                })
              }
              disabled={stripZoom >= STRIP_ZOOM_MAX}
              className="w-7 h-7 rounded border border-border text-text hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Zoom in"
            >
              +
            </button>
            <span className="text-text w-10 shrink-0 tabular-nums">{stripZoom}%</span>
          </label>
        )}

        {layoutMode === "double" && (
          <select
            value={readingDirection}
            onChange={(e) =>
              onPreferencesChange({ readingDirection: e.target.value as ReadingDirection })
            }
            className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
            aria-label="Reading direction"
          >
            <option value="rtl">Right to left</option>
            <option value="ltr">Left to right</option>
          </select>
        )}

        {layoutMode === "grid" && (
          <>
            <label className="flex items-center gap-1 text-text-muted">
              <span className="sr-only">Grid columns</span>
              <span aria-hidden>Cols</span>
              <select
                value={gridColumns}
                onChange={(e) =>
                  onPreferencesChange({ gridColumns: parseInt(e.target.value, 10) })
                }
                className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
              >
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-text-muted">
              <span className="sr-only">Grid rows</span>
              <span aria-hidden>Rows</span>
              <select
                value={gridRows}
                onChange={(e) =>
                  onPreferencesChange({ gridRows: parseInt(e.target.value, 10) })
                }
                className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
              >
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
