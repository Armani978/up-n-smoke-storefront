"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export function DashboardRefresh({ retry = false, auto = true }: { retry?: boolean; auto?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    if (!auto) return;
    const interval = window.setInterval(() => {
      startTransition(() => router.refresh());
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [auto, router]);

  return (
    <button className="ops-refresh" type="button" onClick={refresh} disabled={pending}>
      <RefreshCw aria-hidden="true" className={pending ? "is-spinning" : ""} />
      <span>{pending ? "Refreshing…" : retry ? "Retry connection" : "Refresh data"}</span>
    </button>
  );
}
