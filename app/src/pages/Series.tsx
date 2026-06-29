import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSeries } from "../api";
import type { Series } from "../types";
import { Layout } from "../components/Layout";
import { VolumeCard } from "../components/VolumeCard";

export function SeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
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

  return (
    <Layout
      breadcrumbs={[
        { label: "Library", to: "/" },
        { label: series.title },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text">{series.title}</h1>
          {series.author && (
            <p className="text-text-muted mt-1">{series.author}</p>
          )}
          {series.description && (
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              {series.description}
            </p>
          )}
          <p className="text-sm text-text-muted mt-3">
            {series.volumes.length} volume{series.volumes.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {series.volumes.map((vol) => (
            <VolumeCard key={vol.number} slug={series.slug} volume={vol} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
