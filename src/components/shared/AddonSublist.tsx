import { addonSublistClass } from "@/lib/order-display";

type AddonSublistProps = {
  addons: { id?: string; name: string }[];
  className?: string;
};

export function AddonSublist({ addons, className = "" }: AddonSublistProps) {
  if (addons.length === 0) return null;

  return (
    <ul className={`${addonSublistClass} ${className}`.trim()}>
      {addons.map((addon, i) => (
        <li key={addon.id ?? i}>
          <span className="text-ink-400">+ </span>
          {addon.name}
        </li>
      ))}
    </ul>
  );
}
