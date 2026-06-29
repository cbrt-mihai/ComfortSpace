import { Link } from "react-router-dom";
import type { Volume } from "../types";
import { pageUrl } from "../api";
import { VolumeRatingsRow } from "./RatingControl";
import { ReadToggle, formatProgressStats } from "./ReadToggle";

interface VolumeCardProps {
  slug: string;
  seriesId: string;
  volume: Volume;
  onUpdate?: () => void;
}

export function VolumeCard({ slug, seriesId, volume, onUpdate }: VolumeCardProps) {
  const coverSrc = pageUrl(slug, volume.number, 1);
  const stats = volume.stats;
  const progressPercent = stats?.percentComplete ?? 0;
  const resumePage = volume.progress?.page ?? 1;

  return (
    <div className="group rounded-xl border border-border bg-surface-raised hover:border-accent/50 transition-all duration-200">
      <Link
        to={`/series/${slug}/v/${volume.number}?page=${resumePage}`}
        className="block"
      >
        <div className="aspect-[2/3] overflow-hidden bg-surface relative rounded-t-xl">
          <img
            src={coverSrc}
            alt={`Volume ${volume.number}`}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {progressPercent > 0 && progressPercent < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </Link>
      <div className="p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/series/${slug}/v/${volume.number}?page=${resumePage}`}
            className="font-medium text-text group-hover:text-accent transition-colors"
          >
            Vol. {String(volume.number).padStart(2, "0")}
          </Link>
          <ReadToggle
            seriesId={seriesId}
            volume={volume.number}
            readStatus={volume.readStatus}
            stats={stats}
            compact
            onChange={() => onUpdate?.()}
          />
        </div>
        {stats && (
          <p className="text-xs text-text-muted mt-1 whitespace-nowrap">
            {formatProgressStats(stats, "volume")}
          </p>
        )}
        <p className="text-xs text-text-muted mt-1">
          {volume.totalPages} pages
        </p>
        {volume.progress && progressPercent > 0 && progressPercent < 100 && (
          <p className="text-xs text-accent mt-1">
            Page {volume.progress.page} · {progressPercent}%
          </p>
        )}
        {progressPercent >= 100 && (
          <p className="text-xs text-accent mt-1">Completed</p>
        )}
        <div className="mt-2 min-w-0">
          <VolumeRatingsRow
            seriesId={seriesId}
            volume={volume.number}
            ratings={stats?.ratings}
            manualRating={volume.rating}
            onChange={() => onUpdate?.()}
          />
        </div>
      </div>
    </div>
  );
}
