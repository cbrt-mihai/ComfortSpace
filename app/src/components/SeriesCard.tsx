import { Link } from "react-router-dom";
import type { Series } from "../types";
import { pageUrl } from "../api";

interface SeriesCardProps {
  series: Series;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const coverSrc = pageUrl(series.slug, 1, 1);

  return (
    <Link
      to={`/series/${series.slug}`}
      className="group block rounded-xl overflow-hidden bg-surface-raised border border-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200"
    >
      <div className="aspect-[2/3] overflow-hidden bg-surface">
        <img
          src={coverSrc}
          alt={series.title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-text group-hover:text-accent transition-colors line-clamp-2">
          {series.title}
        </h2>
        {series.author && (
          <p className="text-sm text-text-muted mt-1">{series.author}</p>
        )}
        <p className="text-sm text-text-muted mt-2">
          {series.volumes.length} volume{series.volumes.length !== 1 ? "s" : ""}
          {series.yearStart && (
            <span>
              {" "}
              · {series.yearStart}
              {series.yearEnd && series.yearEnd !== series.yearStart
                ? `–${series.yearEnd}`
                : ""}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
