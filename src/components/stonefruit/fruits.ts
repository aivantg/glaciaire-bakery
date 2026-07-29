import type { StaticImageData } from "next/image";
import peach from "@/app/stonefruit/assets/peach.png";
import apricot from "@/app/stonefruit/assets/apricot.png";
import plum from "@/app/stonefruit/assets/plum.png";
import cherries from "@/app/stonefruit/assets/cherries.png";
import pear from "@/app/stonefruit/assets/pear.png";

export type FruitId = "peach" | "apricot" | "plum" | "cherries" | "pear";

export type FruitDef = {
  id: FruitId;
  src: StaticImageData;
  /** Visual display size in CSS px at 390-wide baseline */
  size: number;
  /** Starting X as % of viewport width */
  startX: number;
  /** Starting Y within the tall world, in vh from world top */
  startY: number;
  /** Horizontal drift during fall (vw delta) — air resistance / spin bias */
  driftX: number;
  /** Landing X within basket as % of viewport */
  landX: number;
  /** Landing Y within world (vh from world top) — basket mouth */
  landY: number;
  /** Initial rotation */
  rotStart: number;
  /** Angular velocity feel — mid-fall rotation */
  rotMid: number;
  /** Settled rotation in basket */
  rotEnd: number;
  /** Scale while tumbling in sky (slightly larger / closer) */
  skyScale: number;
  /** Scale at rest in basket */
  landScale: number;
  /** Mass feel — higher = slightly longer fall delay / heftier bounce */
  mass: number;
  z: number;
};

/**
 * Sky-pack choreography: fruits begin scattered high in the world,
 * fall with gravity toward the picnic basket near WORLD_VH bottom.
 * At the 390×844 baseline, landY ~220–223 maps into the basket mouth after
 * the 138vh camera travel. The tight X spread keeps the pack inside the rim.
 */
export const FRUITS: FruitDef[] = [
  {
    id: "peach",
    src: peach,
    size: 118,
    startX: 30,
    startY: 17,
    driftX: 5,
    landX: 42,
    landY: 222,
    rotStart: -12,
    rotMid: 205,
    rotEnd: 352,
    skyScale: 1.05,
    landScale: 0.58,
    mass: 1.05,
    z: 3,
  },
  {
    id: "apricot",
    src: apricot,
    size: 104,
    startX: 64,
    startY: 9,
    driftX: -7,
    landX: 57,
    landY: 222.5,
    rotStart: 18,
    rotMid: -190,
    rotEnd: -348,
    skyScale: 0.98,
    landScale: 0.54,
    mass: 0.9,
    z: 2,
  },
  {
    id: "plum",
    src: plum,
    size: 110,
    startX: 19,
    startY: 28,
    driftX: 9,
    landX: 37,
    landY: 223,
    rotStart: -22,
    rotMid: 170,
    rotEnd: 356,
    skyScale: 1.0,
    landScale: 0.56,
    mass: 1.15,
    z: 1,
  },
  {
    id: "cherries",
    src: cherries,
    size: 122,
    startX: 79,
    startY: 15,
    driftX: -12,
    landX: 62,
    landY: 219.5,
    rotStart: 28,
    rotMid: -245,
    rotEnd: -344,
    skyScale: 1.08,
    landScale: 0.5,
    mass: 0.75,
    z: 4,
  },
  {
    id: "pear",
    src: pear,
    size: 120,
    startX: 46,
    startY: 5,
    driftX: 2,
    landX: 50,
    landY: 220,
    rotStart: 6,
    rotMid: 210,
    rotEnd: 368,
    skyScale: 1.1,
    landScale: 0.57,
    mass: 1.2,
    z: 5,
  },
];
