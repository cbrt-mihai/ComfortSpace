export type RatingDisplayMode = "stars10" | "numeric";

const STORAGE_KEY = "comfortspace-rating-display";

export function loadRatingDisplayMode(): RatingDisplayMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "numeric" || raw === "stars10") return raw;
    if (raw === "stars5") return "stars10";
  } catch {
    /* ignore */
  }
  return "stars10";
}

export function saveRatingDisplayMode(mode: RatingDisplayMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function cycleRatingDisplayMode(
  current: RatingDisplayMode
): RatingDisplayMode {
  return current === "stars10" ? "numeric" : "stars10";
}
