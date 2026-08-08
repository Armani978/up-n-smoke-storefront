"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DataFreshness({ initialUpdatedAt, timeZone, onRefresh }: { initialUpdatedAt: string; timeZone: string; onRefresh: () => Promise<boolean> }) {
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [refreshing, setRefreshing] = useState(false);
  async function refresh() { setRefreshing(true); if (await onRefresh()) setUpdatedAt(new Date().toISOString()); setRefreshing(false); }
  const label = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone }).format(new Date(updatedAt));
  return <div className="data-freshness"><span>Updated {label} · {timeZone}</span><Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}</Button></div>;
}
