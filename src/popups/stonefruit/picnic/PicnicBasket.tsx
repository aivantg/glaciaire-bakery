import Image from "next/image";
import picnicBasket from "./assets/picnic-basket.png";

type PicnicBasketProps = {
  rustling?: boolean;
  /** Back half lives in the scenic world (behind emerging UI). */
  layer?: "back" | "front";
};

/**
 * Hand-painted picnic basket.
 * Split into back + front so the menu can rise out from between the layers
 * and read as coming from inside the basket.
 */
export function PicnicBasket({
  rustling = false,
  layer = "back",
}: PicnicBasketProps) {
  if (layer === "front") {
    return (
      <div
        className={`sf-basket-front ${rustling ? "sf-basket-rustle" : ""}`}
        aria-hidden
      >
        <div className="sf-basket-front-clip">
          <Image
            src={picnicBasket}
            alt=""
            sizes="(max-width: 390px) 68vw, 250px"
            className="sf-basket-img"
            priority
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`sf-basket-back ${rustling ? "sf-basket-rustle" : ""}`}
      aria-hidden
    >
      <Image
        src={picnicBasket}
        alt=""
        sizes="(max-width: 390px) 68vw, 250px"
        className="sf-basket-img"
        priority
        draggable={false}
      />
      <div
        id="sf-basket-pocket"
        className="pointer-events-none absolute left-1/2 top-[31%] h-[28%] w-[72%] -translate-x-1/2"
      />
    </div>
  );
}
