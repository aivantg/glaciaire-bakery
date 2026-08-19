"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { TemplateOrderPage } from "@/popups/template/TemplateOrderPage";
import { FruitSprite } from "./FruitSprite";
import "./stonefruit.css";
import { FRUITS } from "./fruits";
import { GrassGround } from "./GrassGround";
import { PicnicBasket } from "./PicnicBasket";
import { PicnicBlanket } from "./PicnicBlanket";
import { SkyBackdrop } from "./SkyBackdrop";
import {
  CAMERA_TRAVEL_VH,
  INTRO_TIMING,
  WORLD_VH,
} from "./timing";
import { useIntroSequence } from "./useIntroSequence";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sky fall → picnic → two soft basket wiggles → menu/brand rise out of basket.
 */
export function StonefruitExperience() {
  const {
    phase,
    showSkip,
    menuRevealed,
    basketRustling,
    cameraFallen,
    skip,
  } = useIntroSequence();

  const reduced = useMemo(() => prefersReducedMotion(), []);
  const settled = reduced || phase === "complete";
  const falling =
    !reduced &&
    (phase === "sky" ||
      phase === "falling" ||
      phase === "arriving" ||
      phase === "rustle");

  const atGround = settled || phase === "reveal" || phase === "rustle";
  /** Front lip only once the camera is parked — sandwiches the emerging UI. */
  const showBasketFront = atGround;

  const cameraClass = [
    "sf-camera",
    atGround
      ? "sf-camera--at-picnic"
      : cameraFallen || phase === "arriving"
        ? "sf-camera--falling"
        : "sf-camera--sky",
  ].join(" ");

  const menuClass =
    phase === "complete"
      ? "sf-menu-panel sf-menu-panel--visible"
      : menuRevealed
        ? "sf-menu-panel sf-menu-panel--rising"
        : "sf-menu-panel sf-menu-panel--hidden";

  const brandClass = settled
    ? "sf-glaciaire sf-glaciaire--settled"
    : menuRevealed
      ? "sf-glaciaire sf-glaciaire--popping"
      : "sf-glaciaire sf-glaciaire--hidden";

  return (
    <div
      className="stonefruit-experience"
      aria-busy={phase !== "complete"}
      style={
        {
          "--sf-menu-rise": `${INTRO_TIMING.menuRise}ms`,
          "--sf-camera-fall": `${INTRO_TIMING.cameraFall}ms`,
          "--sf-rustle": `${INTRO_TIMING.rustle}ms`,
          "--sf-world-vh": `${WORLD_VH}vh`,
          "--sf-camera-travel": `${CAMERA_TRAVEL_VH}vh`,
        } as CSSProperties
      }
    >
      <div className="sf-viewport" aria-hidden>
        <div className={cameraClass}>
          <div className="sf-world" style={{ height: `${WORLD_VH}vh` }}>
            <SkyBackdrop />

            <div className="sf-picnic-zone">
              <GrassGround rustling={basketRustling} />
              <PicnicBlanket />
              <PicnicBasket rustling={basketRustling} layer="back" />
            </div>

            {FRUITS.map((fruit, index) => (
              <FruitSprite
                key={fruit.id}
                fruit={fruit}
                index={index}
                reduced={reduced}
                settled={settled}
                falling={falling}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fixed front lip — outside the viewport stacking context so the menu
          can rise between back (inside world) and this rim. */}
      {showBasketFront && (
        <PicnicBasket rustling={basketRustling} layer="front" />
      )}

      <Link href="/stonefruit" className={brandClass}>
        <span className="sf-glaciaire-name">Glaciaire</span>
        <span className="sf-glaciaire-bakery">bakery</span>
      </Link>

      <header className="sf-header">
        <span className="sf-header-spacer" aria-hidden />
        {showSkip ? (
          <button type="button" className="sf-skip" onClick={skip}>
            Skip intro
          </button>
        ) : (
          <span className="shrink-0 uppercase tracking-widest text-peach-700/70 font-bold text-xs">
            preview
          </span>
        )}
      </header>

      <div className="sf-menu-shell">
        <div
          className={menuClass}
          {...(phase !== "complete" && phase !== "reveal"
            ? { inert: true }
            : {})}
        >
          <TemplateOrderPage slug="stonefruit" ordersPath="/stonefruit/orders" />
        </div>
      </div>
    </div>
  );
}
