import { useCallback, useEffect, useRef, useState } from "react";

export function useDelayedHover(delayMs = 1500) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onMouseEnter = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setIsHovered(true), delayMs);
  }, [clearTimer, delayMs]);

  const onMouseLeave = useCallback(() => {
    clearTimer();
    setIsHovered(false);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { isHovered, handlers: { onMouseEnter, onMouseLeave } };
}
