"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

/**
 * True when the observed element’s width is at least `minPx`.
 * Use for toolbars: full search + text vs compact icons based on *local* space (not viewport).
 */
export function useContainerMinWidth(
  ref: RefObject<HTMLElement | null>,
  minPx: number,
): boolean {
  const [wideEnough, setWideEnough] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWideEnough(w >= minPx);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, minPx]);

  return wideEnough;
}
