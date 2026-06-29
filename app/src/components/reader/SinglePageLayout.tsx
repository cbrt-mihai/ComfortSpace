import { useEffect, useState } from "react";
import type { FitMode } from "../../readerPreferences";
import { LoadingSpinner, NavOverlay, PageImage } from "./shared";

interface SinglePageLayoutProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  fitMode: FitMode;
  zoom: number;
  onPageChange: (page: number) => void;
}

export function SinglePageLayout({
  slug,
  volume,
  currentPage,
  totalPages,
  fitMode,
  zoom,
  onPageChange,
}: SinglePageLayoutProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [currentPage]);

  const goPrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const goNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const zoomStyle =
    fitMode === "height" ? { height: `${zoom}%` } : { width: `${zoom}%` };

  return (
    <div
      className={`flex-1 relative flex items-center justify-center ${
        zoom > 100 ? "overflow-auto" : "overflow-hidden"
      }`}
    >
      {loading && <LoadingSpinner />}
      <div className="relative z-[1] shrink-0" style={zoomStyle}>
        <PageImage
          slug={slug}
          volume={volume}
          page={currentPage}
          fitMode={fitMode}
          eager
          onLoad={() => setLoading(false)}
          className="w-full h-full max-w-none max-h-none"
        />
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
