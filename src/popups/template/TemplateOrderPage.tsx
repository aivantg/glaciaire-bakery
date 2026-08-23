"use client";

import { formatPrice } from "@/lib/format";
import { formatAddonPrice, lineUnitPrice } from "@/lib/order-display";
import { CATEGORY_LABEL } from "@/lib/menu-labels";
import { availableAddons } from "@/lib/order-display";
import { useOrderPage } from "@/hooks/useOrderPage";
import type { PopupOrderPageProps } from "../types";

export function TemplateOrderPage({ slug, ordersPath }: PopupOrderPageProps) {
  const page = useOrderPage({ slug, ordersPath });

  return (
    <div>
      <h1>Menu</h1>

      {page.loading ? (
        <p>Loading menu…</p>
      ) : page.error ? (
        <p>{page.error}</p>
      ) : page.menuItems.length === 0 ? (
        <p>No items on the menu yet.</p>
      ) : (
        <form onSubmit={page.goToReview}>
          {page.sections.map(({ category, items }) => (
            <section key={category}>
              <h2>{CATEGORY_LABEL[category]}</h2>
              <ul>
                {items.map(({ item }) => {
                  const qty = page.totalQtyForMenuItem(item.id);
                  const addonIds = page.getAddonIdsForItem(item.id);
                  const addons = availableAddons(item);
                  const soldOut = !item.available;
                  return (
                    <li key={item.id} style={soldOut ? { opacity: 0.5 } : undefined}>
                      <div>
                        <strong>{item.name}</strong>
                        {soldOut ? " (sold out)" : ""}
                        {" — $"}
                        {formatPrice(item.price)}
                        {item.description ? ` — ${item.description}` : ""}
                      </div>
                      {addons.length > 0 && !soldOut && (
                        <div>
                          {addons.map((addon) => {
                            const selected = addonIds.includes(addon.id);
                            const price = formatAddonPrice(addon.price);
                            return (
                              <label key={addon.id}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    page.toggleAddonSelection(item.id, addon.id)
                                  }
                                />
                                {addon.name}
                                {price ? ` (${price})` : ""}
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={() => page.removeMostRecent(item)}
                          disabled={soldOut || qty === 0}
                        >
                          −
                        </button>
                        <span> {qty} </span>
                        <button
                          type="button"
                          onClick={() => page.addOne(item, addonIds)}
                          disabled={soldOut}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {page.totalCount > 0 && (
            <div>
              <label>
                Your name{" "}
                <input
                  type="text"
                  value={page.customerName}
                  onChange={(e) => page.setCustomerName(e.target.value)}
                  required
                />
              </label>
            </div>
          )}

          {page.submitError && <p>{page.submitError}</p>}

          <div>
            <button type="submit" disabled={page.cartItems.length === 0}>
              {page.totalCount === 0
                ? "Add an item"
                : `Review order (${page.totalCount}) — $${formatPrice(page.total)}`}
            </button>
            <button type="button" onClick={page.onViewQueue}>
              View queue
            </button>
          </div>
        </form>
      )}

      {page.stage === "review" && (
        <div role="dialog" aria-modal="true" aria-labelledby="template-review-title">
          <h2 id="template-review-title">Review order</h2>
          <p>For {page.trimmedName}</p>
          <ul>
            {page.cartItems.map(({ menuItem, quantity, addonIds }) => {
              const unit = lineUnitPrice(menuItem, addonIds);
              const selected = addonIds
                .map((id) => menuItem.addons.find((a) => a.id === id)?.name)
                .filter(Boolean);
              return (
                <li key={`${menuItem.id}:${addonIds.join(",")}`}>
                  {quantity}× {menuItem.name}
                  {selected.length > 0 ? ` (${selected.join(", ")})` : ""}
                  {" — $"}
                  {formatPrice(unit * quantity)}
                </li>
              );
            })}
          </ul>
          <p>Total ${formatPrice(page.total)}</p>
          {page.submitError && <p>{page.submitError}</p>}
          <button
            type="button"
            onClick={page.placeOrder}
            disabled={page.submitting}
          >
            {page.submitting ? "Placing order…" : "Place order"}
          </button>
          <button
            type="button"
            onClick={() => {
              page.setStage("browse");
              page.setSubmitError(null);
            }}
            disabled={page.submitting}
          >
            Edit order
          </button>
        </div>
      )}

      {page.venmoAmount !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-pay-title"
          onClick={page.closeVenmoPopup}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <h2 id="template-pay-title">Pay</h2>
            <p>Order placed. Total ${formatPrice(page.venmoAmount)}.</p>
            <p>Venmo the host using the bakery QR.</p>
            <button type="button" onClick={page.closeVenmoPopup}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
