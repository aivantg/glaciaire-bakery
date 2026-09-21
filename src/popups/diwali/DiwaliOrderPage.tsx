"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/format";
import {
  availableAddons,
  formatAddonPrice,
  lineUnitPrice,
} from "@/lib/order-display";
import { CATEGORY_LABEL } from "@/lib/menu-labels";
import { useOrderPage } from "@/hooks/useOrderPage";
import { decoratorSrc } from "@/lib/decorator-src";
import type { MenuItem } from "@/lib/store";
import type { PopupOrderPageProps } from "../types";

export function DiwaliOrderPage({ slug, ordersPath }: PopupOrderPageProps) {
  const page = useOrderPage({ slug, ordersPath });

  function renderItem(item: MenuItem) {
    const qty = page.totalQtyForMenuItem(item.id);
    const addonIds = page.getAddonIdsForItem(item.id);
    const addons = availableAddons(item);
    const soldOut = !item.available;
    return (
      <li key={item.id}>
        <div
          className={`dw-menu-row${soldOut ? " dw-menu-row--sold-out" : ""}`}
        >
          {item.decorator ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={decoratorSrc(slug, item.decorator)}
              alt=""
              className="dw-sweet-icon"
            />
          ) : null}
          <div className="dw-item-body">
            <div className="dw-item-headline">
              <div className="dw-item-name">
                {item.name}
                {soldOut ? (
                  <span className="dw-sold-out"> sold out</span>
                ) : null}
              </div>
              <div className="dw-item-actions">
                <div className="dw-item-price">${formatPrice(item.price)}</div>
                <div className="dw-item-counter">
                  <button
                    type="button"
                    className="dw-counter-btn"
                    onClick={() => page.removeMostRecent(item)}
                    disabled={soldOut || qty === 0}
                    aria-label={`Remove ${item.name}`}
                  >
                    −
                  </button>
                  <span className="dw-qty">{qty}</span>
                  <button
                    type="button"
                    className="dw-counter-btn"
                    onClick={() => page.addOne(item, addonIds)}
                    disabled={soldOut}
                    aria-label={`Add ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            {item.description ? (
              <div className="dw-item-desc">{item.description}</div>
            ) : null}
            {addons.length > 0 && (
              <div className="dw-item-addons">
                {addons.map((addon) => {
                  const selected = addonIds.includes(addon.id);
                  const price = formatAddonPrice(addon.price);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      className="dw-addon-chip"
                      aria-pressed={selected}
                      disabled={soldOut}
                      onClick={() =>
                        page.toggleAddonSelection(item.id, addon.id)
                      }
                    >
                      {addon.name}
                      {price ? ` ${price}` : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <div className="dw-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/diwali/hero.png"
          alt="Women carrying diyas through a festival of lights"
          className="dw-hero-img"
        />
      </div>

      <div className="dw-lockup">
        <p className="dw-lockup-kicker">glaciaire presents</p>
        <h1 className="dw-lockup-title">DIWALI</h1>
        <p className="dw-lockup-sub">lights · sweets · chaos</p>
      </div>

      {page.loading ? (
        <p className="mt-10 text-center text-white/85">loading mithai…</p>
      ) : page.error ? (
        <p className="mt-10 text-center">{page.error}</p>
      ) : page.menuItems.length === 0 ? (
        <p className="mt-10 text-center text-white/85">
          no sweets yet — the diyas are still warming up!
        </p>
      ) : (
        <form onSubmit={page.goToReview} className="mt-6">
          {page.sections.map(({ category, items }) => (
            <div key={category} className="dw-ops-panel">
              <h2 className="dw-menu-section-title">
                {CATEGORY_LABEL[category]}
              </h2>
              <ul className="dw-menu-list">
                {items.map(({ item }) => renderItem(item))}
              </ul>
            </div>
          ))}

          {page.submitError && (
            <p className="mt-4 text-center text-[#ff6b9d]">{page.submitError}</p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="submit"
              className="dw-btn-primary"
              disabled={page.cartItems.length === 0}
            >
              {page.totalCount === 0
                ? "add a sweet"
                : `review order (${page.totalCount}) — $${formatPrice(page.total)}`}
            </button>
          </div>
        </form>
      )}

      {page.stage === "review" && (
        <div
          className="dw-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dw-review-title"
          onClick={() => {
            if (page.submitting) return;
            page.setStage("browse");
            page.setSubmitError(null);
          }}
        >
          <div
            className="dw-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dw-review-title" className="dw-display text-center text-4xl">
              review order
            </h2>
            <label className="dw-name-panel mt-4 block text-center text-sm tracking-wide uppercase">
              your name
              <input
                type="text"
                className="dw-name-input mt-1"
                value={page.customerName}
                onChange={(e) => {
                  page.setCustomerName(e.target.value);
                  page.setSubmitError(null);
                }}
                autoFocus
                required
              />
            </label>
            <ul className="dw-modal-divider mt-4">
              {page.cartItems.map(({ menuItem, quantity, addonIds }) => {
                const unit = lineUnitPrice(menuItem, addonIds);
                const selected = addonIds
                  .map((id) => menuItem.addons.find((a) => a.id === id)?.name)
                  .filter(Boolean);
                return (
                  <li
                    key={`${menuItem.id}:${addonIds.join(",")}`}
                    className="flex justify-between gap-3 py-2"
                  >
                    <span>
                      {quantity}× {menuItem.name}
                      {selected.length > 0 ? ` (${selected.join(", ")})` : ""}
                    </span>
                    <span>${formatPrice(unit * quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex justify-between text-lg">
              <span>total</span>
              <span>${formatPrice(page.total)}</span>
            </p>
            {page.submitError && (
              <p className="mt-3 text-center text-[#c45c14]">
                {page.submitError}
              </p>
            )}
            <div className="mt-5 flex flex-col items-center gap-2">
              <button
                type="button"
                className="dw-btn-primary"
                onClick={page.placeOrder}
                disabled={page.submitting}
              >
                {page.submitting ? "placing order…" : "place order"}
              </button>
              <button
                type="button"
                className="dw-btn-ghost"
                onClick={() => {
                  page.setStage("browse");
                  page.setSubmitError(null);
                }}
                disabled={page.submitting}
              >
                edit order
              </button>
            </div>
          </div>
        </div>
      )}

      {page.venmoAmount !== null && (
        <div
          className="dw-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dw-pay-title"
          onClick={page.closeVenmoPopup}
        >
          <div
            className="dw-modal-card text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dw-pay-title" className="dw-display text-4xl">
              pay
            </h2>
            <p className="mt-3">
              order placed. total ${formatPrice(page.venmoAmount)}.
            </p>
            <div className="dw-venmo-qr">
              <Image
                src="/venmo.png"
                alt="Venmo QR code"
                width={220}
                height={280}
                className="mx-auto h-auto w-[11.5rem]"
                priority
              />
            </div>
            <p className="mt-2 dw-modal-kicker">venmo the host. shubh diwali!</p>
            <button
              type="button"
              className="dw-btn-primary mt-5"
              onClick={page.closeVenmoPopup}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
