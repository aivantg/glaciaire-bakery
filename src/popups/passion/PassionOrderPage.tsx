"use client";

import { useOrderPage } from "@/hooks/useOrderPage";
import { OrderMenuSection } from "@/components/order/OrderMenuSection";
import { CustomerNameField } from "@/components/order/CustomerNameField";
import { OrderFooterActions } from "@/components/order/OrderFooterActions";
import { ReviewOrderModal } from "@/components/order/ReviewOrderModal";
import { VenmoPaymentModal } from "@/components/order/VenmoPaymentModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PopupOrderPageProps } from "../types";

export function PassionOrderPage({ slug, ordersPath }: PopupOrderPageProps) {
  const page = useOrderPage({ slug, ordersPath });

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-7xl sm:text-9xl md:text-[12rem] lg:text-[14rem] leading-[0.86] tracking-tighter">
        menu
      </h1>

      <p className="mt-6 sm:mt-10 font-sans font-bold text-ink-900 text-base sm:text-lg max-w-md">
        Pastry + cafe pop-up <br className="sm:hidden" />
        <span className="text-ink-400 font-medium">
          — open whenever the oven&apos;s on.
        </span>
      </p>

      {page.loading ? (
        <LoadingState message="loading menu…" className="mt-14" />
      ) : page.error ? (
        <ErrorState message={page.error} className="mt-14" />
      ) : page.menuItems.length === 0 ? (
        <EmptyState
          message="no goodies right now — check back soon!"
          className="mt-14"
        />
      ) : (
        <form onSubmit={page.goToReview}>
          {page.sections.map(({ category, items }) => (
            <OrderMenuSection
              key={category}
              category={category}
              items={items}
              getAddonIdsForItem={page.getAddonIdsForItem}
              totalQtyForMenuItem={page.totalQtyForMenuItem}
              onAdd={page.addOne}
              onRemove={page.removeMostRecent}
              onToggleAddon={page.toggleAddonSelection}
            />
          ))}

          {page.totalCount > 0 && (
            <CustomerNameField
              value={page.customerName}
              onChange={page.setCustomerName}
            />
          )}

          {page.submitError && (
            <p className="font-sans text-red-500 text-center mt-6">
              {page.submitError}
            </p>
          )}

          <OrderFooterActions
            totalCount={page.totalCount}
            total={page.total}
            hasItems={page.cartItems.length > 0}
            onViewQueue={page.onViewQueue}
          />
        </form>
      )}

      {page.stage === "review" && (
        <ReviewOrderModal
          items={page.cartItems}
          total={page.total}
          customerName={page.trimmedName}
          submitting={page.submitting}
          error={page.submitError}
          onConfirm={page.placeOrder}
          onEdit={() => {
            page.setStage("browse");
            page.setSubmitError(null);
          }}
        />
      )}

      {page.venmoAmount !== null && (
        <VenmoPaymentModal
          amountCents={page.venmoAmount}
          onClose={page.closeVenmoPopup}
        />
      )}
    </div>
  );
}
