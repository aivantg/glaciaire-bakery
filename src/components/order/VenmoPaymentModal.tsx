"use client";

import Image from "next/image";
import venmoQr from "@/app/venmo.png";
import { formatPrice } from "@/lib/format";
import { ModalShell } from "@/components/shared/ModalShell";

type VenmoPaymentModalProps = {
  amountCents: number;
  onClose: () => void;
};

export function VenmoPaymentModal({
  amountCents,
  onClose,
}: VenmoPaymentModalProps) {
  const amountStr = formatPrice(amountCents);

  return (
    <ModalShell titleId="venmo-popup-title" onBackdropClick={onClose}>
      <p className="brand-presents text-sm sm:text-base text-center">
        order placed —
      </p>
      <h2
        id="venmo-popup-title"
        className="hero-stack text-[14vw] sm:text-6xl text-center mt-1"
      >
        scan to pay
      </h2>

      <div className="mt-5 text-center">
        <div className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
          total
        </div>
        <div className="font-sans font-black text-4xl sm:text-5xl text-ink-900 mt-1 tracking-tight">
          ${amountStr}
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="bg-white p-3 rounded-2xl border-2 border-ink-900">
          <Image
            src={venmoQr}
            alt="Venmo QR code"
            width={208}
            height={208}
            className="block"
            priority
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button type="button" onClick={onClose} className="btn-dark">
          done, view queue →
        </button>
      </div>
    </ModalShell>
  );
}
