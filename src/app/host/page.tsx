import { Suspense } from "react";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { HostShell } from "@/components/host/HostShell";

export default function HostLoginPage() {
  return (
    <HostShell title="Host login">
      <h1 className="text-5xl">host</h1>
      <p className="mt-2 text-white/85">
        Enter the PIN to manage menus and the homepage popup.
      </p>
      <Suspense fallback={null}>
        <HostLoginForm />
      </Suspense>
    </HostShell>
  );
}
