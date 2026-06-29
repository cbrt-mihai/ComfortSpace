import { useCallback, useEffect, useState } from "react";
import type { Chapter } from "../types";
import { pageUrl } from "../api";

export type FitMode = "width" | "height";

interface PageViewerProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  chapters: Chapter[];
  fitMode: FitMode;
  onPageChange: (page: number) => void;
  onFitModeChange: (mode: FitMode) => void;
}

function getCurrentChapter(chapters: Chapter[], page: number): Chapter | undefined {
  return chapters.find((ch) => page >= ch.pageStart && page <= ch.pageEnd);
}

export function PageViewer({
  slug,
  volume,
  currentPage,
  totalPages,
  chapters,
  fitMode,
  onPageChange,
  onFitModeChange,
}: PageViewerProps) {
  const [loading, setLoading] = useState(true);
  const currentChapter = getCurrentChapter(chapters, currentPage);
  const src = pageUrl(slug, volume, currentPage);

  const goPrev = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const goNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  useEffect(() => {
    setLoading(true);
  }, [src]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  const handleChapterJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ch = chapters.find((c) => c.number === parseInt(e.target.value, 10));
    if (ch) onPageChange(ch.pageStart);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-black">
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-surface-raised border-b border-border text-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {currentChapter && (
            <span className="text-text-muted truncate">
              {currentChapter.title}
            </span>
          )}
          <span className="text-text font-medium shrink-0">
            {currentPage} / {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currentChapter?.number ?? ""}
            onChange={handleChapterJump}
            className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent"
          >
            {chapters.map((ch) => (
              <option key={ch.number} value={ch.number}>
                {ch.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => onFitModeChange(fitMode === "width" ? "height" : "width")}
            className="px-3 py-1 rounded-lg border border-border text-text-muted hover:text-text hover:border-accent/50 transition-colors"
            title="Toggle fit mode"
          >
            {fitMode === "width" ? "Fit width" : "Fit height"}
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) goPrev();
          else goNext();
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          key={src}
          src={src}
          alt={`Page ${currentPage}`}
          onLoad={() => setLoading(false)}
          className={`max-w-full max-h-full select-none ${
            fitMode === "width" ? "w-full h-auto" : "h-full w-auto"
          } ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
          draggable={false}
        />

        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          disabled={currentPage <= 1}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          ‹
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          disabled={currentPage >= totalPages}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
