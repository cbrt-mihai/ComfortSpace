import { useEffect, useRef, useState } from "react";
import { pageUrl } from "../../api";
import type { FitMode } from "../../readerPreferences";

interface PageImageProps {
  slug: string;
  volume: number;
  page: number;
  fitMode: FitMode;
  className?: string;
  onLoad?: () => void;
  eager?: boolean;
}

export function PageImage({
  slug,
  volume,
  page,
  fitMode,
  className = "",
  onLoad,
  eager = false,
}: PageImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const onLoadRef = useRef(onLoad);
  const src = pageUrl(slug, volume, page);

  onLoadRef.current = onLoad;

  const markLoaded = () => {
    setLoaded(true);
    onLoadRef.current?.();
  };

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      markLoaded();
    }
  }, [src]);

  const fitClass =
    fitMode === "width" ? "w-full h-auto max-w-full" : "h-full w-auto max-h-full";

  return (
    <img
      ref={imgRef}
      src={src}
      alt={`Page ${page}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onLoad={markLoaded}
      className={`select-none ${fitClass} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity ${className}`}
    />
  );
}

interface NavOverlayProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  onTapNavigate?: boolean;
}

export function NavOverlay({
  onPrev,
  onNext,
  canPrev,
  canNext,
  onTapNavigate = true,
}: NavOverlayProps) {
  return (
    <>
      {onTapNavigate && (
        <div
          className="absolute inset-0 z-0"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) onPrev();
            else onNext();
          }}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={!canPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Previous page"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={!canNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </>
  );
}

export function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
