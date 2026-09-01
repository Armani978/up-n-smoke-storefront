"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import logo from "@/src/assets/up-n-smoke-logo.png";
import { useCart } from "@/components/storefront/cart-provider";

const links = [
  ["/", "Home"],
  ["/menu", "Shop the menu"],
  ["/account", "Account"],
  ["/employee", "Staff access"],
] as const;

const ROLL_STAGGER = 0.028;

function RollingLabel({ children }: { children: string }) {
  const characters = [...children];

  return (
    <span className="menu-roll" aria-label={children}>
      {["primary", "echo"].map((line) => (
        <span className={`menu-roll-line menu-roll-${line}`} aria-hidden="true" key={line}>
          {characters.map((character, index) => {
            const delay = ROLL_STAGGER * Math.abs(index - (characters.length - 1) / 2);
            return (
              <span
                className="menu-roll-character"
                style={{ "--roll-delay": `${delay}s` } as CSSProperties}
                key={`${line}-${character}-${index}`}
              >
                {character === " " ? "\u00a0" : character}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

function categoryHref(category: string) {
  return `/menu?category=${encodeURIComponent(category)}`;
}

export function StoreHeader({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const opener = menuButton.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !menuPanel.current) return;

      const focusable = [...menuPanel.current.querySelectorAll<HTMLElement>("button, a[href]")];
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
  }, [open]);

  return (
    <>
      <div className="store-header-shell">
        <header className="store-header">
          <Link href="/" className="brand-mark" aria-label="UP N SMOKE home">
            <Image src={logo} alt="UP N SMOKE" priority sizes="96px" />
          </Link>
          <div className="header-meta">
            <nav className="header-shortcuts" aria-label="Store shortcuts">
              <Link href="/menu" aria-current={pathname === "/menu" ? "page" : undefined}>Shop</Link>
              <details className="category-popover">
                <summary>Categories</summary>
                <div aria-label="Product categories">
                  {categories.map((category) => <Link key={category} href={categoryHref(category)}>{category}</Link>)}
                </div>
              </details>
              <Link href="/account" aria-current={pathname.startsWith("/account") ? "page" : undefined}>Account</Link>
            </nav>
            <button
              ref={menuButton}
              className="header-icon"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="store-navigation"
            >
              <Menu aria-hidden="true" />
            </button>
            <Link href="/cart" className="header-cart" aria-label={`Cart with ${count} items`}>
              <ShoppingBag aria-hidden="true" />
              <b>{count}</b>
            </Link>
          </div>
        </header>
      </div>

      <button
        className={`menu-scrim ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
      />
      <aside
        ref={menuPanel}
        id="store-navigation"
        className={`menu-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        aria-modal="true"
        role="dialog"
        inert={!open}
      >
        <div className="drawer-head">
          <span><i /> UP N SMOKE / MANCHESTER</span>
          <button ref={closeButton} onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav aria-label="Main navigation">
          {links.map(([href, label], index) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={() => setOpen(false)}>
              <small>0{index + 1}</small>
              <RollingLabel>{label}</RollingLabel>
              <span className="menu-link-mark" aria-hidden="true">↗</span>
            </Link>
          ))}
          {categories.length > 0 && (
            <div className="drawer-categories">
              <span>Categories</span>
              <div>
                {categories.map((category) => (
                  <Link key={category} href={categoryHref(category)} onClick={() => setOpen(false)}>
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
        <div className="drawer-foot">
          <p>Reserve online.<br />Roll in.<br />Pick up.</p>
          <span>655 S Willow St<br />Manchester, NH<br />Pickup in 15-20 min</span>
        </div>
      </aside>
    </>
  );
}
