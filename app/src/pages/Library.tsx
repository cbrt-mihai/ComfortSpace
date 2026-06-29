import { useEffect, useState } from "react";
import { getLibrary, rescanLibrary } from "../api";
import type { Library } from "../types";
import { Layout } from "../components/Layout";
import { SeriesCard } from "../components/SeriesCard";

export function LibraryPage() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLibrary()
      .then(setLibrary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRescan = async () => {
    setScanning(true);
    try {
      const lib = await rescanLibrary();
      setLibrary(lib);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rescan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Layout
      actions={
        <button
          onClick={handleRescan}
          disabled={scanning}
          className="px-4 py-2 text-sm rounded-lg border border-border text-text-muted hover:text-text hover:border-accent/50 disabled:opacity-50 transition-colors"
        >
          {scanning ? "Scanning…" : "Rescan library"}
        </button>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text">Manga Library</h1>
          <p className="text-text-muted mt-1">
            Browse and read your local collection
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {!loading && library && library.series.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg">No manga found</p>
            <p className="mt-2 text-sm">
              Add CBZ files to <code className="text-accent">data/manga/</code> and
              rescan the library.
            </p>
          </div>
        )}

        {!loading && library && library.series.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {library.series.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
