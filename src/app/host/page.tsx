import { Suspense } from "react";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { HostShell } from "@/components/host/HostShell";

export default function HostLoginPage() {
  return (
    <HostShell title="Host login">
      <h1 className="text-2xl font-semibold">Host login</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter the PIN to manage menus and the homepage popup.
      </p>
      <Suspense fallback={null}>
        <HostLoginForm />
      </Suspense>
    </HostShell>
  );
}
