"use client";

import { useState, useEffect, useCallback } from "react";
import type { MenuItem } from "@/lib/store";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bakery-800">Manage Menu</h1>
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-bakery-500 hover:bg-bakery-600 text-white rounded-full text-sm font-semibold shadow-sm transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-6 bg-white border border-bakery-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-bakery-800 mb-4">
            {editingId ? "Edit Item" : "New Menu Item"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Croissant"
                  className="w-full border border-bakery-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bakery-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="3.50"
                  className="w-full border border-bakery-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bakery-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Short description"
                className="w-full border border-bakery-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bakery-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={form.available}
                onChange={(e) =>
                  setForm({ ...form, available: e.target.checked })
                }
                className="h-4 w-4 accent-bakery-500 rounded"
              />
              <label
                htmlFor="available"
                className="text-sm font-medium text-gray-600"
              >
                Available to order
              </label>
            </div>
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-bakery-500 hover:bg-bakery-600 disabled:opacity-50 text-white rounded-full text-sm font-semibold transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Item"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-bakery-200 text-bakery-700 hover:bg-bakery-50 rounded-full text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu item list */}
      {loading ? (
        <div className="text-center py-12 text-bakery-400">Loading menu…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-bakery-300">
          No menu items yet. Add one above!
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white border border-bakery-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-opacity ${
                item.available ? "" : "opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">
                    {item.name}
                  </span>
                  {!item.available && (
                    <span className="text-xs bg-bakery-100 text-bakery-600 px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-base font-semibold text-bakery-600 shrink-0">
                ${formatPrice(item.price)}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAvailable(item)}
                  title={item.available ? "Mark unavailable" : "Mark available"}
                  className="text-xs px-3 py-1 border border-bakery-200 text-bakery-600 hover:bg-bakery-50 rounded-full transition-colors"
                >
                  {item.available ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="text-xs px-3 py-1 border border-bakery-300 text-bakery-700 hover:bg-bakery-50 rounded-full transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="text-xs px-3 py-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
