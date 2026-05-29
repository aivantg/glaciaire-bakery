"use client";

import type { MenuCategory } from "@/lib/store";
import {
  type AddonFormRow,
  type MenuItemFormState,
  underlineInputClass,
} from "@/lib/menu-form";
import { CATEGORY_LABEL } from "@/lib/menu-labels";

type AddonFormRowsProps = {
  rows: AddonFormRow[];
  onUpdate: (index: number, patch: Partial<AddonFormRow>) => void;
  onRemove: (index: number) => void;
};

export function AddonFormRows({ rows, onUpdate, onRemove }: AddonFormRowsProps) {
  if (rows.length === 0) return null;

  return (
    <ul className="space-y-4">
      {rows.map((row, index) => (
        <li
          key={index}
          className="grid grid-cols-1 sm:grid-cols-[1fr_6rem_auto_auto] gap-3 items-end border-b border-ink-400/20 pb-4"
        >
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
              name
            </label>
            <input
              type="text"
              value={row.name}
              onChange={(e) => onUpdate(index, { name: e.target.value })}
              placeholder="e.g. oat milk"
              className={underlineInputClass}
            />
          </div>
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
              + ($){" "}
              <span className="font-medium normal-case tracking-normal text-ink-400">
                optional
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={row.price}
              onChange={(e) => onUpdate(index, { price: e.target.value })}
              placeholder="leave blank if free"
              className={underlineInputClass}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none font-sans text-xs font-semibold text-ink-600 pb-2">
            <input
              type="checkbox"
              checked={row.available}
              onChange={(e) =>
                onUpdate(index, { available: e.target.checked })
              }
              className="h-4 w-4 accent-ink-900"
            />
            available
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="link-mono text-bakery-500 pb-2"
          >
            remove
          </button>
        </li>
      ))}
    </ul>
  );
}

type MenuItemFormProps = {
  editingId: string | null;
  form: MenuItemFormState;
  formError: string | null;
  saving: boolean;
  onChange: (form: MenuItemFormState) => void;
  onAddAddonRow: () => void;
  onUpdateAddonRow: (index: number, patch: Partial<AddonFormRow>) => void;
  onRemoveAddonRow: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export function MenuItemForm({
  editingId,
  form,
  formError,
  saving,
  onChange,
  onAddAddonRow,
  onUpdateAddonRow,
  onRemoveAddonRow,
  onSubmit,
  onCancel,
}: MenuItemFormProps) {
  return (
    <div className="row-hairline py-6 my-6">
      <h2 className="font-sans font-black text-2xl text-ink-900 mb-4">
        {editingId ? "edit item" : "new item"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
              name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="e.g. croissant"
              className={underlineInputClass}
            />
          </div>
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
              price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => onChange({ ...form, price: e.target.value })}
              placeholder="3.50"
              className={underlineInputClass}
            />
          </div>
        </div>
        <div>
          <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
            description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) =>
              onChange({ ...form, description: e.target.value })
            }
            placeholder="short description"
            className={underlineInputClass}
          />
        </div>
        <div>
          <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-2">
            category
          </label>
          <div className="flex gap-2">
            {(["cafe", "pastries"] as MenuCategory[]).map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...form, category: c })}
                  className={`px-4 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-colors ${
                    active
                      ? "bg-ink-900 text-white"
                      : "border-2 border-ink-400/40 text-ink-600 hover:border-ink-900 hover:text-ink-900"
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none font-sans text-sm font-semibold text-ink-600">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) =>
              onChange({ ...form, available: e.target.checked })
            }
            className="h-4 w-4 accent-ink-900"
          />
          available to order
        </label>

        <div className="pt-2">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
              add-ons
            </span>
            <button
              type="button"
              onClick={onAddAddonRow}
              className="link-mono text-sm"
            >
              + add add-on
            </button>
          </div>
          <AddonFormRows
            rows={form.addons}
            onUpdate={onUpdateAddonRow}
            onRemove={onRemoveAddonRow}
          />
        </div>

        {formError && (
          <p className="font-sans text-red-500">{formError}</p>
        )}
        <div className="flex gap-4 items-center pt-2">
          <button type="submit" disabled={saving} className="btn-dark">
            {saving ? "saving…" : editingId ? "save" : "add"}
          </button>
          <button type="button" onClick={onCancel} className="link-mono">
            cancel
          </button>
        </div>
      </form>
    </div>
  );
}
