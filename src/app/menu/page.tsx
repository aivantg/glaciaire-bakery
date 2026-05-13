"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/store";
import { useHostSession } from "@/hooks/useHostSession";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parsePriceToCents(value: string): number {
  return Math.round(parseFloat(value) * 100);
}

interface FormState {
  name: string;
  description: string;
  price: string;
  available: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  available: true,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to load menu");
      setItems(await res.json());
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
    });
    setFormError(null);
    setShowForm(true);
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

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parsePriceToCents(form.price),
        available: form.available,
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Delete failed");
        return;
      }
      await fetchItems();
      if (editingId === id) cancelEdit();
    } catch {
      alert("Delete failed");
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
      <h1 className="hero-stack text-[14vw] sm:text-[10rem]">admin</h1>

      <div className="mt-8 sm:mt-10 flex flex-wrap items-end justify-between gap-3">
        <p className="tagline text-sm sm:text-base">
          behind the counter — add, edit, sell out.
        </p>
        <button onClick={startAdd} className="btn-dark">
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
              className={`py-5 flex flex-wrap items-center justify-between gap-4 ${
                item.available ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-sans font-extrabold text-lg text-ink-900">
                    {item.name}
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
              </div>
              <div className="font-sans font-semibold text-ink-800 shrink-0">
                ${formatPrice(item.price)}
              </div>
              <div className="flex items-center gap-5 shrink-0">
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
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="link-mono text-bakery-500"
                >
                  delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
