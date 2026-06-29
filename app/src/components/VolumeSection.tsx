import { useState } from "react";
import { Link } from "react-router-dom";
import type { Volume } from "../types";
import { pageUrl } from "../api";
import { VolumeRatingsRow, RatingControl } from "./RatingControl";
import { ReadToggle, formatProgressStats } from "./ReadToggle";

interface VolumeSectionProps {
  slug: string;
  seriesId: string;
  volume: Volume;
  onUpdate?: () => void;
}

export function VolumeSection({ slug, seriesId, volume, onUpdate }: VolumeSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const coverSrc = pageUrl(slug, volume.number, 1);
  const stats = volume.stats;
  const resumePage = volume.progress?.page ?? 1;

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <Link
          to={`/series/${slug}/v/${volume.number}?page=${resumePage}`}
          className="shrink-0 w-16 aspect-[2/3] rounded-lg overflow-hidden bg-surface"
        >
          <img
            src={coverSrc}
            alt={`Volume ${volume.number}`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/series/${slug}/v/${volume.number}?page=${resumePage}`}
              className="font-medium text-text hover:text-accent transition-colors"
            >
              Vol. {String(volume.number).padStart(2, "0")}
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <ReadToggle
                seriesId={seriesId}
                volume={volume.number}
                readStatus={volume.readStatus}
                stats={stats}
                compact
                onChange={() => onUpdate?.()}
              />
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-text-muted hover:text-text text-sm px-2 py-0.5"
              >
                {expanded ? "Hide chapters" : `${volume.chapters.length} chapters`}
              </button>
            </div>
          </div>

          {stats && (
            <p className="text-xs text-text-muted mt-1">
              {formatProgressStats(stats, "volume")}
              {stats.percentComplete > 0 && (
                <span className="text-accent ml-2">{stats.percentComplete}%</span>
              )}
            </p>
          )}

          {stats && stats.percentComplete > 0 && stats.percentComplete < 100 && (
            <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${stats.percentComplete}%` }}
              />
            </div>
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

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {volume.chapters.map((ch) => (
            <div
              key={ch.number}
              className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
            >
              <Link
                to={`/series/${slug}/v/${volume.number}?page=${ch.pageStart}`}
                className="text-text hover:text-accent truncate min-w-0"
              >
                {ch.title}
                <span className="text-text-muted ml-2 text-xs">
                  pp. {ch.pageStart}–{ch.pageEnd}
                </span>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {ch.stats && ch.stats.percentComplete > 0 && ch.stats.percentComplete < 100 && (
                  <span className="text-xs text-text-muted">{ch.stats.percentComplete}%</span>
                )}
                <ReadToggle
                  seriesId={seriesId}
                  volume={volume.number}
                  chapter={ch.number}
                  readStatus={ch.readStatus}
                  stats={ch.stats}
                  compact
                  onChange={() => onUpdate?.()}
                />
                <RatingControl
                  seriesId={seriesId}
                  volume={volume.number}
                  chapter={ch.number}
                  value={ch.rating}
                  compact
                  onChange={() => onUpdate?.()}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
