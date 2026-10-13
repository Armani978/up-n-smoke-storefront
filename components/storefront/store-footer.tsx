import Link from "next/link";

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div>
        <span className="eyebrow">Manchester, New Hampshire</span>
        <h2>GOOD PICKS.<br /><em>ZERO WAIT.</em></h2>
      </div>
      <div className="footer-links">
        <Link href="/menu">Shop the menu</Link>
        <Link href="/account">Customer account</Link>
        <Link href="/employee">Employee portal</Link>
      </div>
      <div className="footer-base">
        <span>© 2026 UP N SMOKE VAPORS</span>
        <span>Valid ID required at pickup.</span>
      </div>
    </footer>
  );
}
