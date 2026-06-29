import { Link } from "react-router-dom";
import type { Volume } from "../types";
import { pageUrl } from "../api";

interface VolumeCardProps {
  slug: string;
  volume: Volume;
}

export function VolumeCard({ slug, volume }: VolumeCardProps) {
  const coverSrc = pageUrl(slug, volume.number, 1);
  const progress = volume.progress;
  const progressPercent =
    progress && volume.totalPages > 0
      ? Math.round((progress.page / volume.totalPages) * 100)
      : 0;

  const resumePage = progress?.page ?? 1;

  return (
    <Link
      to={`/series/${slug}/v/${volume.number}?page=${resumePage}`}
      className="group block rounded-xl overflow-hidden bg-surface-raised border border-border hover:border-accent/50 transition-all duration-200"
    >
      <div className="aspect-[2/3] overflow-hidden bg-surface relative">
        <img
          src={coverSrc}
          alt={`Volume ${volume.number}`}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {progress && progressPercent > 0 && progressPercent < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-text group-hover:text-accent transition-colors">
          Vol. {String(volume.number).padStart(2, "0")}
        </h3>
        <p className="text-xs text-text-muted mt-1">
          {volume.chapters.length} chapter{volume.chapters.length !== 1 ? "s" : ""}{" "}
          · {volume.totalPages} pages
        </p>
        {progress && (
          <p className="text-xs text-accent mt-1">
            {progressPercent >= 100
              ? "Completed"
              : `Page ${progress.page} · ${progressPercent}%`}
          </p>
        )}
      </div>
    </Link>
  );
}
