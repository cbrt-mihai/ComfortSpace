import { useEffect, useState } from "react";
import {
  getGridPageRange,
  nextGridPage,
  prevGridPage,
  type FitMode,
} from "../../readerPreferences";
import { LoadingSpinner, NavOverlay, PageImage } from "./shared";

interface GridLayoutProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  fitMode: FitMode;
  gridColumns: number;
  gridRows: number;
  onPageChange: (page: number) => void;
}

export function GridLayout({
  slug,
  volume,
  currentPage,
  totalPages,
  fitMode,
  gridColumns,
  gridRows,
  onPageChange,
}: GridLayoutProps) {
  const { pages } = getGridPageRange(currentPage, totalPages, gridColumns, gridRows);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    setLoadedCount(0);
  }, [currentPage, gridColumns, gridRows]);

  const goPrev = () => onPageChange(prevGridPage(currentPage, totalPages, gridColumns, gridRows));
  const goNext = () => onPageChange(nextGridPage(currentPage, totalPages, gridColumns, gridRows));

  const { start } = getGridPageRange(currentPage, totalPages, gridColumns, gridRows);
  const loading = loadedCount < pages.length;

  return (
    <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
      {loading && <LoadingSpinner />}
      <div
        className="relative z-[1] w-full h-full grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {pages.map((page) => (
          <div
            key={page}
            className={`flex items-center justify-center overflow-hidden rounded-sm bg-black/40 ${
              page === currentPage ? "ring-2 ring-accent/70" : ""
            }`}
          >
            <PageImage
              slug={slug}
              volume={volume}
              page={page}
              fitMode={fitMode}
              eager={page === start}
              onLoad={() => setLoadedCount((n) => n + 1)}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ))}
      </div>
      <NavOverlay
        onPrev={goPrev}
        onNext={goNext}
        canPrev={start > 1}
        canNext={getGridPageRange(currentPage, totalPages, gridColumns, gridRows).end < totalPages}
        onTapNavigate={false}
      />
    </div>
  );
}
