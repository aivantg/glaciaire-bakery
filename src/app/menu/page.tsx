"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem, MenuCategory } from "@/lib/store";
import { addonSublistClass, formatAddonPrice } from "@/lib/order-display";
import { useHostSession } from "@/hooks/useHostSession";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";

const CONFIRM_MS = 3000;

const CATEGORY_LABEL: Record<MenuCategory, string> = {
  cafe: "cafe",
  pastries: "pastries",
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatUnitsOrdered(count: number): string {
  if (count === 0) return "never ordered";
  if (count === 1) return "1 ordered";
  return `${count} ordered`;
}

function AdminAddonPreview({ addons }: { addons: MenuItem["addons"] }) {
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

function parsePriceToCents(value: string): number {
  return Math.round(parseFloat(value) * 100);
}

interface AddonFormRow {
  name: string;
  price: string;
  available: boolean;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  available: boolean;
  category: MenuCategory;
  addons: AddonFormRow[];
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  available: true,
  category: "pastries",
  addons: [],
};

export default function MenuPage() {
  const router = useRouter();
  const { authenticated } = useHostSession();

  // Gate the admin page client-side. The API still enforces auth server-side.
  useEffect(() => {
    if (authenticated === false) {
      router.replace("/host?next=/menu");
    }
  }, [authenticated, router]);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<MenuItem[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);
  const confirm = useConfirmAction(CONFIRM_MS);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeRes, archivedRes, statsRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/menu/archived"),
        fetch("/api/menu/stats"),
      ]);
      if (!activeRes.ok) throw new Error("Failed to load menu");
      setItems(await activeRes.json());
      if (archivedRes.ok) {
        setArchivedItems(await archivedRes.json());
      } else {
        setArchivedItems([]);
      }
      if (statsRes.ok) {
        setOrderCounts(await statsRes.json());
      } else {
        setOrderCounts({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: formatPrice(item.price),
      available: item.available,
      category: item.category,
      addons: item.addons.map((a) => ({
        name: a.name,
        price:
          a.price != null && a.price > 0 ? formatPrice(a.price) : "",
        available: a.available,
      })),
    });
    setFormError(null);
    setShowForm(true);
  }

  function addAddonRow() {
    setForm((f) => ({
      ...f,
      addons: [...f.addons, { name: "", price: "", available: true }],
    }));
  }

  function updateAddonRow(
    index: number,
    patch: Partial<AddonFormRow>
  ) {
    setForm((f) => ({
      ...f,
      addons: f.addons.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function removeAddonRow(index: number) {
    setForm((f) => ({
      ...f,
      addons: f.addons.filter((_, i) => i !== index),
    }));
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(form.price);
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Enter a valid price (e.g. 3.50)");
      return;
    }

    const addonsPayload: {
      name: string;
      price: number | null;
      available: boolean;
    }[] = [];
    for (const row of form.addons) {
      const trimmed = row.name.trim();
      if (!trimmed) continue;
      const priceStr = row.price.trim();
      let price: number | null = null;
      if (priceStr !== "") {
        const addonPrice = parseFloat(priceStr);
        if (isNaN(addonPrice) || addonPrice < 0) {
          setFormError(`Enter a valid price for add-on "${trimmed}"`);
          return;
        }
        price = parsePriceToCents(row.price);
      }
      addonsPayload.push({
        name: trimmed,
        price,
        available: row.available,
      });
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parsePriceToCents(form.price),
        available: form.available,
        category: form.category,
        addons: addonsPayload,
      };

      const url = editingId ? `/api/menu/${editingId}` : "/api/menu";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      await fetchItems();
      cancelEdit();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string) {
    setArchiving(id);
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Archive failed");
      }
      await fetchItems();
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive failed");
    } finally {
      setArchiving(null);
    }
  }

  async function handleUnarchive(id: string) {
    setUnarchiving(id);
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unarchive failed");
      }
      await fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unarchive failed");
    } finally {
      setUnarchiving(null);
    }
  }

  async function toggleAvailable(item: MenuItem) {
    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });
      if (!res.ok) return;
      await fetchItems();
    } catch {
      // ignore
    }
  }

  const inputClass =
    "w-full bg-transparent border-0 border-b border-ink-400/40 focus:border-ink-900 focus:outline-none font-sans text-ink-900 placeholder-ink-300 py-2";

  // While we don't yet know auth state — and especially while bouncing to /host
  // — don't flash the admin UI to a logged-out viewer.
  if (authenticated !== true) {
    return (
      <div className="pt-6">
        <p className="font-sans text-ink-400">checking access…</p>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-6xl sm:text-8xl md:text-[10rem]">admin</h1>

      <div className="mt-8 sm:mt-10 flex flex-wrap items-center sm:items-end justify-between gap-4">
        <p className="tagline text-sm sm:text-base">
          behind the counter — add, edit, sell out.
        </p>
        <button onClick={startAdd} className="btn-dark shrink-0">
          + add item
        </button>
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div className="row-hairline py-6 my-6">
          <h2 className="font-sans font-black text-2xl text-ink-900 mb-4">
            {editingId ? "edit item" : "new item"}
          </h2>
          <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
                  name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. croissant"
                  className={inputClass}
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
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="3.50"
                  className={inputClass}
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
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="short description"
                className={inputClass}
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
                      onClick={() => setForm({ ...form, category: c })}
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
                  setForm({ ...form, available: e.target.checked })
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
                  onClick={addAddonRow}
                  className="link-mono text-sm"
                >
                  + add add-on
                </button>
              </div>
              {form.addons.length > 0 && (
                <ul className="space-y-4">
                  {form.addons.map((row, index) => (
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
                          onChange={(e) =>
                            updateAddonRow(index, { name: e.target.value })
                          }
                          placeholder="e.g. oat milk"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-1">
                          + ($) <span className="font-medium normal-case tracking-normal text-ink-400">optional</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.price}
                          onChange={(e) =>
                            updateAddonRow(index, { price: e.target.value })
                          }
                          placeholder="leave blank if free"
                          className={inputClass}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none font-sans text-xs font-semibold text-ink-600 pb-2">
                        <input
                          type="checkbox"
                          checked={row.available}
                          onChange={(e) =>
                            updateAddonRow(index, {
                              available: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-ink-900"
                        />
                        available
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAddonRow(index)}
                        className="link-mono text-bakery-500 pb-2"
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {formError && (
              <p className="font-sans text-red-500">{formError}</p>
            )}
            <div className="flex gap-4 items-center pt-2">
              <button type="submit" disabled={saving} className="btn-dark">
                {saving ? "saving…" : editingId ? "save" : "add"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="link-mono"
              >
                cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <div className="text-center py-12 font-sans text-ink-400 mt-10">
          loading menu…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 mt-10">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 font-sans text-ink-400 mt-10">
          no menu items yet — add one above!
        </div>
      ) : (
        <ul className="list-hairline mt-10">
          {items.map((item) => (
            <li
              key={item.id}
              className={`py-5 flex flex-wrap items-start sm:items-center justify-between gap-x-4 gap-y-3 ${
                item.available ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-sans font-extrabold text-lg text-ink-900 break-words">
                    {item.name}
                  </span>
                  <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-400">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                  {!item.available && (
                    <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-400">
                      sold out
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="font-sans text-sm text-ink-400 mt-1">
                    {item.description}
                  </p>
                )}
                <AdminAddonPreview addons={item.addons} />
                <p className="font-mono text-xs text-ink-400 mt-1">
                  {formatUnitsOrdered(orderCounts[item.id] ?? 0)}
                </p>
              </div>
              <div className="font-sans font-semibold text-ink-800 shrink-0">
                ${formatPrice(item.price)}
              </div>
              <div className="flex items-center gap-4 sm:gap-5 shrink-0 ml-auto">
                <button
                  onClick={() => toggleAvailable(item)}
                  className="link-mono text-leaf-700"
                >
                  {item.available ? "disable" : "enable"}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="link-mono text-sky-500"
                >
                  edit
                </button>
                <ConfirmActionButton
                  actionKey={`${item.id}:archive`}
                  label="archive"
                  onConfirm={() => handleArchive(item.id)}
                  disabled={archiving === item.id}
                  confirm={confirm}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && archivedItems.length > 0 && (
        <section className="mt-14 sm:mt-16">
          <h2 className="font-sans font-black text-2xl text-ink-900">
            archived items
          </h2>
          <p className="mt-2 font-sans text-sm text-ink-500">
            hidden from the menu — unarchive to bring back.
          </p>
          <ul className="list-hairline mt-6">
            {archivedItems.map((item) => (
              <li
                key={item.id}
                className="py-5 flex flex-wrap items-start sm:items-center justify-between gap-x-4 gap-y-3 opacity-50"
              >
                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-sans font-extrabold text-lg text-ink-900 break-words">
                      {item.name}
                    </span>
                    <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-400">
                      {CATEGORY_LABEL[item.category]}
                    </span>
                  </div>
                  {item.description && (
                    <p className="font-sans text-sm text-ink-400 mt-1">
                      {item.description}
                    </p>
                  )}
                  <AdminAddonPreview addons={item.addons} />
                  <p className="font-mono text-xs text-ink-400 mt-1">
                    {formatUnitsOrdered(orderCounts[item.id] ?? 0)}
                  </p>
                </div>
                <div className="font-sans font-semibold text-ink-800 shrink-0">
                  ${formatPrice(item.price)}
                </div>
                <div className="shrink-0 ml-auto">
                  <ConfirmActionButton
                    actionKey={`${item.id}:unarchive`}
                    label="unarchive"
                    onConfirm={() => handleUnarchive(item.id)}
                    disabled={unarchiving === item.id}
                    confirm={confirm}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
