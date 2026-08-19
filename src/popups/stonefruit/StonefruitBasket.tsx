"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type FruitSlot = {
  layer: "back" | "front";
  left: string;
  top: string;
  width: string;
  z: number;
  rot: string;
  delay: string;
  jx: string;
  jy: string;
  jr: string;
};

type BasketFruit = FruitSlot & { src: string };

const DECORATOR_FILES = [
  "apricots.png",
  "cherries.png",
  "coconut.png",
  "lychees.png",
  "mango-coconut.png",
  "mango.png",
  "peaches.png",
  "plums.png",
];

const SLOTS: FruitSlot[] = [
  {
    layer: "back",
    left: "22%",
    top: "24%",
    width: "46%",
    z: 1,
    rot: "-14deg",
    delay: "0ms",
    jx: "4px",
    jy: "-5px",
    jr: "-7deg",
  },
  {
    layer: "back",
    left: "6%",
    top: "28%",
    width: "48%",
    z: 2,
    rot: "-8deg",
    delay: "30ms",
    jx: "-5px",
    jy: "-3px",
    jr: "6deg",
  },
  {
    layer: "front",
    left: "34%",
    top: "18%",
    width: "50%",
    z: 4,
    rot: "10deg",
    delay: "50ms",
    jx: "5px",
    jy: "-6px",
    jr: "8deg",
  },
  {
    layer: "front",
    left: "18%",
    top: "32%",
    width: "52%",
    z: 5,
    rot: "4deg",
    delay: "20ms",
    jx: "-4px",
    jy: "-4px",
    jr: "-5deg",
  },
  {
    layer: "front",
    left: "54%",
    top: "14%",
    width: "30%",
    z: 6,
    rot: "16deg",
    delay: "70ms",
    jx: "3px",
    jy: "-7px",
    jr: "10deg",
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function fruitsFromFiles(files: string[]): BasketFruit[] {
  return SLOTS.map((slot, i) => ({
    ...slot,
    src: `/popups/stonefruit/decorators/${files[i]}`,
  }));
}

function pickFruits(): BasketFruit[] {
  return fruitsFromFiles(shuffle(DECORATOR_FILES).slice(0, SLOTS.length));
}

function Fruit({ fruit }: { fruit: BasketFruit }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fruit.src}
      alt=""
      className="sf-basket-fruit"
      style={
        {
          left: fruit.left,
          top: fruit.top,
          width: fruit.width,
          zIndex: fruit.z,
          "--sf-rest-rot": fruit.rot,
          "--sf-delay": fruit.delay,
          "--sf-jx": fruit.jx,
          "--sf-jy": fruit.jy,
          "--sf-jr": fruit.jr,
        } as CSSProperties
      }
      draggable={false}
    />
  );
}

export function StonefruitBasket() {
  const [fruits, setFruits] = useState(() =>
    fruitsFromFiles(DECORATOR_FILES.slice(0, SLOTS.length))
  );
  const [rustling, setRustling] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setFruits(pickFruits());
  }, []);

  const rustle = useCallback(() => {
    if (reduced.current) return;
    setRustling(false);
    requestAnimationFrame(() => setRustling(true));
  }, []);

  return (
    <button
      type="button"
      className={`sf-basket${rustling ? " sf-basket--rustle" : ""}`}
      aria-label="Picnic basket"
      onClick={rustle}
      onAnimationEnd={(e) => {
        if (e.animationName === "sfBasketWiggle") setRustling(false);
      }}
    >
      <span className="sf-basket-fill sf-basket-fill--back" aria-hidden>
        {fruits
          .filter((fruit) => fruit.layer === "back")
          .map((fruit) => (
            <Fruit key={fruit.src} fruit={fruit} />
          ))}
      </span>
      <Image
        src="/stonefruit/basket.png"
        alt=""
        width={220}
        height={220}
        className="sf-basket-img"
        priority
        draggable={false}
      />
      <span className="sf-basket-fill sf-basket-fill--front" aria-hidden>
        {fruits
          .filter((fruit) => fruit.layer === "front")
          .map((fruit) => (
            <Fruit key={fruit.src} fruit={fruit} />
          ))}
      </span>
    </button>
  );
}
