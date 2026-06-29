import { useEffect, useState } from "react";

interface PageJumpControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function clampPage(page: number, total: number): number {
  return Math.min(Math.max(page, 1), total);
}

export function PageJumpControl({
  currentPage,
  totalPages,
  onPageChange,
}: PageJumpControlProps) {
  const [draft, setDraft] = useState(String(currentPage));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(currentPage));
  }, [currentPage, focused]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(currentPage));
      return;
    }
    onPageChange(clampPage(parsed, totalPages));
  };

  const showSelect = totalPages <= 200;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => onPageChange(clampPage(currentPage - 1, totalPages))}
        disabled={currentPage <= 1}
        className="w-7 h-7 rounded border border-border text-text hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Previous page"
      >
        ‹
      </button>

      <span className="flex items-center gap-1 text-text font-medium">
        <input
          type="text"
          inputMode="numeric"
          value={focused ? draft : String(currentPage)}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setDraft(String(currentPage));
          }}
          onBlur={() => {
            setFocused(false);
            commit(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(String(currentPage));
              e.currentTarget.blur();
            }
          }}
          className="w-12 bg-surface border border-border rounded-lg px-1.5 py-1 text-text text-sm text-right tabular-nums focus:outline-none focus:border-accent"
          aria-label="Current page"
        />
        <span className="text-text-muted">/ {totalPages}</span>
      </span>

      {showSelect && (
        <select
          value={currentPage}
          onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
          className="bg-surface border border-border rounded-lg px-2 py-1 text-text text-sm focus:outline-none focus:border-accent max-w-24"
          aria-label="Jump to page"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              Page {p}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onPageChange(clampPage(currentPage + 1, totalPages))}
        disabled={currentPage >= totalPages}
        className="w-7 h-7 rounded border border-border text-text hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}
