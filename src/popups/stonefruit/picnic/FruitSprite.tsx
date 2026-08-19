"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import type { FruitDef } from "./fruits";
import { INTRO_TIMING } from "./timing";

type FruitSpriteProps = {
  fruit: FruitDef;
  index: number;
  reduced: boolean;
  settled: boolean;
  /** True once the plunge begins (after sky hold) */
  falling: boolean;
};

/**
 * Gravity-driven fruit fall through the tall scenic world into the basket.
 * Fall begins during the sky beat so the camera later plunges *with* them.
 */
export function FruitSprite({
  fruit,
  index,
  reduced,
  settled,
  falling,
}: FruitSpriteProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || settled) return;
    if (!falling) return;

    const el = ref.current;
    if (!el) return;

    const delay = index * INTRO_TIMING.fruitStagger;
    // Gravity is shared; mass only nudges drag (lighter fruit hangs a touch longer).
    const duration = INTRO_TIMING.fruitFall * (1.055 - fruit.mass * 0.055);

    el.style.setProperty("--sf-delay", `${delay}ms`);
    el.style.setProperty("--sf-fall", `${duration}ms`);
    el.style.setProperty("--sf-bounce", `${INTRO_TIMING.fruitBounce}ms`);
    el.style.setProperty("--sf-bounce-lift", `${2.15 - fruit.mass * 0.65}vh`);
    el.classList.add("sf-fruit--falling");

    const onEnd = (e: AnimationEvent) => {
      if (e.animationName !== "sfFruitFall") return;
      el.classList.remove("sf-fruit--falling");
      el.classList.add("sf-fruit--bouncing");
    };

    el.addEventListener("animationend", onEnd);
    return () => el.removeEventListener("animationend", onEnd);
  }, [falling, fruit.mass, index, reduced, settled]);

  // Precompute world-space waypoints (vh/vw) — avoids fragile CSS calc multiplication.
  const midX = fruit.startX + fruit.driftX * 0.35;
  const x2 =
    fruit.startX +
    fruit.driftX * 0.85 +
    (fruit.landX - fruit.startX) * 0.1;
  const x3 = x2 + (fruit.landX - x2) * 0.58;
  // Quadratic distance samples make the trajectory read as gravity.
  const y1 = fruit.startY + (fruit.landY - fruit.startY) * 0.055;
  const y2 = fruit.startY + (fruit.landY - fruit.startY) * 0.31;
  const y3 = fruit.startY + (fruit.landY - fruit.startY) * 0.69;
  const rot1 =
    fruit.rotStart + (fruit.rotMid - fruit.rotStart) * 0.42;
  const rot3 = fruit.rotMid + (fruit.rotEnd - fruit.rotMid) * 0.58;

  const midScale = (fruit.skyScale + fruit.landScale) / 2;

  const style = {
    "--sf-size": `${fruit.size}px`,
    "--sf-start-x": `${fruit.startX}vw`,
    "--sf-mid-x": `${midX}vw`,
    "--sf-x2": `${x2}vw`,
    "--sf-x3": `${x3}vw`,
    "--sf-land-x": `${fruit.landX}vw`,
    "--sf-start-y": `${fruit.startY}vh`,
    "--sf-y1": `${y1}vh`,
    "--sf-y2": `${y2}vh`,
    "--sf-y3": `${y3}vh`,
    "--sf-land-y": `${fruit.landY}vh`,
    "--sf-rot-start": `${fruit.rotStart}deg`,
    "--sf-rot-1": `${rot1}deg`,
    "--sf-rot-mid": `${fruit.rotMid}deg`,
    "--sf-rot-3": `${rot3}deg`,
    "--sf-rot-end": `${fruit.rotEnd}deg`,
    "--sf-sky-scale": fruit.skyScale,
    "--sf-mid-scale": midScale,
    "--sf-land-scale": fruit.landScale,
    // The basket's foreground (z:5) masks the lower fruit halves at landing.
    zIndex: 4,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`sf-fruit ${reduced || settled ? "sf-fruit--settled" : ""}`}
      style={style}
      aria-hidden
    >
      <Image
        src={fruit.src}
        alt=""
        width={fruit.size * 2}
        height={fruit.size * 2}
        className="h-full w-full object-contain drop-shadow-md"
        priority
        draggable={false}
      />
    </div>
  );
}
