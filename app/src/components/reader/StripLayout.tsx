import { useEffect, useLayoutEffect, useRef } from "react";
import { PageImage } from "./shared";

interface StripLayoutProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
}

export function StripLayout({
  slug,
  volume,
  currentPage,
  totalPages,
  zoom,
  onPageChange,
}: StripLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());
  const scrollingToPage = useRef<number | null>(null);
  const observerEnabled = useRef(false);
  const currentPageRef = useRef(currentPage);
  const onPageChangeRef = useRef(onPageChange);
  const prevPageRef = useRef(currentPage);

  currentPageRef.current = currentPage;
  onPageChangeRef.current = onPageChange;

  useLayoutEffect(() => {
    observerEnabled.current = false;
    scrollingToPage.current = null;
    const page = currentPageRef.current;
    prevPageRef.current = page;

    const el = pageRefs.current.get(page);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }

    observerEnabled.current = true;
  }, [volume, totalPages]);

  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
    prevPageRef.current = currentPage;

    const el = pageRefs.current.get(currentPage);
    const container = containerRef.current;
    if (!el || !container) return;

    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const mostlyVisible =
      elRect.top >= containerRect.top - 40 &&
      elRect.bottom <= containerRect.bottom + 40;
    if (mostlyVisible) return;

    scrollingToPage.current = currentPage;
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    const release = () => {
      if (scrollingToPage.current === currentPage) {
        scrollingToPage.current = null;
      }
    };

    container.addEventListener("scrollend", release, { once: true });
    const timer = setTimeout(release, 2000);
    return () => {
      container.removeEventListener("scrollend", release);
      clearTimeout(timer);
    };
  }, [currentPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!observerEnabled.current || scrollingToPage.current !== null) return;

        let best: { page: number; ratio: number } | null = null;
        for (const entry of entries) {
          const page = Number((entry.target as HTMLElement).dataset.page);
          if (!page || !entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { page, ratio: entry.intersectionRatio };
          }
        }
        if (best && best.page !== currentPageRef.current) {
          onPageChangeRef.current(best.page);
        }
      },
      { root: container, threshold: [0.25, 0.5, 0.75] }
    );

    for (const el of pageRefs.current.values()) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [totalPages]);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto ${zoom > 100 ? "overflow-x-auto" : "overflow-x-hidden"}`}
    >
      <div className="flex flex-col items-center gap-0 py-2">
        {pages.map((page) => (
          <div
            key={page}
            ref={(node) => {
              if (node) pageRefs.current.set(page, node);
              else pageRefs.current.delete(page);
            }}
            data-page={page}
            className="w-full flex justify-center min-h-[20vh]"
          >
            <div className="shrink-0" style={{ width: `${zoom}%` }}>
              <PageImage
                slug={slug}
                volume={volume}
                page={page}
                fitMode="width"
                className="w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
