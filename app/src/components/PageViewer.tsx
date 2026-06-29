import { useCallback, useEffect, useState } from "react";
import type { Chapter } from "../types";
import {
  loadReaderPreferences,
  nextDoublePage,
  nextGridPage,
  prevDoublePage,
  prevGridPage,
  saveReaderPreferences,
  type FitMode,
  type ReaderPreferences,
} from "../readerPreferences";
import { DoublePageLayout } from "./reader/DoublePageLayout";
import { GridLayout } from "./reader/GridLayout";
import { ReaderToolbar } from "./reader/ReaderToolbar";
import { SinglePageLayout } from "./reader/SinglePageLayout";
import { StripLayout } from "./reader/StripLayout";

export type { FitMode };

interface PageViewerProps {
  slug: string;
  volume: number;
  currentPage: number;
  totalPages: number;
  chapters: Chapter[];
  onPageChange: (page: number) => void;
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
  onPageChange,
}: PageViewerProps) {
  const [preferences, setPreferences] = useState<ReaderPreferences>(loadReaderPreferences);
  const currentChapter = getCurrentChapter(chapters, currentPage);

  const handlePreferencesChange = useCallback((partial: Partial<ReaderPreferences>) => {
    setPreferences((prev) => saveReaderPreferences({ ...prev, ...partial }));
  }, []);

  const goPrev = useCallback(() => {
    const { layoutMode, readingDirection, gridColumns, gridRows } = preferences;
    if (currentPage <= 1) return;

    if (layoutMode === "double") {
      onPageChange(prevDoublePage(currentPage, readingDirection));
    } else if (layoutMode === "grid") {
      onPageChange(prevGridPage(currentPage, totalPages, gridColumns, gridRows));
    } else {
      onPageChange(currentPage - 1);
    }
  }, [preferences, currentPage, totalPages, onPageChange]);

  const goNext = useCallback(() => {
    const { layoutMode, readingDirection, gridColumns, gridRows } = preferences;
    if (currentPage >= totalPages) return;

    if (layoutMode === "double") {
      onPageChange(nextDoublePage(currentPage, totalPages, readingDirection));
    } else if (layoutMode === "grid") {
      onPageChange(nextGridPage(currentPage, totalPages, gridColumns, gridRows));
    } else {
      onPageChange(currentPage + 1);
    }
  }, [preferences, currentPage, totalPages, onPageChange]);

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

  const layoutProps = {
    slug,
    volume,
    currentPage,
    totalPages,
    fitMode: preferences.fitMode,
    onPageChange,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-black">
      <ReaderToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        currentChapter={currentChapter}
        chapters={chapters}
        preferences={preferences}
        onChapterJump={onPageChange}
        onPreferencesChange={handlePreferencesChange}
      />

      {preferences.layoutMode === "single" && <SinglePageLayout {...layoutProps} />}
      {preferences.layoutMode === "double" && (
        <DoublePageLayout {...layoutProps} readingDirection={preferences.readingDirection} />
      )}
      {preferences.layoutMode === "strip" && (
        <StripLayout {...layoutProps} stripZoom={preferences.stripZoom} />
      )}
      {preferences.layoutMode === "grid" && (
        <GridLayout
          {...layoutProps}
          gridColumns={preferences.gridColumns}
          gridRows={preferences.gridRows}
        />
      )}
    </div>
  );
}
