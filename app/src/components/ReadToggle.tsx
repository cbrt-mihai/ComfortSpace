import { useState } from "react";
import { setReadStatus } from "../api";
import type { ItemStats, ReadEntry } from "../types";

type ReadState = "unread" | "in-progress" | "read";

interface ReadToggleProps {
  seriesId: string;
  volume?: number;
  chapter?: number;
  readStatus?: ReadEntry;
  stats?: ItemStats;
  compact?: boolean;
  onChange?: (read: boolean) => void;
}

function deriveState(readStatus?: ReadEntry, stats?: ItemStats): ReadState {
  if (readStatus?.read === true) return "read";
  if (readStatus?.read === false) {
    return stats && stats.percentComplete > 0 ? "in-progress" : "unread";
  }
  if (stats?.percentComplete === 100) return "read";
  if (stats && stats.percentComplete > 0 && stats.percentComplete < 100) {
    return "in-progress";
  }
  return "unread";
}

const STATE_STYLES: Record<ReadState, { button: string }> = {
  unread: {
    button: "text-text-muted border-border hover:border-accent/50 hover:text-text",
  },
  "in-progress": {
    button: "text-yellow-400/90 border-yellow-400/40 hover:border-yellow-400/70",
  },
  read: {
    button: "text-accent border-accent/50 hover:border-accent",
  },
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8.5l3 3 7-7"
      />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M3 2.5A1.5 1.5 0 0 1 4.5 1H12a1 1 0 0 1 1 1v12a1 1 0 0 1-1.5.866L8 12.5l-3.5 2.366A1.5 1.5 0 0 1 3 13.5v-11Z"
      />
    </svg>
  );
}

export function ReadToggle({
  seriesId,
  volume,
  chapter,
  readStatus,
  stats,
  compact = false,
  onChange,
}: ReadToggleProps) {
  const [saving, setSaving] = useState(false);
  const state = deriveState(readStatus, stats);
  const isRead = state === "read";
  const { button: buttonStyle } = STATE_STYLES[state];

  const actionLabel = isRead ? "Mark unread" : "Mark read";

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      await setReadStatus(seriesId, !isRead, volume, chapter);
      onChange?.(!isRead);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      title={actionLabel}
      aria-label={actionLabel}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 transition-colors hover:bg-surface disabled:opacity-50 ${buttonStyle} ${compact ? "text-xs" : "text-sm"}`}
    >
      {isRead ? (
        <CheckIcon className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <BookIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      )}
      <span className="whitespace-nowrap">
        {compact ? (isRead ? "Unmark" : "Mark read") : actionLabel}
      </span>
    </button>
  );
}

export function formatProgressStats(stats: ItemStats, level: "series" | "volume" | "chapter"): string {
  const parts: string[] = [];
  if (level === "series" && stats.volumesTotal !== undefined) {
    parts.push(`${stats.volumesRead ?? 0}/${stats.volumesTotal} vol`);
  }
  if (level !== "chapter") {
    parts.push(`${stats.chaptersRead}/${stats.chaptersTotal} ch`);
  }
  parts.push(`${stats.pagesRead}/${stats.pagesTotal} pg`);
  return parts.join(" ");
}
