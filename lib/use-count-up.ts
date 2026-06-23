"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from 0 (or its previous value) to the target
 * using an eased rAF loop. Pure presentation — does not touch any business
 * logic or source numbers, it only animates how an already-computed number
 * is displayed.
 */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = from + (to - from) * eased;
      setValue(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
