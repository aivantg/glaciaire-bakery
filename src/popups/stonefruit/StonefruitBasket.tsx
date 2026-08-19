"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useHostSession } from "@/hooks/useHostSession";

const HOST_TAPS = 5;
const TAP_RESET_MS = 2000;

type FruitSlot = {
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
  "lychees.png",
  "peaches.png",
  "plums.png",
];

const SLOTS: FruitSlot[] = [
  {
    left: "16%",
    top: "10%",
    width: "34%",
    z: 4,
    rot: "-12deg",
    delay: "0ms",
    jx: "4px",
    jy: "-5px",
    jr: "-7deg",
  },
  {
    left: "34%",
    top: "7%",
    width: "36%",
    z: 5,
    rot: "8deg",
    delay: "30ms",
    jx: "-5px",
    jy: "-3px",
    jr: "6deg",
  },
  {
    left: "22%",
    top: "16%",
    width: "38%",
    z: 6,
    rot: "4deg",
    delay: "20ms",
    jx: "-4px",
    jy: "-4px",
    jr: "-5deg",
  },
  {
    left: "48%",
    top: "12%",
    width: "30%",
    z: 7,
    rot: "14deg",
    delay: "50ms",
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

function currentRotationDeg(el: Element): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
}

function parseDeg(value: string): number {
  return Number.parseFloat(value) || 0;
}

function parsePx(value: string): number {
  return Number.parseFloat(value) || 0;
}

function Fruit({ fruit }: { fruit: BasketFruit }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fruit.src}
      alt=""
      className="sf-basket-fruit"
      data-rest-rot={fruit.rot}
      data-jx={fruit.jx}
      data-jy={fruit.jy}
      data-jr={fruit.jr}
      style={
        {
          left: fruit.left,
          top: fruit.top,
          width: fruit.width,
          zIndex: fruit.z,
          "--sf-rest-rot": fruit.rot,
        } as CSSProperties
      }
      draggable={false}
    />
  );
}

export function StonefruitBasket() {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated } = useHostSession();
  const basketRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const wiggleSign = useRef(1);
  const [fruits, setFruits] = useState(() =>
    fruitsFromFiles(DECORATOR_FILES.slice(0, SLOTS.length))
  );
  const reduced = useRef(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setFruits(pickFruits());
  }, []);

  useEffect(
    () => () => {
      clearTimeout(tapTimer.current);
    },
    []
  );

  const rustle = useCallback(() => {
    const basket = basketRef.current;
    if (!basket || reduced.current) {
      return Promise.resolve();
    }

    const from = currentRotationDeg(basket);
    basket.getAnimations().forEach((a) => a.cancel());
    // Keep the pose we were in so the next keyframe starts there.
    basket.style.transform = `rotate(${from}deg)`;

    wiggleSign.current *= -1;
    const peak = wiggleSign.current * (2.1 + Math.random() * 1.4);
    const mid = -peak * (0.55 + Math.random() * 0.25);

    const anim = basket.animate(
      [
        { transform: `rotate(${from}deg)` },
        { transform: `rotate(${peak}deg)`, offset: 0.32 },
        { transform: `rotate(${mid}deg)`, offset: 0.62 },
        { transform: "rotate(0deg)" },
      ],
      { duration: 420, easing: "ease-in-out", fill: "forwards" }
    );
    const done = anim.finished
      .then(() => {
        basket.style.transform = "";
      })
      .catch(() => {
        /* cancelled by a later tap */
      });

    fillRef.current
      ?.querySelectorAll<HTMLElement>(".sf-basket-fruit")
      .forEach((fruitEl, i) => {
        const rest = parseDeg(fruitEl.dataset.restRot ?? "0");
        const jx = parsePx(fruitEl.dataset.jx ?? "4");
        const jy = parsePx(fruitEl.dataset.jy ?? "-4");
        const jr = parseDeg(fruitEl.dataset.jr ?? "6");
        const fromRot = currentRotationDeg(fruitEl);
        fruitEl.getAnimations().forEach((a) => a.cancel());
        fruitEl.style.transform = `rotate(${fromRot}deg)`;

        const sign = wiggleSign.current * (i % 2 === 0 ? 1 : -1);
        fruitEl
          .animate(
            [
              { transform: `rotate(${fromRot}deg)` },
              {
                transform: `translate(${jx * sign}px, ${jy}px) rotate(${rest + jr * sign}deg)`,
                offset: 0.28,
              },
              {
                transform: `translate(${-jx * sign * 0.7}px, ${jy * 0.35}px) rotate(${rest - jr * sign * 0.8}deg)`,
                offset: 0.55,
              },
              { transform: `rotate(${rest}deg)` },
            ],
            {
              duration: 500,
              delay: i * 18,
              easing: "ease-in-out",
              fill: "forwards",
            }
          )
          .finished.then(() => {
            fruitEl.style.transform = "";
          })
          .catch(() => {});
      });

    return done;
  }, []);

  const handleClick = useCallback(() => {
    const shake = rustle();

    tapCount.current += 1;
    clearTimeout(tapTimer.current);

    if (tapCount.current >= HOST_TAPS) {
      tapCount.current = 0;
      const next = pathname || "/stonefruit";
      const href = authenticated
        ? "/admin"
        : `/host?next=${encodeURIComponent(next)}`;
      void shake.then(() => {
        router.push(href);
      });
      return;
    }

    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, TAP_RESET_MS);
  }, [authenticated, pathname, router, rustle]);

  return (
    <button
      ref={basketRef}
      type="button"
      className="sf-basket"
      aria-label="Picnic basket"
      onClick={handleClick}
    >
      <Image
        src="/stonefruit/basket.png"
        alt=""
        width={220}
        height={220}
        className="sf-basket-img"
        priority
        draggable={false}
      />
      <span ref={fillRef} className="sf-basket-fill" aria-hidden>
        {fruits.map((fruit) => (
          <Fruit key={fruit.src} fruit={fruit} />
        ))}
      </span>
      <span className="sf-basket-front" aria-hidden>
        <Image
          src="/stonefruit/basket.png"
          alt=""
          width={220}
          height={220}
          className="sf-basket-img"
          draggable={false}
        />
      </span>
    </button>
  );
}
