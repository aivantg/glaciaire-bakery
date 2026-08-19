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
 * meadow pins near the bottom of the viewport (esp. tall iPads). Page height is
 * locked on load / resize; later stage growth is absorbed into cloud underlap.
 */
export function StonefruitSkyFit() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      ".stonefruit-root:not(.stonefruit-root--ops)"
    );
    const stage = root?.querySelector<HTMLElement>(".sf-stage");
    if (!root || !stage) return;

    let lock: FitLock | null = null;

    function measureCloudUnder(stageH: number, groundH: number, vh: number) {
      const flatSky = groundH * FLAT_SKY_RATIO;
      const preHill = groundH * PRE_HILL_RATIO;
      // Pull flat upper sky under the stage so puffy clouds sit close below CTA.
      // On tall viewports, also pin the meadow toward the bottom of the screen.
      const pinMeadowToBottom = stageH + groundH - vh;
      return Math.max(0, Math.min(preHill, Math.max(flatSky, pinMeadowToBottom)));
    }

    function relock() {
      if (!root || !stage) return;
      const stageH = stage.getBoundingClientRect().height;
      const vw = root.getBoundingClientRect().width || window.innerWidth;
      const vh = window.innerHeight;
      const groundH = vw * GROUND_ASPECT;
      const cloudUnder = measureCloudUnder(stageH, groundH, vh);
      // Always fill the viewport; ground flex-grows so meadow stays pinned to the bottom.
      const totalH = Math.max(vh, stageH - cloudUnder + groundH);

      lock = {
        baseStageH: stageH,
        baseCloudUnder: cloudUnder,
        totalH,
        maxCloudUnder: groundH * PRE_HILL_RATIO,
      };

      root.style.setProperty("--sf-fit-height", `${Math.ceil(totalH)}px`);
      root.style.setProperty("--sf-cloud-under", `${Math.round(cloudUnder)}px`);
    }

    function absorbStageGrowth() {
      if (!root || !stage || !lock) {
        relock();
        return;
      }

      const stageH = stage.getBoundingClientRect().height;
      const delta = stageH - lock.baseStageH;
      const cloudUnder = Math.max(
        0,
        Math.min(lock.maxCloudUnder, lock.baseCloudUnder + delta)
      );

      root.style.setProperty("--sf-cloud-under", `${Math.round(cloudUnder)}px`);
    }

    relock();
    void document.fonts?.ready.then(() => {
      relock();
    });

    const ro = new ResizeObserver(() => absorbStageGrowth());
    ro.observe(stage);

    const onResize = () => relock();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--sf-fit-height");
      root.style.removeProperty("--sf-cloud-under");
    };
  }, []);

  return null;
}
