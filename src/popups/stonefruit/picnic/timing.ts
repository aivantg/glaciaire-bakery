/**
 * Central timing for the Stonefruit picnic intro.
 * Speed is adjustable via SPEED — lower is faster.
 *
 * Beat sheet:
 *  1. Sky hold → camera fall with fruit pack
 *  2. Picnic surprise as fruits land
 *  3. Two soft basket wiggles (~0.5s apart) → menu + “Glaciaire bakery” rise out of the basket
 */
export const SPEED = 1;

const s = (ms: number) => Math.round(ms * SPEED);

export const INTRO_TIMING = {
  skyHold: s(300),
  cameraFall: s(1500),
  fruitFall: s(1900),
  fruitStagger: s(34),
  fruitBounce: s(220),
  /**
   * Two gentle wiggles with a half-second rest between:
   * ~180ms wiggle + 500ms pause + ~180ms wiggle + short settle.
   */
  rustle: s(920),
  /** Menu + brand rising out of the basket mouth */
  menuRise: s(780),
  menuSettle: s(200),
} as const;

export const WORLD_VH = 238;
export const CAMERA_TRAVEL_VH = WORLD_VH - 100;

export const FRUIT_COUNT = 5;

export function estimatedIntroMs(): number {
  const t = INTRO_TIMING;
  const cameraArrival = t.skyHold + t.cameraFall;
  const lastFruitArrival =
    t.fruitFall + t.fruitStagger * (FRUIT_COUNT - 1) + t.fruitBounce;

  return (
    Math.max(cameraArrival, lastFruitArrival) +
    t.rustle +
    t.menuRise +
    t.menuSettle
  );
}

export type IntroPhase =
  | "idle"
  | "sky"
  | "falling"
  | "arriving"
  | "rustle"
  | "reveal"
  | "complete";
