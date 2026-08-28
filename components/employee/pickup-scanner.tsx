"use client";

import type { IScannerControls } from "@zxing/browser";
import { Camera, Keyboard, QrCode, Search, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parsePickupQrPayload } from "@/lib/pickup/qr";

export function PickupScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [pickupCode, setPickupCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function stop() { controls.current?.stop(); controls.current = null; setScanning(false); }
  async function resolve(body: { token?: string; order_number?: string }) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/employee/pickups/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to open this pickup.");
      stop(); router.push(`/employee/pickups/${result.verificationId}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to open this pickup."); setBusy(false); }
  }
  async function start() {
    setError(""); setScanning(true);
    if (!navigator.mediaDevices?.getUserMedia) { setError("Camera scanning is not supported in this browser. Use manual order entry."); setScanning(false); return; }
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      controls.current = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, video.current!, (result) => {
        if (!result) return;
        const value = result.getText();
        const code = parsePickupQrPayload(value);
        if (!code) { setError("That is not an Up N Smoke pickup QR code."); return; }
        stop(); void resolve({ token: code });
      });
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : "";
      setError(name === "NotAllowedError" ? "Camera permission was denied. Allow camera access or enter the order number manually." : "The camera could not start. Check browser permissions or use manual entry.");
      setScanning(false);
    }
  }
  useEffect(() => () => controls.current?.stop(), []);

  return <div className="ops-page pickup-scan-page"><header className="ops-heading"><div><span>Secure pickup handoff</span><h1>PICKUP<br /><em>CODE.</em></h1></div><QrCode /></header><div className="pickup-scanner-layout"><section className="pickup-camera"><video ref={video} muted playsInline /><div className="pickup-reticle"><i /><i /><i /><i /><span>LEGACY QR SCANNER</span></div>{scanning ? <Button variant="danger" onClick={stop}><Square /> Stop camera</Button> : <Button size="lg" onClick={() => void start()} disabled={busy}><Camera /> Open legacy QR scanner</Button>}</section><section className="pickup-manual"><Keyboard /><span>Customer pickup</span><h2>ENTER 6-DIGIT PICKUP CODE</h2><form onSubmit={(event) => { event.preventDefault(); void resolve({ token: pickupCode }); }}><label>Pickup code<Input value={pickupCode} onChange={(event) => setPickupCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label><Button disabled={pickupCode.length !== 6 || busy}><Search /> {busy ? "Opening…" : "Open pickup"}</Button></form><form onSubmit={(event) => { event.preventDefault(); void resolve({ order_number: orderNumber }); }}><label>Or enter order number<Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="12345" inputMode="numeric" /></label><Button variant="outline" disabled={!orderNumber.trim() || busy}><Search /> Find by order</Button></form>{error && <p className="pickup-scan-error" role="alert">{error}</p>}</section></div></div>;
}
