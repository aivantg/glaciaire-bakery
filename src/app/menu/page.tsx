"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/store";
import {
  EMPTY_MENU_FORM,
  menuItemToFormState,
  parsePriceToCents,
  type MenuItemFormState,
} from "@/lib/menu-form";
import { useHostSession } from "@/hooks/useHostSession";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { MenuItemForm } from "@/components/menu-admin/MenuItemForm";
import { AdminMenuList } from "@/components/menu-admin/AdminMenuList";
import { ArchivedMenuSection } from "@/components/menu-admin/ArchivedMenuSection";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

const CONFIRM_MS = 3000;

export default function MenuPage() {
  const router = useRouter();
  const { authenticated } = useHostSession();

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
  const [form, setForm] = useState<MenuItemFormState>(EMPTY_MENU_FORM);
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
    setForm(EMPTY_MENU_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm(menuItemToFormState(item));
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
    patch: Partial<MenuItemFormState["addons"][number]>
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
    setForm(EMPTY_MENU_FORM);
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

      {showForm && (
        <MenuItemForm
          editingId={editingId}
          form={form}
          formError={formError}
          saving={saving}
          onChange={setForm}
          onAddAddonRow={addAddonRow}
          onUpdateAddonRow={updateAddonRow}
          onRemoveAddonRow={removeAddonRow}
          onSubmit={handleSave}
          onCancel={cancelEdit}
        />
      )}

      {loading ? (
        <LoadingState message="loading menu…" className="mt-10" />
      ) : error ? (
        <ErrorState message={error} className="mt-10" />
      ) : items.length === 0 ? (
        <EmptyState
          message="no menu items yet — add one above!"
          className="mt-10 py-16"
        />
      ) : (
        <AdminMenuList
          items={items}
          orderCounts={orderCounts}
          archiving={archiving}
          confirm={confirm}
          onToggleAvailable={toggleAvailable}
          onEdit={startEdit}
          onArchive={handleArchive}
        />
      )}

      {!loading && !error && (
        <ArchivedMenuSection
          items={archivedItems}
          orderCounts={orderCounts}
          unarchiving={unarchiving}
          confirm={confirm}
          onUnarchive={handleUnarchive}
        />
      )}
    </div>
  );
}
