"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import logo from "@/src/assets/up-n-smoke-logo.png";
import { useCart } from "@/components/storefront/cart-provider";

const links = [
  ["/", "Home"],
  ["/menu", "Shop all"],
  ["/account", "Account"],
  ["/employee", "Staff access"],
] as const;

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <>
      <header className="store-header">
        <button className="header-icon" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu aria-hidden="true" />
        </button>
        <Link href="/" className="brand-mark" aria-label="UP N SMOKE home">
          <Image src={logo} alt="UP N SMOKE" priority sizes="140px" />
        </Link>
        <div className="header-meta">
          <span className="pickup-promise"><i /> Manchester · pickup in 15–20</span>
          <Link href="/cart" className="header-cart" aria-label={`Cart with ${count} items`}>
            <ShoppingBag aria-hidden="true" />
            <span>Bag</span>
            <b>{count}</b>
          </Link>
        </div>
      </header>

      <div className={`menu-scrim ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`menu-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span>UP N SMOKE / MENU</span>
          <button onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav>
          {links.map(([href, label], index) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={() => setOpen(false)}>
              <small>0{index + 1}</small>
              <span>{label}</span>
              <b>↗</b>
            </Link>
          ))}
        </nav>
        <div className="drawer-foot">
          <p>Reserve online.<br />Roll in.<br />Pick up.</p>
          <span>655 S Willow St<br />Manchester, NH</span>
        </div>
      </aside>
    </>
  );
}
