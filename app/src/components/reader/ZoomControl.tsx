import { useEffect, useState } from "react";
import { ZOOM_MAX, ZOOM_MIN } from "../../readerPreferences";

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));
}

interface ZoomControlProps {
  zoom: number;
  onChange: (zoom: number) => void;
}

export function ZoomControl({ zoom, onChange }: ZoomControlProps) {
  const [draft, setDraft] = useState(String(zoom));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(zoom));
  }, [zoom, focused]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw.replace(/%$/, "").trim(), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(zoom));
      return;
    }
    onChange(clampZoom(parsed));
  };

  return (
    <label className="flex items-center gap-2 text-text-muted">
      <span className="shrink-0">Zoom</span>
      <button
        type="button"
        onClick={() => onChange(clampZoom(zoom - 1))}
        disabled={zoom <= ZOOM_MIN}
        className="w-7 h-7 rounded border border-border text-text hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Zoom out"
      >
        −
      </button>
      <input
        type="range"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={1}
        value={zoom}
        onChange={(e) => onChange(clampZoom(parseInt(e.target.value, 10)))}
        className="w-24 accent-accent"
        aria-label="Zoom"
      />
      <button
        type="button"
        onClick={() => onChange(clampZoom(zoom + 1))}
        disabled={zoom >= ZOOM_MAX}
        className="w-7 h-7 rounded border border-border text-text hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Zoom in"
      >
        +
      </button>
      <span className="flex items-center gap-0.5 shrink-0">
        <input
          type="text"
          inputMode="numeric"
          value={focused ? draft : String(zoom)}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setDraft(String(zoom));
          }}
          onBlur={() => {
            setFocused(false);
            commit(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(String(zoom));
              e.currentTarget.blur();
            }
          }}
          className="w-12 bg-surface border border-border rounded-lg px-1.5 py-1 text-text text-sm text-right tabular-nums focus:outline-none focus:border-accent"
          aria-label="Zoom percentage"
        />
        <span className="text-text">%</span>
      </span>
    </label>
  );
}
