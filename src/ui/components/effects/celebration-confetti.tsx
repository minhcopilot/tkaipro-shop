"use client";

import * as React from "react";

type CelebrationConfettiProps = {
  active: boolean;
  durationMs?: number;
};

export function CelebrationConfetti({ active, durationMs = 1800 }: CelebrationConfettiProps) {
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (!active || firedRef.current) return;
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return;

    firedRef.current = true;

    let rafId = 0;
    let cancelled = false;

    const run = async () => {
      const mod = await import("canvas-confetti");
      if (cancelled) return;

      const confetti = mod.default;
      const end = Date.now() + durationMs;

      const frame = () => {
        confetti({
          angle: 60,
          origin: { x: 0 },
          particleCount: 6,
          spread: 55,
          startVelocity: 50,
          ticks: 220,
        });

        confetti({
          angle: 120,
          origin: { x: 1 },
          particleCount: 6,
          spread: 55,
          startVelocity: 50,
          ticks: 220,
        });

        if (Date.now() < end) {
          rafId = window.requestAnimationFrame(frame);
        }
      };

      rafId = window.requestAnimationFrame(frame);
    };

    void run();

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [active, durationMs]);

  return null;
}

