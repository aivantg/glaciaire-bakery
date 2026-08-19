"use client";

import { useEffect } from "react";

/**
 * background_base.png layout (approx):
 *  0–28%  flat picnic sky
 * 28–50%  illustrated clouds
 * 50%+    hills / meadow
 */
const GROUND_ASPECT = 840 / 1164;
const FLAT_SKY_RATIO = 0.28;
const PRE_HILL_RATIO = 0.48;

type FitLock = {
  baseStageH: number;
  baseCloudUnder: number;
  totalH: number;
  maxCloudUnder: number;
};

/**
 * Sizes the picnic page so illustrated clouds sit just under the menu and the
 * meadow pins near the bottom of the viewport. Prefers a single no-scroll
 * screen when content fits; scales the ground down on very wide viewports
 * instead of forcing scroll just for the art.
 */
export function StonefruitSkyFit() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".stonefruit-root");
    const stage = root?.querySelector<HTMLElement>(".sf-stage");
    if (!root || !stage) return;

    let lock: FitLock | null = null;

    function measureCloudUnder(stageH: number, groundH: number, vh: number) {
      const flatSky = groundH * FLAT_SKY_RATIO;
      const preHill = groundH * PRE_HILL_RATIO;
      const pinMeadowToBottom = stageH + groundH - vh;
      return Math.max(0, Math.min(preHill, Math.max(flatSky, pinMeadowToBottom)));
    }

    /** Content height only — ignore flex-grown empty sky below the queue/menu. */
    function measureStageContentH() {
      if (!stage) return 0;
      const header = stage.querySelector("header");
      const main = stage.querySelector("main");
      if (header && main) {
        return (
          header.getBoundingClientRect().height +
          main.getBoundingClientRect().height +
          6
        );
      }
      return stage.getBoundingClientRect().height;
    }

    function relock() {
      if (!root || !stage) return;
      const stageH = measureStageContentH();
      const vw = root.getBoundingClientRect().width || window.innerWidth;
      const vh = window.innerHeight;
      const naturalGroundH = vw * GROUND_ASPECT;

      let groundH = naturalGroundH;
      let cloudUnder = measureCloudUnder(stageH, groundH, vh);
      let totalH = stageH - cloudUnder + groundH;

      // If the menu fits but the width-scaled picnic art overflows the
      // viewport, shrink the ground so one screen is enough.
      if (stageH < vh && totalH > vh) {
        const maxGroundToFit = (vh - stageH) / (1 - PRE_HILL_RATIO);
        groundH = Math.max(vh * 0.28, Math.min(naturalGroundH, maxGroundToFit));
        cloudUnder = measureCloudUnder(stageH, groundH, vh);
        totalH = Math.min(vh, stageH - cloudUnder + groundH);
      }

      totalH = Math.max(vh, totalH);

      lock = {
        baseStageH: stageH,
        baseCloudUnder: cloudUnder,
        totalH,
        maxCloudUnder: groundH * PRE_HILL_RATIO,
      };

      root.style.setProperty("--sf-fit-height", `${Math.ceil(totalH)}px`);
      root.style.setProperty("--sf-cloud-under", `${Math.round(cloudUnder)}px`);
      root.style.setProperty("--sf-ground-height", `${Math.round(groundH)}px`);
      root.style.setProperty(
        "--sf-ground-pane",
        `${Math.round(Math.max(0, groundH - cloudUnder))}px`
      );
    }

    function absorbStageGrowth() {
      if (!root || !stage || !lock) {
        relock();
        return;
      }

      const stageH = measureStageContentH();
      // Re-fit when content changes a lot (sold-out rows, admin edits, etc.).
      if (Math.abs(stageH - lock.baseStageH) > 24) {
        relock();
        return;
      }

      const delta = stageH - lock.baseStageH;
      const cloudUnder = Math.max(
        0,
        Math.min(lock.maxCloudUnder, lock.baseCloudUnder + delta)
      );

      root.style.setProperty("--sf-cloud-under", `${Math.round(cloudUnder)}px`);
      const groundH =
        Number.parseFloat(
          getComputedStyle(root).getPropertyValue("--sf-ground-height")
        ) || window.innerWidth * GROUND_ASPECT;
      root.style.setProperty(
        "--sf-ground-pane",
        `${Math.round(Math.max(0, groundH - cloudUnder))}px`
      );
    }

    relock();
    void document.fonts?.ready.then(() => {
      relock();
    });

    const ro = new ResizeObserver(() => absorbStageGrowth());
    ro.observe(stage);
    const main = stage.querySelector("main");
    if (main) ro.observe(main);

    const onResize = () => relock();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--sf-fit-height");
      root.style.removeProperty("--sf-cloud-under");
      root.style.removeProperty("--sf-ground-height");
      root.style.removeProperty("--sf-ground-pane");
      root.style.removeProperty("--sf-queue-pad-top");
    };
  }, []);

  return null;
}
