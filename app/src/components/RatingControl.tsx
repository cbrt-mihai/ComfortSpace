import { useRef, useState } from "react";
import { setRating } from "../api";
import type { ItemRatings } from "../types";
import { useShowRatingStars } from "../hooks/useShowRatingStars";
import { Popover } from "./Popover";

const MAX_STARS = 10;

interface RatingControlProps {
  seriesId: string;
  volume?: number;
  chapter?: number;
  value?: number;
  ratings?: ItemRatings;
  compact?: boolean;
  starSize?: "sm" | "md";
  onChange?: (score: number | undefined) => void;
}

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score * 2) / 2));
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function StarIcon({
  filled,
  half,
  size = "sm",
  preview = false,
  variant = "default",
}: {
  filled: boolean;
  half?: boolean;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
  variant?: "default" | "overlay";
}) {
  const cls = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-3 h-3";
  const filledColor =
    variant === "overlay"
      ? preview
        ? "text-amber-300/80"
        : "text-amber-400"
      : preview
        ? "text-accent/70"
        : "text-accent";
  const emptyColor =
    variant === "overlay"
      ? preview
        ? "text-white/20"
        : "text-white/30"
      : preview
        ? "text-accent/25"
        : "text-border";

  if (half) {
    return (
      <span className={`relative inline-block ${cls}`}>
        <svg viewBox="0 0 20 20" className={`${cls} ${emptyColor} absolute inset-0`}>
          <path
            fill="currentColor"
            d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.5l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z"
          />
        </svg>
        <svg
          viewBox="0 0 20 20"
          className={`${cls} ${filledColor} absolute inset-0`}
          style={{ clipPath: "inset(0 50% 0 0)" }}
        >
          <path
            fill="currentColor"
            d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.5l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z"
          />
        </svg>
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      className={`${cls} ${filled ? filledColor : emptyColor}`}
    >
      <path
        fill="currentColor"
        d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.5l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z"
      />
    </svg>
  );
}

function starStateAt(score: number, starNum: number) {
  const diff = score - (starNum - 1);
  return { filled: diff >= 1, half: diff >= 0.25 && diff < 1 };
}

export function renderStars(
  score: number,
  size: "sm" | "md" | "lg" = "sm",
  preview = false
) {
  const stars = [];
  for (let i = 1; i <= MAX_STARS; i++) {
    const { filled, half } = starStateAt(score, i);
    stars.push(
      <StarIcon key={i} filled={filled} half={half} size={size} preview={preview} />
    );
  }
  return stars;
}

function scoreFromStarClick(starIndex: number, isLeftHalf: boolean): number {
  return clampScore(isLeftHalf ? starIndex - 0.5 : starIndex);
}

function scoreFromStarEvent(e: React.MouseEvent, starNum: number) {
  const star = (e.target as HTMLElement).closest("[data-star]") as HTMLElement | null;
  const rect = (star ?? e.currentTarget).getBoundingClientRect();
  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
  return scoreFromStarClick(starNum, isLeftHalf);
}

export function RatingStarsWithScore({
  score,
  hoverScore,
  size = "sm",
  preview = false,
  starSize,
  variant = "default",
  onStarMouseMove,
  className = "",
}: {
  score?: number;
  hoverScore?: number | null;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
  starSize?: "sm" | "md";
  variant?: "default" | "overlay";
  onStarMouseMove?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  className?: string;
}) {
  const activeScore = hoverScore ?? score ?? 0;
  const displayScore = hoverScore ?? score;
  const isPreviewing = hoverScore !== null || preview;
  const iconSize = starSize ?? (size === "lg" ? "md" : size === "md" ? "md" : "sm");
  const starWidthPx = iconSize === "md" ? 20 : 12;
  const { ref, showStars } = useShowRatingStars(MAX_STARS, starWidthPx);

  const scoreClass =
    variant === "overlay"
      ? displayScore !== undefined
        ? "text-amber-300"
        : "text-white/40"
      : displayScore !== undefined
        ? "text-accent"
        : "text-text-muted/50";

  const scoreSizeClass = size === "md" || size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 min-w-0 max-w-full ${className}`}
    >
      {showStars && (
        <span
          className="inline-flex gap-0.5 shrink-0"
          onMouseMove={onStarMouseMove}
        >
          {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map((starNum) => {
            const { filled, half } = starStateAt(activeScore, starNum);
            return (
              <span key={starNum} data-star={starNum}>
                <StarIcon
                  filled={filled}
                  half={half}
                  size={iconSize}
                  preview={isPreviewing}
                  variant={variant}
                />
              </span>
            );
          })}
        </span>
      )}
      <span className={`${scoreSizeClass} tabular-nums shrink-0 font-medium ${scoreClass}`}>
        {displayScore !== undefined ? formatScore(displayScore) : "—"}
      </span>
    </span>
  );
}

function StarPicker({
  value,
  disabled,
  onPick,
}: {
  value?: number;
  disabled?: boolean;
  onPick: (score: number) => void;
}) {
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  const scoreFromEvent = (e: React.MouseEvent<HTMLButtonElement>, starNum: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    return scoreFromStarClick(starNum, isLeftHalf);
  };

  const activeScore = hoverScore ?? value ?? 0;
  const isPreviewing = hoverScore !== null;
  const displayScore = hoverScore ?? value;

  return (
    <div className="inline-flex items-center gap-2 min-h-[2rem]">
      <div
        className={`inline-flex gap-0.5 rounded-lg px-1 py-0.5 ring-1 ${
          isPreviewing ? "bg-accent/10 ring-accent/30" : "ring-transparent"
        }`}
        role="group"
        aria-label="Rate 10 stars"
        onMouseLeave={() => setHoverScore(null)}
      >
        {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map((starNum) => {
          const { filled, half } = starStateAt(activeScore, starNum);
          return (
            <button
              key={starNum}
              type="button"
              disabled={disabled}
              onClick={(e) => {
                onPick(scoreFromEvent(e, starNum));
                setHoverScore(null);
              }}
              onMouseEnter={(e) => setHoverScore(scoreFromEvent(e, starNum))}
              onMouseMove={(e) => setHoverScore(scoreFromEvent(e, starNum))}
              className="relative p-0.5 disabled:opacity-50 cursor-pointer"
              aria-label={`${starNum} stars`}
            >
              <StarIcon filled={filled} half={half} size="lg" preview={isPreviewing} />
            </button>
          );
        })}
      </div>
      <span className="text-sm font-medium text-accent tabular-nums w-12 text-right shrink-0">
        {displayScore !== undefined ? `${formatScore(displayScore)}/10` : ""}
      </span>
    </div>
  );
}

function RatingEditor({
  value,
  saving,
  cascadeClear,
  canClear,
  onScoreChange,
  onClear,
}: {
  value?: number;
  saving: boolean;
  cascadeClear?: boolean;
  canClear: boolean;
  onScoreChange: (score: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3 min-w-[280px]">
      <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
        <span className="text-xs text-text-muted">Your rating</span>
        <RatingStarsWithScore score={value} size="sm" />
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1.5">Click stars (half or full)</p>
        <StarPicker value={value} disabled={saving} onPick={onScoreChange} />
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={saving || !canClear}
        className="text-xs text-text-muted hover:text-text px-2 py-1 rounded border border-border hover:border-accent/50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {cascadeClear ? "Clear all ratings" : "Clear rating"}
      </button>
    </div>
  );
}

function hasRatingsToClear(
  manualRating: number | undefined,
  ratings: ItemRatings | undefined,
  level: "series" | "volume"
): boolean {
  if (manualRating !== undefined) return true;
  if (ratings?.calculated !== undefined) return true;
  if (level === "series" && ratings?.calculatedFromManualChildren !== undefined) {
    return true;
  }
  return false;
}

function ClearRatingsButton({
  seriesId,
  volume,
  level,
  manualRating,
  ratings,
  onChange,
  compact = false,
}: {
  seriesId: string;
  volume?: number;
  level: "series" | "volume";
  manualRating?: number;
  ratings?: ItemRatings;
  onChange?: () => void;
  compact?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const canClear = hasRatingsToClear(manualRating, ratings, level);

  const handleClear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      await setRating(seriesId, null, volume, undefined, true);
      onChange?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={saving || !canClear}
      className={`text-text-muted hover:text-text rounded border border-border hover:border-accent/50 transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
      }`}
    >
      Clear all ratings
    </button>
  );
}

export function RatingDisplayRow({
  label,
  score,
}: {
  label: string;
  score?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs min-h-[1.25rem] min-w-0">
      <span className="text-text-muted shrink-0">{label}</span>
      <RatingStarsWithScore score={score} size="sm" className="justify-end" />
    </div>
  );
}

export function RatingControl({
  seriesId,
  volume,
  chapter,
  value,
  ratings,
  compact = false,
  starSize = "sm",
  onChange,
}: RatingControlProps) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const cascadeClear = chapter === undefined;
  const clearLevel = volume === undefined ? "series" : "volume";
  const canClear = cascadeClear
    ? hasRatingsToClear(value, ratings, clearLevel)
    : value !== undefined;

  const handleScoreChange = async (score: number | null) => {
    setSaving(true);
    try {
      await setRating(seriesId, score, volume, chapter, score === null && cascadeClear);
      onChange?.(score ?? undefined);
      if (score !== null) setOpen(false);
      else if (cascadeClear) setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const editor = (
    <RatingEditor
      value={value}
      saving={saving}
      cascadeClear={cascadeClear}
      canClear={canClear}
      onScoreChange={(s) => handleScoreChange(s)}
      onClear={() => handleScoreChange(null)}
    />
  );

  if (compact) {
    return (
      <>
        <button
          ref={anchorRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }}
          onMouseLeave={() => setHoverScore(null)}
          className={`transition-colors text-xs inline-flex items-center rounded-md px-1 py-0.5 min-w-0 max-w-full h-5 ${
            open ? "text-accent bg-accent/10 ring-1 ring-accent/30" : "hover:bg-accent/5"
          }`}
          title={value !== undefined ? "Edit your rating" : "Rate"}
        >
          <RatingStarsWithScore
            score={value}
            hoverScore={open ? null : hoverScore}
            starSize={starSize}
            className="w-full"
            onStarMouseMove={(e) => {
              if (open) return;
              const target = (e.target as HTMLElement).closest("[data-star]");
              if (!target) return;
              const starNum = parseInt(target.getAttribute("data-star") ?? "0", 10);
              if (starNum > 0) {
                setHoverScore(scoreFromStarEvent(e, starNum));
              }
            }}
          />
        </button>
        <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
          {editor}
        </Popover>
      </>
    );
  }

  return <div className={`${saving ? "opacity-70" : ""} text-sm`}>{editor}</div>;
}

interface SeriesRatingsPanelProps {
  seriesId: string;
  ratings?: ItemRatings;
  manualRating?: number;
  onChange?: () => void;
}

export function SeriesRatingsPanel({
  seriesId,
  ratings,
  manualRating,
  onChange,
}: SeriesRatingsPanelProps) {
  return (
    <div className="space-y-2 min-w-[240px]">
      <RatingDisplayRow label="From chapters" score={ratings?.calculated} />
      <RatingDisplayRow label="From volume ratings" score={ratings?.calculatedFromManualChildren} />
      <div className="flex items-center justify-between gap-3 min-h-[1.25rem]">
        <span className="text-xs text-text-muted shrink-0">Your rating</span>
        <RatingControl seriesId={seriesId} value={manualRating} ratings={ratings} onChange={onChange} compact />
      </div>
      <ClearRatingsButton
        seriesId={seriesId}
        level="series"
        manualRating={manualRating}
        ratings={ratings}
        onChange={onChange}
      />
    </div>
  );
}

interface VolumeRatingsRowProps {
  seriesId: string;
  volume: number;
  ratings?: ItemRatings;
  manualRating?: number;
  onChange?: () => void;
}

export function VolumeRatingsRow({
  seriesId,
  volume,
  ratings,
  manualRating,
  onChange,
}: VolumeRatingsRowProps) {
  return (
    <div className="space-y-1 min-w-0">
      <RatingDisplayRow label="From chapters" score={ratings?.calculated} />
      <div className="flex items-center justify-between gap-2 min-w-0 min-h-[1.25rem]">
        <span className="text-[10px] text-text-muted shrink-0">Your rating</span>
        <div className="min-w-0 flex-1 flex justify-end">
        <RatingControl
          seriesId={seriesId}
          volume={volume}
          value={manualRating}
          ratings={ratings}
          compact
          starSize="sm"
          onChange={onChange}
        />
        </div>
      </div>
      <ClearRatingsButton
        seriesId={seriesId}
        volume={volume}
        level="volume"
        manualRating={manualRating}
        ratings={ratings}
        onChange={onChange}
        compact
      />
    </div>
  );
}
