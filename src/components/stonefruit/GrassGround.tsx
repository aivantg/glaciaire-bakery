import Image from "next/image";
import picnicGrass from "@/app/stonefruit/assets/picnic-grass.png";

/** Hand-painted grassy hillside + tufts for the picnic ground plane. */
export function GrassGround({ rustling = false }: { rustling?: boolean }) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 w-full ${rustling ? "sf-grass-rustle" : ""}`}
      aria-hidden
      style={{ height: "min(42vh, 320px)", zIndex: 1 }}
    >
      <Image
        src={picnicGrass}
        alt=""
        fill
        sizes="100vw"
        className="object-fill"
        priority
        draggable={false}
      />
    </div>
  );
}
