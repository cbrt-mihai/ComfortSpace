import { useEffect, useState } from "react";
import type { FitMode } from "../../readerPreferences";
import { LoadingSpinner, NavOverlay, PageImage } from "./shared";

interface SinglePageLayoutProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  fitMode: FitMode;
  onPageChange: (page: number) => void;
}

export function SinglePageLayout({
  slug,
  volume,
  currentPage,
  totalPages,
  fitMode,
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

  return (
    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
      {loading && <LoadingSpinner />}
      <PageImage
        slug={slug}
        volume={volume}
        page={currentPage}
        fitMode={fitMode}
        eager
        onLoad={() => setLoading(false)}
        className="max-w-full max-h-full relative z-[1]"
      />
      <NavOverlay
        onPrev={goPrev}
        onNext={goNext}
        canPrev={currentPage > 1}
        canNext={currentPage < totalPages}
      />
    </div>
  );
}
