import type { Metadata } from "next";
import "./stonefruit.css";

// The /stonefruit route is a proof-of-concept mirror of the pop-up, sharing the
// same menu items/data but establishing its own (peach) visual identity.
// The picnic intro + scenic shell live entirely under this folder so the
// original Glaciaire site is never affected.

export const metadata: Metadata = {
  title: "Stonefruit",
  description: "Pastry + cafe pop-up — a preview of what's next.",
};

export default function StonefruitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="stonefruit">{children}</div>;
}
