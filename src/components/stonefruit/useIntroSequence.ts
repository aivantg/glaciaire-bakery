"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  estimatedIntroMs,
  FRUIT_COUNT,
  INTRO_TIMING,
  type IntroPhase,
} from "./timing";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Orchestrates sky → camera fall → picnic surprise → menu reveal.
 */
export function useIntroSequence() {
  const [phase, setPhase] = useState<IntroPhase>("idle");
  const timers = useRef<number[]>([]);
  const skipped = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const complete = useCallback(() => {
    clearTimers();
    setPhase("complete");
  }, [clearTimers]);

  const skip = useCallback(() => {
    skipped.current = true;
    complete();
  }, [complete]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      complete();
      return;
    }

    const t = INTRO_TIMING;
    setPhase("sky");

    schedule(() => {
      if (!skipped.current) setPhase("falling");
    }, t.skyHold);

    schedule(() => {
      if (!skipped.current) setPhase("arriving");
    }, t.skyHold + t.cameraFall * 0.78);

    const lastFruitImpact =
      t.fruitFall + t.fruitStagger * (FRUIT_COUNT - 1);
    schedule(() => {
      if (!skipped.current) setPhase("rustle");
    }, lastFruitImpact + t.fruitBounce * 0.35);

    schedule(() => {
      if (!skipped.current) setPhase("reveal");
    }, lastFruitImpact + t.fruitBounce + t.rustle);

    schedule(() => {
      if (!skipped.current) setPhase("complete");
    }, estimatedIntroMs());

    return clearTimers;
  }, [clearTimers, complete, schedule]);

  const showSkip = phase !== "complete";
  const menuRevealed = phase === "reveal" || phase === "complete";
  const basketRustling = phase === "rustle";
  const cameraFallen =
    phase === "falling" ||
    phase === "arriving" ||
    phase === "rustle" ||
    phase === "reveal" ||
    phase === "complete";
  const atPicnic =
    phase === "arriving" ||
    phase === "rustle" ||
    phase === "reveal" ||
    phase === "complete";

  return {
    phase,
    showSkip,
    menuRevealed,
    basketRustling,
    cameraFallen,
    atPicnic,
    skip,
  };
}
