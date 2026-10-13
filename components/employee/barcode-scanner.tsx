"use client";

import type { IScannerControls } from "@zxing/browser";
import { Camera, Keyboard, Search, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function BarcodeScanner({ products }: { products: AdminProduct[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const result = useMemo(() => products.find((product) => [product.sku, product.id, product.variantId].some((value) => value.toLowerCase() === code.trim().toLowerCase())) ?? products.find((product) => product.name.toLowerCase().includes(code.trim().toLowerCase())), [products, code]);

  async function start() {
    setError(""); setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      controls.current = await reader.decodeFromVideoDevice(undefined, video.current!, (scanResult) => {
        if (scanResult) { setCode(scanResult.getText()); stop(); }
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Camera access failed."); setScanning(false);
    }
  }
  function stop() { controls.current?.stop(); controls.current = null; setScanning(false); }
  useEffect(() => () => controls.current?.stop(), []);

  return <div className="ops-page"><header className="ops-heading"><div><span>Live Medusa lookup / camera or keyboard</span><h1>SCAN<br /><em>STATION.</em></h1></div><ScanIcon /></header><div className="scanner-layout"><section className="scanner-stage"><video ref={video} muted playsInline /><div className="scan-reticle"><i /><i /><span>ALIGN BARCODE</span></div><div className="scanner-actions">{scanning ? <Button variant="danger" onClick={stop}><Square /> Stop camera</Button> : <Button onClick={() => void start()}><Camera /> Start camera</Button>}</div>{error && <p className="ops-alert">{error}</p>}</section><section className="manual-scan"><span className="eyebrow"><Keyboard /> Manual lookup</span><label><Search /><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="SCAN OR ENTER SKU" autoFocus /></label>{code && result ? <article className="scan-result"><i style={{ background: result.accent }} /><span>{result.category}</span><h2>{result.name}</h2><dl><div><dt>SKU</dt><dd>{result.sku}</dd></div><div><dt>Price</dt><dd>{formatMoney(result.price)}</dd></div><div><dt>Stock</dt><dd>{result.stock}</dd></div><div><dt>Status</dt><dd>{result.status}</dd></div></dl></article> : code ? <p className="ops-empty">No live Medusa product matches “{code}”.</p> : <p className="ops-empty">A matching product appears here after a scan.</p>}</section></div></div>;
}

function ScanIcon() { return <div className="scan-heading-icon"><Camera /></div>; }
