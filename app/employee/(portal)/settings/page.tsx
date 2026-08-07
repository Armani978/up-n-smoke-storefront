import { Database, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { InventoryImport } from "@/components/employee/inventory-import";
import { requireEmployee } from "@/lib/auth/session";
import { medusaHealthy } from "@/lib/medusa/admin";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";

export default async function SettingsPage() {
  const session = await requireEmployee("settings.write");
  const healthy = await medusaHealthy();
  const checks = [
    { label: "Medusa backend", value: healthy ? "Connected" : "Offline", ok: healthy, icon: Database },
    { label: "Employee session", value: "Signed + HttpOnly", ok: true, icon: KeyRound },
    { label: "Role policy", value: session.role, ok: true, icon: ShieldCheck },
    { label: "Clover writes", value: process.env.CLOVER_ALLOW_WRITES === "true" ? "Enabled" : "Locked", ok: process.env.CLOVER_ALLOW_WRITES !== "true", icon: RefreshCw },
  ];
  return <div className="ops-page"><header className="ops-heading"><div><span>Platform configuration / admin</span><h1>SYSTEM<br /><em>READINESS.</em></h1></div><p>{MEDUSA_BACKEND_URL}<br />Server-only configuration</p></header><section className="readiness-grid">{checks.map(({ label, value, ok, icon: Icon }) => <article key={label}><Icon /><span>{label}</span><b>{value}</b><em data-status={ok ? "ready" : "blocked"}>{ok ? "ready" : "blocked"}</em></article>)}</section><InventoryImport /></div>;
}
