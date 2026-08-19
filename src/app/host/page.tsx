import { Suspense } from "react";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { HostShell } from "@/components/host/HostShell";

export default function HostLoginPage() {
  return (
    <HostShell center>
      <Suspense fallback={null}>
        <HostLoginForm />
      </Suspense>
    </HostShell>
  );
}
