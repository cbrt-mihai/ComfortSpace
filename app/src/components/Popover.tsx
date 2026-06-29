import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}

export function Popover({ open, onClose, anchorRef, children, className = "" }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const popoverEl = popoverRef.current;
      const popoverHeight = popoverEl?.offsetHeight ?? 200;
      const popoverWidth = popoverEl?.offsetWidth ?? 240;
      const gap = 4;

      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < popoverHeight + gap && rect.top > popoverHeight + gap;

      let top = placeAbove ? rect.top - popoverHeight - gap : rect.bottom + gap;
      let left = rect.right - popoverWidth;

      left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - popoverHeight - 8));

      setStyle({
        position: "fixed",
        top,
        left,
        visibility: "visible",
        zIndex: 9999,
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      className={`p-3 rounded-xl border border-border bg-surface-raised shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
