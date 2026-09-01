"use client";

import { BarChart3, Boxes, ClipboardList, FilePenLine, LogOut, Megaphone, Menu, PackageCheck, ScanBarcode, Settings, Store, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EmployeeRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/employee/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/employee/pickups", label: "Pickup queue", icon: PackageCheck },
  { href: "/employee/inventory", label: "Inventory", icon: Boxes },
  { href: "/employee/pickups/scan", label: "Pickup scanner", icon: ScanBarcode },
  { href: "/employee/sales", label: "Orders & sales", icon: ClipboardList },
  { href: "/employee/customers", label: "Customers", icon: Users },
  { href: "/employee/promotions", label: "Promotions", icon: Megaphone },
  { href: "/employee/content", label: "Page content", icon: FilePenLine },
  { href: "/employee/settings", label: "Settings", icon: Settings },
] as const;

export function EmployeeShell({ children, email, role }: { children: React.ReactNode; email: string; role: EmployeeRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const links = nav.filter((item) => !(["/employee/customers", "/employee/promotions", "/employee/content", "/employee/settings"].includes(item.href) && role === "employee"));

  useEffect(() => {
    const query = window.matchMedia("(max-width: 980px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!compact || !open) return;

    const previousOverflow = document.body.style.overflow;
    const opener = menuButton.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sidebar.current) return;
      const focusable = [...sidebar.current.querySelectorAll<HTMLElement>("button, a[href]")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButton.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [compact, open]);

  return (
    <div className="employee-shell">
      {compact && open && <button className="ops-menu-scrim" type="button" onClick={() => setOpen(false)} aria-label="Close employee navigation" />}
      <aside ref={sidebar} id="employee-navigation" className={open ? "open" : ""} inert={compact && !open} aria-hidden={compact ? !open : undefined}>
        <button ref={closeButton} className="ops-menu-close" type="button" onClick={() => setOpen(false)} aria-label="Close employee navigation"><X aria-hidden="true" /></button>
        <div className="ops-brand"><span>UNS / OPS</span><div className="ops-brand-name">UP N<br /><em>SMOKE</em></div><b>LIVE</b></div>
        <nav aria-label="Employee operations">
          {links.map(({ href, label, icon: Icon }, index) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn(pathname === href && "active")} aria-current={pathname === href ? "page" : undefined}><small>{String(index + 1).padStart(2, "0")}</small><Icon aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
        <div className="ops-user"><div aria-hidden="true">{email.slice(0, 2).toUpperCase()}</div><span><b>{email}</b><small>{role}</small></span></div>
        <div className="ops-exits"><Link href="/"><Store aria-hidden="true" /> Storefront</Link><form action="/api/auth/logout" method="post"><button><LogOut aria-hidden="true" /> Log out</button></form></div>
      </aside>
      <header className="ops-mobile-head" inert={compact && open} aria-hidden={compact && open}>
        <button ref={menuButton} type="button" onClick={() => setOpen(true)} aria-label="Open employee navigation" aria-expanded={open} aria-controls="employee-navigation"><Menu aria-hidden="true" /></button>
        <b>UNS / STAFF TERMINAL</b>
        <Link href="/" aria-label="Open storefront"><Store aria-hidden="true" /></Link>
      </header>
      <main inert={compact && open}>{children}</main>
    </div>
  );
}
