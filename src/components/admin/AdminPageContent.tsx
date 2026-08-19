"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem, Popup } from "@/lib/store";
import {
  EMPTY_MENU_FORM,
  menuItemToFormState,
  parsePriceToCents,
  type MenuItemFormState,
} from "@/lib/menu-form";
import { useHostSession } from "@/hooks/useHostSession";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { popupApiBase } from "@/lib/popups";
import type { PopupDecorator } from "@/lib/decorator-src";
import { MenuItemForm } from "@/components/menu-admin/MenuItemForm";
import { AdminMenuList } from "@/components/menu-admin/AdminMenuList";
import { ArchivedMenuSection } from "@/components/menu-admin/ArchivedMenuSection";
import { HostShell } from "@/components/host/HostShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { petitCochon } from "@/popups/stonefruit/load-fonts";
import "@/popups/passion/passion.css";

const CONFIRM_MS = 3000;

export function AdminPageContent({ initialSlug }: { initialSlug?: string }) {
  const router = useRouter();
  const { authenticated, logout } = useHostSession();

  const [popups, setPopups] = useState<Popup[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug ?? "");
  const [settingActive, setSettingActive] = useState(false);
  const [loveItemsDraft, setLoveItemsDraft] = useState("");
  const [savingLoveItems, setSavingLoveItems] = useState(false);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<MenuItem[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [decorators, setDecorators] = useState<PopupDecorator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemFormState>(EMPTY_MENU_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const confirm = useConfirmAction(CONFIRM_MS);

  useEffect(() => {
    if (authenticated === false) {
      const next = initialSlug
        ? `/admin?popup=${encodeURIComponent(initialSlug)}`
        : "/admin";
      router.replace(`/host?next=${encodeURIComponent(next)}`);
    }
  }, [authenticated, router, initialSlug]);

  const loadPopups = useCallback(async () => {
    const res = await fetch("/api/popups");
    if (!res.ok) throw new Error("Failed to load popups");
    const data: Popup[] = await res.json();
    setPopups(data);
    setSelectedSlug((current) => {
      if (current && data.some((p) => p.slug === current)) return current;
      if (initialSlug && data.some((p) => p.slug === initialSlug)) {
        return initialSlug;
      }
      const active = data.find((p) => p.isActive);
      return active?.slug ?? data[0]?.slug ?? "";
    });
  }, [initialSlug]);

  const fetchItems = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const api = popupApiBase(slug);
      const [activeRes, archivedRes, statsRes, decoRes] = await Promise.all([
        fetch(`${api}/menu`, { cache: "no-store" }),
        fetch(`${api}/menu/archived`, { cache: "no-store" }),
        fetch(`${api}/menu/stats`, { cache: "no-store" }),
        fetch(`${api}/decorators`, { cache: "no-store" }),
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
      if (decoRes.ok) {
        setDecorators(await decoRes.json());
      } else {
        setDecorators([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated !== true) return;
    loadPopups().catch((e) => {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    });
  }, [authenticated, loadPopups]);

  useEffect(() => {
    if (authenticated !== true || !selectedSlug) return;
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_MENU_FORM);
    setFormError(null);
    fetchItems(selectedSlug);
  }, [authenticated, selectedSlug, fetchItems]);

  useEffect(() => {
    const selected = popups.find((p) => p.slug === selectedSlug);
    setLoveItemsDraft(selected?.loveItems ?? "");
  }, [popups, selectedSlug]);

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
        decorator: form.decorator || null,
        addons: addonsPayload,
      };

      const api = popupApiBase(selectedSlug);
      const url = editingId ? `${api}/menu/${editingId}` : `${api}/menu`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");
      if (!data) throw new Error("Save failed");

      await fetchItems(selectedSlug);
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
      const res = await fetch(`${popupApiBase(selectedSlug)}/menu/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Archive failed");
      }
      await fetchItems(selectedSlug);
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
      const res = await fetch(`${popupApiBase(selectedSlug)}/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unarchive failed");
      }
      await fetchItems(selectedSlug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unarchive failed");
    } finally {
      setUnarchiving(null);
    }
  }

  async function toggleAvailable(item: MenuItem) {
    try {
      const res = await fetch(`${popupApiBase(selectedSlug)}/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });
      if (!res.ok) return;
      await fetchItems(selectedSlug);
    } catch {
      // ignore
    }
  }

  async function moveItem(item: MenuItem, direction: "up" | "down") {
    setMovingId(item.id);
    try {
      const res = await fetch(`${popupApiBase(selectedSlug)}/menu/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, direction }),
      });
      if (!res.ok) return;
      setItems(await res.json());
    } catch {
      // ignore
    } finally {
      setMovingId(null);
    }
  }

  async function makeHomepage(slug: string) {
    setSettingActive(true);
    try {
      const res = await fetch("/api/popups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not set homepage popup");
      }
      await loadPopups();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not set homepage popup");
    } finally {
      setSettingActive(false);
    }
  }

  async function saveLoveItems(slug: string) {
    setSavingLoveItems(true);
    setError(null);
    try {
      const res = await fetch("/api/popups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, loveItems: loveItemsDraft }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not save");
      }
      await loadPopups();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingLoveItems(false);
    }
  }

  if (authenticated !== true) {
    return (
      <HostShell>
        <p className="text-white">Checking access…</p>
      </HostShell>
    );
  }

  const selected = popups.find((p) => p.slug === selectedSlug);

  return (
    <HostShell>
      <h1 className="text-5xl sm:text-6xl">popups</h1>

      <div className="sf-ops-panel mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-sm opacity-80">
            Choose a popup to edit its menu. Mark one as the homepage.
          </p>
          <button
            type="button"
            className="sf-btn-ghost shrink-0"
            onClick={() => logout()}
          >
            host logout
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {popups.map((popup) => (
            <button
              key={popup.slug}
              type="button"
              onClick={() => {
                setSelectedSlug(popup.slug);
                cancelEdit();
                router.replace(`/admin?popup=${popup.slug}`);
              }}
              className={
                popup.slug === selectedSlug
                  ? "sf-btn-primary px-3 py-1"
                  : "sf-nav-pill"
              }
            >
              {popup.name}
              {popup.isActive ? " (homepage)" : ""}
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {selected.isActive ? (
              <span className="opacity-80">This popup is on the homepage.</span>
            ) : (
              <button
                type="button"
                className="sf-btn-ghost"
                onClick={() => makeHomepage(selected.slug)}
                disabled={settingActive}
              >
                {settingActive ? "Saving…" : "Set as homepage"}
              </button>
            )}
            <a href={`/${selected.slug}`} className="sf-btn-ghost">
              View site
            </a>
            <a href={`/${selected.slug}/orders`} className="sf-btn-ghost">
              View queue
            </a>
          </div>
        )}
      </div>

      <div
        className={`sf-ops-panel mt-8 ${
          selectedSlug === "stonefruit"
            ? "sf-ops-panel--stonefruit"
            : selectedSlug === "passion"
              ? "sf-ops-panel--passion"
              : ""
        }`}
      >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          {selected && (
            <p className="mb-1 font-sans text-xs font-bold uppercase tracking-widest opacity-70">
              {selected.name}
            </p>
          )}
          <h2
            className={`${petitCochon.className} sf-ops-menu-title text-4xl sm:text-5xl`}
          >
            menu
          </h2>
        </div>
        <button
          type="button"
          className="sf-btn-primary w-full sm:w-auto"
          onClick={startAdd}
          disabled={!selectedSlug}
        >
          + add item
        </button>
      </div>

      {showForm && (
        <MenuItemForm
          editingId={editingId}
          form={form}
          formError={formError}
          saving={saving}
          decorators={decorators}
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
          slug={selectedSlug}
          items={items}
          orderCounts={orderCounts}
          archiving={archiving}
          movingId={movingId}
          confirm={confirm}
          onMove={moveItem}
          onToggleAvailable={toggleAvailable}
          onEdit={startEdit}
          onArchive={handleArchive}
        />
      )}

      {!loading && !error && (
        <ArchivedMenuSection
          slug={selectedSlug}
          items={archivedItems}
          orderCounts={orderCounts}
          unarchiving={unarchiving}
          confirm={confirm}
          onUnarchive={handleUnarchive}
        />
      )}
      </div>

      {selected && (
        <div
          className={`sf-ops-panel mt-8 ${
            selectedSlug === "stonefruit"
              ? "sf-ops-panel--stonefruit"
              : selectedSlug === "passion"
                ? "sf-ops-panel--passion"
                : ""
          }`}
        >
          <label className="block font-sans text-sm">
            made with love and …
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-ink-800 outline-none"
              value={loveItemsDraft}
              onChange={(e) => setLoveItemsDraft(e.target.value)}
              placeholder="cookies, fruit, pastry"
            />
          </label>
          <p className="mt-1 font-sans text-xs opacity-70">
            comma-separated; one is picked at random in the footer
          </p>
          <button
            type="button"
            className="sf-btn-primary mt-3 px-3 py-1"
            onClick={() => saveLoveItems(selected.slug)}
            disabled={savingLoveItems}
          >
            {savingLoveItems ? "Saving…" : "Save footer line"}
          </button>
        </div>
      )}
    </HostShell>
  );
}
