"use client";

import { BarChart3, Boxes, ClipboardList, LogOut, Menu, PackageCheck, ScanBarcode, Settings, Store, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { EmployeeRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/employee/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/employee/pickups", label: "Pickup queue", icon: PackageCheck },
  { href: "/employee/inventory", label: "Inventory", icon: Boxes },
  { href: "/employee/scanner", label: "Scanner", icon: ScanBarcode },
  { href: "/employee/sales", label: "Orders & sales", icon: ClipboardList },
  { href: "/employee/customers", label: "Customers", icon: Users },
  { href: "/employee/settings", label: "Settings", icon: Settings },
] as const;

export function EmployeeShell({ children, email, role }: { children: React.ReactNode; email: string; role: EmployeeRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = nav.filter((item) => !(["/employee/customers", "/employee/settings"].includes(item.href) && role === "employee"));
  const sidebar = <><div className="ops-brand"><span>UNS / OPS</span><h1>UP N<br /><em>SMOKE</em></h1><b>LIVE</b></div><nav>{links.map(({ href, label, icon: Icon }, index) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn(pathname === href && "active")}><small>{String(index + 1).padStart(2, "0")}</small><Icon /><span>{label}</span></Link>)}</nav><div className="ops-user"><div>{email.slice(0, 2).toUpperCase()}</div><span><b>{email}</b><small>{role}</small></span></div><div className="ops-exits"><Link href="/"><Store /> Storefront</Link><form action="/api/auth/logout" method="post"><button><LogOut /> Log out</button></form></div></>;
  return <div className="employee-shell"><aside className={open ? "open" : ""}>{sidebar}</aside><header className="ops-mobile-head"><button onClick={() => setOpen(true)}><Menu /></button><b>UNS / STAFF TERMINAL</b><Link href="/"><Store /></Link></header>{open && <button className="ops-menu-close" onClick={() => setOpen(false)}><X /></button>}<main>{children}</main></div>;
}
