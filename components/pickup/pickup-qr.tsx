"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function PickupQr({ token, large = false }: { token: string; large?: boolean }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    void import("qrcode").then(({ toDataURL }) => toDataURL(`UNS-PICKUP:1:${token}`, {
      width: large ? 720 : 420,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#050505", light: "#ffffff" },
    })).then((value) => { if (live) setSrc(value); });
    return () => { live = false; };
  }, [large, token]);
  return <div className={large ? "pickup-qr is-large" : "pickup-qr"}>{src ? <Image src={src} alt="Pickup verification QR code" width={large ? 720 : 420} height={large ? 720 : 420} unoptimized /> : <span>Preparing secure QR…</span>}</div>;
}
