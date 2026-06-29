import { Link } from "react-router-dom";
import type { Series } from "../types";
import { pageUrl } from "../api";
import { RatingStarsWithScore } from "./RatingControl";
import { formatProgressStats } from "./ReadToggle";
import { useDelayedHover } from "../hooks/useDelayedHover";

interface SeriesCardProps {
  series: Series;
}

function getDisplayRating(series: Series): number | undefined {
  const ratings = series.stats?.ratings;
  return (
    series.rating ??
    ratings?.manual ??
    ratings?.calculated ??
    ratings?.calculatedFromManualChildren
  );
}

function formatYearRange(series: Series): string | null {
  if (!series.yearStart) return null;
  if (series.yearEnd && series.yearEnd !== series.yearStart) {
    return `${series.yearStart}–${series.yearEnd}`;
  }
  return String(series.yearStart);
}

export function SeriesCard({ series }: SeriesCardProps) {
  const coverSrc = pageUrl(series.slug, 1, 1);
  const stats = series.stats;
  const rating = getDisplayRating(series);
  const isComplete = stats?.percentComplete === 100;
  const yearRange = formatYearRange(series);
  const { isHovered, handlers } = useDelayedHover(1000);

  return (
    <Link
      to={`/series/${series.slug}`}
      className="group block rounded-xl overflow-hidden bg-surface-raised border border-border hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300"
      {...handlers}
    >
      <div className="aspect-[2/3] overflow-hidden bg-surface relative">
        <img
          src={coverSrc}
          alt={series.title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {stats && stats.percentComplete > 0 && stats.percentComplete < 100 && !isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
        )}

        {isComplete && !isHovered && (
          <span className="absolute top-2 right-2 text-[10px] font-medium bg-accent text-white px-2 py-0.5 rounded-full shadow-sm">
            Read
          </span>
        )}

        <div
          className={`absolute inset-0 flex flex-col justify-end transition-all duration-300 ease-out ${
            isHovered
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />

          <div className="relative px-4 pb-4 pt-10 space-y-2.5">
            <div>
              <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
                {series.title}
              </h3>
              {series.author && (
                <p className="text-xs text-white/75 mt-1">{series.author}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {series.status && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 capitalize border border-white/10">
                  {series.status}
                </span>
              )}
              <span className="text-[10px] text-white/60">
                {series.volumes.length} vol{yearRange ? ` · ${yearRange}` : ""}
              </span>
            </div>

            {stats && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {formatProgressStats(stats, "series")}
                </p>
                {stats.percentComplete > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${stats.percentComplete}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/60 tabular-nums shrink-0">
                      {stats.percentComplete}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {(series.genres?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {series.genres!.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {series.description && (
              <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">
                {series.description}
              </p>
            )}

            <div className="pt-1 border-t border-white/10">
              <RatingStarsWithScore
                score={rating}
                size="md"
                variant="overlay"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2 min-w-0">
        <h2 className="font-semibold text-text group-hover:text-accent transition-colors line-clamp-2 text-sm leading-snug">
          {series.title}
        </h2>
        <RatingStarsWithScore score={rating} className="w-full" />
      </div>
    </Link>
  );
}
