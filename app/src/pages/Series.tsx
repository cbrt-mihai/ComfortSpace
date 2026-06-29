import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSeries } from "../api";
import type { Series } from "../types";
import { Layout } from "../components/Layout";
import { VolumeCard } from "../components/VolumeCard";
import { VolumeSection } from "../components/VolumeSection";
import { SeriesRatingsPanel } from "../components/RatingControl";
import { ReadToggle, formatProgressStats } from "../components/ReadToggle";
import { SeriesMetadataWizard } from "../components/SeriesMetadataWizard";

export function SeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const refresh = useCallback(() => {
    if (!slug) return;
    getSeries(slug).then(setSeries).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getSeries(slug)
      .then(setSeries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: "Loading…" }]}>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !series) {
    return (
      <Layout breadcrumbs={[{ label: "Error" }]}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error ?? "Series not found"}
          </div>
        </div>
      </Layout>
    );
  }

  const stats = series.stats;

  return (
    <Layout
      breadcrumbs={[
        { label: "Library", to: "/" },
        { label: series.title },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="px-3 py-2 text-sm rounded-lg border border-border text-text-muted hover:text-text transition-colors"
          >
            {viewMode === "grid" ? "List view" : "Grid view"}
          </button>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 text-sm rounded-lg border border-border text-text-muted hover:text-text hover:border-accent/50 transition-colors"
          >
            Edit series info
          </button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-text">{series.title}</h1>
              {series.author && (
                <p className="text-text-muted mt-1">{series.author}</p>
              )}
              {series.status && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full border border-border text-text-muted capitalize">
                  {series.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ReadToggle
                seriesId={series.id}
                readStatus={series.readStatus}
                stats={stats}
                onChange={refresh}
              />
            </div>
          </div>

          {series.description && (
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              {series.description}
            </p>
          )}

          {(series.genres?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {series.genres!.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {stats && (
            <div className="mt-4 p-4 rounded-xl border border-border bg-surface-raised space-y-4">
              <div>
                <p className="text-sm text-text">{formatProgressStats(stats, "series")}</p>
                <div className="mt-2 h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${stats.percentComplete}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">{stats.percentComplete}% complete</p>
              </div>
              <SeriesRatingsPanel
                seriesId={series.id}
                ratings={stats.ratings}
                manualRating={series.rating}
                onChange={refresh}
              />
            </div>
          )}
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {series.volumes.map((vol) => (
              <VolumeCard
                key={vol.number}
                slug={series.slug}
                seriesId={series.id}
                volume={vol}
                onUpdate={refresh}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {series.volumes.map((vol) => (
              <VolumeSection
                key={vol.number}
                slug={series.slug}
                seriesId={series.id}
                volume={vol}
                onUpdate={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {showWizard && (
        <SeriesMetadataWizard
          series={series}
          onClose={() => setShowWizard(false)}
          onSaved={(updated) => {
            setSeries(updated);
            setShowWizard(false);
          }}
        />
      )}
    </Layout>
  );
}
