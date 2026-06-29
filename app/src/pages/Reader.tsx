import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getVolume, saveProgress } from "../api";
import type { VolumeDetail } from "../types";
import { Layout } from "../components/Layout";
import { PageViewer } from "../components/PageViewer";

function getCurrentChapter(volume: VolumeDetail, page: number) {
  return volume.chapters.find(
    (ch) => page >= ch.pageStart && page <= ch.pageEnd
  );
}

export function ReaderPage() {
  const { slug, volume: volumeParam } = useParams<{
    slug: string;
    volume: string;
  }>();
  const [searchParams] = useSearchParams();
  const [volumeData, setVolumeData] = useState<VolumeDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const volumeNum = parseInt(volumeParam ?? "1", 10);

  const refreshVolumeData = useCallback(() => {
    if (!slug) return;
    getVolume(slug, volumeNum)
      .then((data) => {
        setVolumeData(data);
        setCurrentPage((prev) => Math.min(Math.max(prev, 1), data.totalPages));
      })
      .catch((e) => setError(e.message));
  }, [slug, volumeNum]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getVolume(slug, volumeNum)
      .then((data) => {
        setVolumeData(data);
        const urlPage = parseInt(searchParams.get("page") ?? "0", 10);
        const resumePage =
          urlPage > 0 ? urlPage : data.progress?.page ?? 1;
        setCurrentPage(Math.min(Math.max(resumePage, 1), data.totalPages));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, volumeNum, searchParams]);

  const persistProgress = useCallback(
    (page: number) => {
      if (!volumeData) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const chapter = getCurrentChapter(volumeData, page)?.number;
        saveProgress(volumeData.series.id, volumeData.number, page, chapter)
          .then(() => {
            if (page >= volumeData.totalPages) {
              refreshVolumeData();
            }
          })
          .catch(console.error);
      }, 500);
    },
    [volumeData, refreshVolumeData]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      persistProgress(page);
    },
    [persistProgress]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: "Loading…" }]}>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !volumeData || !slug) {
    return (
      <Layout breadcrumbs={[{ label: "Error" }]}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error ?? "Volume not found"}
          </div>
        </div>
      </Layout>
    );
  }

  const currentChapter = getCurrentChapter(volumeData, currentPage);

  return (
    <Layout
      breadcrumbs={[
        { label: "Library", to: "/" },
        { label: volumeData.series.title, to: `/series/${slug}` },
        { label: `Vol. ${String(volumeData.number).padStart(2, "0")}` },
        ...(currentChapter ? [{ label: currentChapter.title }] : []),
      ]}
    >
      <PageViewer
        slug={slug}
        seriesId={volumeData.series.id}
        volume={volumeData.number}
        currentPage={currentPage}
        totalPages={volumeData.totalPages}
        chapters={volumeData.chapters}
        onPageChange={handlePageChange}
        onUserDataChange={refreshVolumeData}
      />
    </Layout>
  );
}
