import { useEffect, useState } from "react";
import {
  getDoubleSpreadPages,
  nextDoublePage,
  prevDoublePage,
  type FitMode,
  type ReadingDirection,
} from "../../readerPreferences";
import { LoadingSpinner, NavOverlay, PageImage } from "./shared";

interface DoublePageLayoutProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  onPageChange: (page: number) => void;
}

export function DoublePageLayout({
  slug,
  volume,
  currentPage,
  totalPages,
  fitMode,
  readingDirection,
  onPageChange,
}: DoublePageLayoutProps) {
  const pages = getDoubleSpreadPages(currentPage, totalPages, readingDirection);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    setLoadedCount(0);
  }, [currentPage, readingDirection]);

  const goPrev = () => onPageChange(prevDoublePage(currentPage, readingDirection));
  const goNext = () => onPageChange(nextDoublePage(currentPage, totalPages, readingDirection));

  const displayPages =
    readingDirection === "rtl" && pages.length > 1 ? [...pages].reverse() : pages;

  const loading = loadedCount < pages.length;

  return (
    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
      {loading && <LoadingSpinner />}
      <div
        className={`relative z-[1] flex items-center justify-center gap-1 max-w-full max-h-full px-2 ${
          fitMode === "width" ? "w-full" : "h-full"
        }`}
      >
        {displayPages.map((page) => (
          <PageImage
            key={page}
            slug={slug}
            volume={volume}
            page={page}
            fitMode={fitMode}
            eager
            onLoad={() => setLoadedCount((n) => n + 1)}
            className={
              pages.length === 1
                ? "max-w-full max-h-full"
                : fitMode === "width"
                  ? "w-1/2 h-auto"
                  : "h-full w-auto max-w-[50%]"
            }
          />
        ))}
      </div>
      <NavOverlay
        onPrev={goPrev}
        onNext={goNext}
        canPrev={currentPage > 1}
        canNext={currentPage < totalPages}
      />
    </div>
  );
}
