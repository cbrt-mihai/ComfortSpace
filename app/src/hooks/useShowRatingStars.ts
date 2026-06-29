import { useEffect, useRef, useState } from "react";

const NUMERIC_LABEL_WIDTH = 28;
const STAR_GAP = 1;
const LABEL_GAP = 4;

export function useShowRatingStars(starCount: number, starWidthPx: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [showStars, setShowStars] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const minWidth =
      starCount * starWidthPx +
      (starCount - 1) * STAR_GAP +
      NUMERIC_LABEL_WIDTH +
      LABEL_GAP;

    const update = () => {
      setShowStars(el.clientWidth >= minWidth);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [starCount, starWidthPx]);

  return { ref, showStars };
}
