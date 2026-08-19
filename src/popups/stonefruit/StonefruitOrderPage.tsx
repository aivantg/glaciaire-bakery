"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/format";
import {
  availableAddons,
  formatAddonPrice,
  lineUnitPrice,
} from "@/lib/order-display";
import { useOrderPage } from "@/hooks/useOrderPage";
import { decoratorSrc } from "@/lib/decorator-src";
import type { PopupOrderPageProps } from "../types";

export function StonefruitOrderPage({ slug, ordersPath }: PopupOrderPageProps) {
  const page = useOrderPage({ slug, ordersPath });

  return (
    <div className="pt-4">
      <div className="flex justify-center px-1">
        <Image
          src="/stonefruit/get-st-ned.png"
          alt="Get Stoned"
          width={900}
          height={546}
          className="h-auto w-full max-w-[18rem] sm:max-w-[22rem] drop-shadow-[0_3px_0_rgba(90,120,130,0.18)]"
          priority
        />
      </div>

      {page.loading ? (
        <p className="mt-10 text-center text-white/80">loading menu…</p>
      ) : page.error ? (
        <p className="mt-10 text-center">{page.error}</p>
      ) : page.menuItems.length === 0 ? (
        <p className="mt-10 text-center text-white/80">
          no goodies right now — check back soon!
        </p>
      ) : (
        <form onSubmit={page.goToReview} className="mt-6">
          <ul className="sf-menu-list">
            {page.menuItems.map((item) => {
              const qty = page.totalQtyForMenuItem(item.id);
              const addonIds = page.getAddonIdsForItem(item.id);
              const addons = availableAddons(item);
              return (
                <li key={item.id}>
                  <div className="sf-menu-row">
                    <div className="flex shrink-0 items-center">
                      {item.decorator ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={decoratorSrc(slug, item.decorator)}
                          alt=""
                          className="sf-fruit-icon"
                        />
                      ) : null}
                    </div>
                    <div className="sf-item-copy">
                      <div className="sf-item-name">{item.name}</div>
                      <div className="sf-item-meta">
                        ${formatPrice(item.price)}
                        {item.description ? ` · ${item.description}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="sf-counter-btn"
                        onClick={() => page.removeMostRecent(item)}
                        disabled={qty === 0}
                        aria-label={`Remove ${item.name}`}
                      >
                        −
                      </button>
                      <span className="sf-qty">{qty}</span>
                      <button
                        type="button"
                        className="sf-counter-btn"
                        onClick={() => page.addOne(item, addonIds)}
                        aria-label={`Add ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {addons.length > 0 && (
                    <div className="mt-2 ml-14 flex flex-wrap gap-2">
                      {addons.map((addon) => {
                        const selected = addonIds.includes(addon.id);
                        const price = formatAddonPrice(addon.price);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            className="sf-addon-chip"
                            aria-pressed={selected}
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
                </li>
              );
            })}
          </ul>

          {page.totalCount > 0 && (
            <div className="mt-8">
              <label className="block text-center text-sm tracking-wide uppercase text-white/80">
                your name
                <input
                  type="text"
                  className="sf-name-input mt-1"
                  value={page.customerName}
                  onChange={(e) => page.setCustomerName(e.target.value)}
                  required
                />
              </label>
            </div>
          )}

          {page.submitError && (
            <p className="mt-4 text-center text-red-100">{page.submitError}</p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="submit"
              className="sf-btn-primary"
              disabled={page.cartItems.length === 0}
            >
              {page.totalCount === 0
                ? "add an item"
                : `review order (${page.totalCount}) — $${formatPrice(page.total)}`}
            </button>
          </div>
        </form>
      )}

      {page.stage === "review" && (
        <div
          className="sf-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sf-review-title"
        >
          <div className="sf-modal-card">
            <h2 id="sf-review-title" className="sf-display text-center text-4xl">
              review order
            </h2>
            <p className="mt-2 text-center text-white/85">
              for {page.trimmedName}
            </p>
            <ul className="sf-modal-divider mt-4">
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
              <p className="mt-3 text-center text-red-100">{page.submitError}</p>
            )}
            <div className="mt-5 flex flex-col items-center gap-2">
              <button
                type="button"
                className="sf-btn-primary"
                onClick={page.placeOrder}
                disabled={page.submitting}
              >
                {page.submitting ? "placing order…" : "place order"}
              </button>
              <button
                type="button"
                className="sf-btn-ghost"
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
          className="sf-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sf-pay-title"
        >
          <div className="sf-modal-card text-center">
            <h2 id="sf-pay-title" className="sf-display text-4xl">
              pay
            </h2>
            <p className="mt-3">
              order placed. total ${formatPrice(page.venmoAmount)}.
            </p>
            <p className="mt-2 text-white/80">
              venmo the host, then view the queue.
            </p>
            <button
              type="button"
              className="sf-btn-primary mt-5"
              onClick={page.closeVenmoPopup}
            >
              done, view queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
