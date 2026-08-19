import Image from "next/image";
import picnicBlanket from "./assets/picnic-blanket.png";

/** Hand-painted coral gingham picnic blanket under the basket. */
export function PicnicBlanket() {
  return (
    <Image
      src={picnicBlanket}
      alt=""
      sizes="(max-width: 420px) 92vw, 380px"
      className="absolute bottom-0 left-1/2 h-auto w-[min(92vw,380px)] -translate-x-1/2 drop-shadow-md"
      aria-hidden
      style={{ zIndex: 2 }}
      draggable={false}
    />
  );
}
