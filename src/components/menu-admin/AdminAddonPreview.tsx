import type { MenuItem } from "@/lib/store";
import { addonSublistClass, formatAddonPrice } from "@/lib/order-display";

type AdminAddonPreviewProps = {
  addons: MenuItem["addons"];
};

export function AdminAddonPreview({ addons }: AdminAddonPreviewProps) {
  if (addons.length === 0) return null;

  return (
    <ul className={`mt-2 ${addonSublistClass}`}>
      {addons.map((addon) => {
        const priceLabel = formatAddonPrice(addon.price);
        return (
          <li
            key={addon.id}
            className={addon.available ? "text-ink-600" : "text-ink-400"}
          >
            <span className="text-ink-400">+ </span>
            {addon.name}
            {priceLabel && <span className="text-ink-400"> {priceLabel}</span>}
            {!addon.available && (
              <span className="text-ink-400"> (off)</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
